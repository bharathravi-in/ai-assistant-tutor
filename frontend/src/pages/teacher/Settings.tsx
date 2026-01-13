import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Settings,
    Volume2,
    Play,
    Check,
    Mic,
    User,
    Info,
    Loader2,
    Upload,
    Trash2,
    Square,
    Circle,
    Plus
} from 'lucide-react'
import { settingsApi } from '../../services/api'

// Voice options with ids - using Web Speech API voices
const DEFAULT_VOICES = [
    { id: 'voice-1', name: 'Priya', gender: 'female', language: 'hi-IN', description: 'Warm, friendly female voice', isCustom: false },
    { id: 'voice-2', name: 'Arjun', gender: 'male', language: 'hi-IN', description: 'Clear, professional male voice', isCustom: false },
    { id: 'voice-3', name: 'Divya', gender: 'female', language: 'en-IN', description: 'Soft, Indian English female', isCustom: false },
    { id: 'voice-4', name: 'Ravi', gender: 'male', language: 'en-IN', description: 'Deep, authoritative male voice', isCustom: false },
    { id: 'voice-5', name: 'Ananya', gender: 'female', language: 'ta-IN', description: 'Energetic, Tamil female voice', isCustom: false },
]

interface CustomVoice {
    id: string
    name: string
    gender: 'male' | 'female'
    audioUrl: string
    createdAt: string
}

interface SettingsState {
    selectedVoice: string
    voiceRate: number
    voicePitch: number
    autoPlayResponse: boolean
    customVoices: CustomVoice[]
}

export default function TeacherSettings() {
    const { t } = useTranslation()
    const [settings, setSettings] = useState<SettingsState>({
        selectedVoice: 'voice-1',
        voiceRate: 1,
        voicePitch: 1,
        autoPlayResponse: false,
        customVoices: []
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [playingVoice, setPlayingVoice] = useState<string | null>(null)
    const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)

    // Custom voice recording
    const [showCustomVoiceModal, setShowCustomVoiceModal] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [newVoiceName, setNewVoiceName] = useState('')
    const [newVoiceGender, setNewVoiceGender] = useState<'male' | 'female'>('male')
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
    const [uploadingVoice, setUploadingVoice] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const customVoicesArray = settings.customVoices || []
    const allVoices = [...DEFAULT_VOICES, ...customVoicesArray.map(v => ({
        ...v,
        description: 'Your custom voice',
        language: 'custom',
        isCustom: true
    }))]

    // Load settings from API on mount
    useEffect(() => {
        loadSettings()
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            setSpeechSynthesis(window.speechSynthesis)
        }
    }, [])

    const loadSettings = async () => {
        try {
            const data = await settingsApi.getSettings()
            setSettings({
                selectedVoice: data.selectedVoice || 'voice-1',
                voiceRate: data.voiceRate || 1,
                voicePitch: data.voicePitch || 1,
                autoPlayResponse: data.autoPlayResponse || false,
                customVoices: data.customVoices || []
            })
        } catch (error) {
            console.error('Failed to load settings:', error)
            // Fall back to localStorage if API fails
            try {
                const saved = localStorage.getItem('teacherSettings')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    setSettings({
                        selectedVoice: parsed.selectedVoice || 'voice-1',
                        voiceRate: parsed.voiceRate || 1,
                        voicePitch: parsed.voicePitch || 1,
                        autoPlayResponse: parsed.autoPlayResponse || false,
                        customVoices: parsed.customVoices || []
                    })
                }
            } catch (e) {
                console.error('Failed to load from localStorage:', e)
            }
        } finally {
            setLoading(false)
        }
    }

    const playVoiceSample = (voiceId: string) => {
        // Check if it's a custom voice
        const customVoice = (settings.customVoices || []).find(v => v.id === voiceId)
        if (customVoice && customVoice.audioUrl) {
            setPlayingVoice(voiceId)
            // Prepend API base URL if the audioUrl is a relative path
            const audioUrl = customVoice.audioUrl.startsWith('http')
                ? customVoice.audioUrl
                : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${customVoice.audioUrl}`

            console.log('Playing custom voice:', audioUrl)
            const audio = new Audio(audioUrl)
            audio.onended = () => setPlayingVoice(null)
            audio.onerror = (e) => {
                console.error('Audio playback error:', e)
                setPlayingVoice(null)
                alert('Failed to play audio. Please try re-uploading the voice.')
            }
            audio.play().catch(err => {
                console.error('Audio play failed:', err)
                setPlayingVoice(null)
            })
            return
        }

        if (!speechSynthesis) return
        speechSynthesis.cancel()

        const voice = DEFAULT_VOICES.find(v => v.id === voiceId)
        if (!voice) return

        setPlayingVoice(voiceId)

        const utterance = new SpeechSynthesisUtterance(
            'Hello! I am your AI teaching assistant. I will help you explain concepts to your students.'
        )

        const availableVoices = speechSynthesis.getVoices()
        const matchingVoice = availableVoices.find(v =>
            v.lang.startsWith(voice.language.split('-')[0]) &&
            (voice.gender === 'female' ? v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male') : v.name.toLowerCase().includes('male'))
        ) || availableVoices[0]

        if (matchingVoice) {
            utterance.voice = matchingVoice
        }

        utterance.rate = settings.voiceRate
        utterance.pitch = settings.voicePitch
        utterance.lang = voice.language

        utterance.onend = () => setPlayingVoice(null)
        utterance.onerror = () => setPlayingVoice(null)

        speechSynthesis.speak(utterance)
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setRecordedAudio(audioBlob)
                setRecordedAudioUrl(URL.createObjectURL(audioBlob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingTime(0)

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error('Failed to start recording:', err)
            alert('Could not access microphone. Please allow microphone access.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current)
            }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('audio/')) {
                alert('Please upload an audio file')
                return
            }
            setRecordedAudio(file)
            setRecordedAudioUrl(URL.createObjectURL(file))
        }
    }

    const saveCustomVoice = async () => {
        if (!newVoiceName.trim() || !recordedAudio) {
            alert('Please provide a name and record/upload audio')
            return
        }

        setUploadingVoice(true)
        try {
            const newVoice = await settingsApi.createCustomVoice(newVoiceName, newVoiceGender, recordedAudio)

            setSettings(prev => ({
                ...prev,
                customVoices: [...(prev.customVoices || []), newVoice]
            }))

            // Reset modal
            setShowCustomVoiceModal(false)
            setNewVoiceName('')
            setRecordedAudio(null)
            setRecordedAudioUrl(null)
            setRecordingTime(0)
        } catch (error) {
            console.error('Failed to save custom voice:', error)
            alert('Failed to save custom voice. Please try again.')
        } finally {
            setUploadingVoice(false)
        }
    }

    const deleteCustomVoice = async (voiceId: string) => {
        // Extract numeric ID from "custom-123" format
        const numericId = parseInt(voiceId.replace('custom-', ''))

        try {
            await settingsApi.deleteCustomVoice(numericId)
            setSettings(prev => ({
                ...prev,
                customVoices: (prev.customVoices || []).filter(v => v.id !== voiceId),
                selectedVoice: prev.selectedVoice === voiceId ? 'voice-1' : prev.selectedVoice
            }))
        } catch (error) {
            console.error('Failed to delete custom voice:', error)
            alert('Failed to delete voice. Please try again.')
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await settingsApi.updateSettings({
                selected_voice: settings.selectedVoice,
                voice_rate: settings.voiceRate,
                voice_pitch: settings.voicePitch,
                auto_play_response: settings.autoPlayResponse
            })

            // Also save to localStorage as backup
            localStorage.setItem('teacherSettings', JSON.stringify(settings))

            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (error) {
            console.error('Failed to save settings:', error)
            // Try localStorage only as fallback
            localStorage.setItem('teacherSettings', JSON.stringify(settings))
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    const handleVoiceSelect = (voiceId: string) => {
        setSettings(prev => ({ ...prev, selectedVoice: voiceId }))
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#264092' }} />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div
                    className="relative rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: '#EF951E', transform: 'translate(30%, -40%)' }} />

                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239, 149, 30, 0.9)' }}>
                            <Settings className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
                            <p className="text-white/70">Customize your AI assistant experience</p>
                        </div>
                    </div>
                </div>

                {/* Voice Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                <Volume2 className="w-5 h-5" style={{ color: '#264092' }} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Voice Selection</h2>
                                <p className="text-sm text-gray-500">Choose a voice for AI responses</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCustomVoiceModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Custom Voice</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {allVoices.map((voice) => {
                            const isSelected = settings.selectedVoice === voice.id
                            const isPlaying = playingVoice === voice.id
                            const isCustom = 'isCustom' in voice && voice.isCustom

                            return (
                                <div
                                    key={voice.id}
                                    onClick={() => handleVoiceSelect(voice.id)}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md cursor-pointer ${isSelected
                                        ? 'bg-white dark:bg-gray-700 shadow-lg'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                    style={isSelected ? { borderColor: '#264092' } : { borderColor: 'transparent' }}
                                >
                                    {/* Selected Badge */}
                                    {isSelected && (
                                        <div
                                            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: '#264092' }}
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Custom Badge */}
                                    {isCustom && (
                                        <div className="absolute top-3 right-10">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(239, 149, 30, 0.1)', color: '#EF951E' }}>
                                                Custom
                                            </span>
                                        </div>
                                    )}

                                    {/* Voice Avatar */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: voice.gender === 'female'
                                                    ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                                                    : 'linear-gradient(135deg, #264092 0%, #3451a8 100%)'
                                            }}
                                        >
                                            {isCustom ? <Mic className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{voice.name}</h3>
                                            <span
                                                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                                                style={{
                                                    background: voice.gender === 'female' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(38, 64, 146, 0.1)',
                                                    color: voice.gender === 'female' ? '#ec4899' : '#264092'
                                                }}
                                            >
                                                {voice.gender === 'female' ? 'Female' : 'Male'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        {voice.description}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                playVoiceSample(voice.id)
                                            }}
                                            disabled={isPlaying}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                                            style={{
                                                background: 'rgba(239, 149, 30, 0.1)',
                                                color: '#EF951E'
                                            }}
                                        >
                                            {isPlaying ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Playing...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Preview
                                                </>
                                            )}
                                        </button>

                                        {isCustom && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteCustomVoice(voice.id)
                                                }}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Voice Controls */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Speech Rate
                                </label>
                                <span className="text-sm text-gray-500">{settings.voiceRate.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={settings.voiceRate}
                                onChange={(e) => setSettings(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ background: `linear-gradient(to right, #264092 0%, #264092 ${((settings.voiceRate - 0.5) / 1.5) * 100}%, #e5e7eb ${((settings.voiceRate - 0.5) / 1.5) * 100}%, #e5e7eb 100%)` }}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Voice Pitch
                                </label>
                                <span className="text-sm text-gray-500">{settings.voicePitch.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                value={settings.voicePitch}
                                onChange={(e) => setSettings(prev => ({ ...prev, voicePitch: parseFloat(e.target.value) }))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ background: `linear-gradient(to right, #EF951E 0%, #EF951E ${((settings.voicePitch - 0.5) / 1) * 100}%, #e5e7eb ${((settings.voicePitch - 0.5) / 1) * 100}%, #e5e7eb 100%)` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Auto-Play Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                <Mic className="w-5 h-5" style={{ color: '#264092' }} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">Auto-Play Responses</h3>
                                <p className="text-sm text-gray-500">Automatically read AI responses aloud</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, autoPlayResponse: !prev.autoPlayResponse }))}
                            className="relative w-14 h-7 rounded-full transition-colors"
                            style={{ background: settings.autoPlayResponse ? '#264092' : '#d1d5db' }}
                        >
                            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${settings.autoPlayResponse ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Info Note */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Custom voices are stored securely in the database. Voice settings sync across all your devices.
                    </p>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${saved ? 'bg-green-500' : ''
                        }`}
                    style={!saved ? { background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' } : {}}
                >
                    {saved ? <Check className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                    {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
                </button>
            </div>

            {/* Custom Voice Modal */}
            {showCustomVoiceModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Custom Voice</h2>

                        {/* Voice Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Voice Name
                            </label>
                            <input
                                type="text"
                                value={newVoiceName}
                                onChange={(e) => setNewVoiceName(e.target.value)}
                                placeholder="e.g., My Voice"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all text-gray-800 dark:text-white"
                            />
                        </div>

                        {/* Gender Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Voice Type
                            </label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setNewVoiceGender('male')}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${newVoiceGender === 'male' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                    style={newVoiceGender === 'male' ? { background: '#264092' } : {}}
                                >
                                    Male
                                </button>
                                <button
                                    onClick={() => setNewVoiceGender('female')}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${newVoiceGender === 'female' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                    style={newVoiceGender === 'female' ? { background: '#ec4899' } : {}}
                                >
                                    Female
                                </button>
                            </div>
                        </div>

                        {/* Recording Section */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Record or Upload Voice Sample
                            </label>

                            <div className="flex items-center gap-4 mb-4">
                                {/* Record Button */}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-medium transition-all ${isRecording ? 'bg-red-500 text-white' : ''}`}
                                    style={!isRecording ? { background: 'rgba(38, 64, 146, 0.1)', color: '#264092' } : {}}
                                >
                                    {isRecording ? (
                                        <>
                                            <Square className="w-5 h-5" />
                                            Stop ({formatTime(recordingTime)})
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-5 h-5 text-red-500" />
                                            Record
                                        </>
                                    )}
                                </button>

                                {/* Upload Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-medium transition-all"
                                    style={{ background: 'rgba(239, 149, 30, 0.1)', color: '#EF951E' }}
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* Recorded Audio Preview */}
                            {recordedAudioUrl && (
                                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-green-700 dark:text-green-300 flex-1">Audio recorded/uploaded</span>
                                        <audio src={recordedAudioUrl} controls className="h-10" />
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-3">
                                Record a 10-30 second sample saying: "Hello, I am your AI teaching assistant.
                                I will help you explain concepts to your students in a simple and engaging way."
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCustomVoiceModal(false)
                                    setNewVoiceName('')
                                    setRecordedAudio(null)
                                    setRecordedAudioUrl(null)
                                }}
                                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCustomVoice}
                                disabled={!newVoiceName.trim() || !recordedAudio || uploadingVoice}
                                className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' }}
                            >
                                {uploadingVoice ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : 'Save Voice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
