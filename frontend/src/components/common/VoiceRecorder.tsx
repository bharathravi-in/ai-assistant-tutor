import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Play, Pause, Loader2, Check } from 'lucide-react'
import { mediaApi } from '../../services/api'

interface VoiceRecorderProps {
    onUploadComplete: (url: string, transcript: string) => void
    purpose: 'reflection' | 'response'
    label?: string
}

export default function VoiceRecorder({ onUploadComplete, purpose, label }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<number | null>(null)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error('Failed to start recording:', err)
            setUploadError('Microphone access denied')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                window.clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    const deleteRecording = () => {
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
        setUploadError(null)
    }

    const handleUpload = async () => {
        if (!audioBlob) return

        setIsUploading(true)
        setUploadError(null)

        try {
            const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
            const response = await mediaApi.uploadVoice(file, purpose)

            if (response.url && response.transcript) {
                onUploadComplete(response.url, response.transcript)
            } else if (response.url) {
                onUploadComplete(response.url, '')
            }
        } catch (err) {
            console.error('Failed to upload voice note:', err)
            setUploadError('Upload failed. Try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-3">
            {label && <label className="text-sm font-medium text-gray-500">{label}</label>}

            <div className={`
                relative p-4 rounded-2xl border-2 transition-all duration-300
                ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}
            `}>
                {!audioBlob ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className={`font-mono text-lg ${isRecording ? 'text-red-500' : 'text-gray-400'}`}>
                                {formatTime(recordingTime)}
                            </span>
                        </div>

                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-transform active:scale-95"
                            >
                                <Mic className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-transform active:scale-95 animate-pulse"
                            >
                                <Square className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (isPlaying) audioPlayerRef.current?.pause()
                                    else audioPlayerRef.current?.play()
                                    setIsPlaying(!isPlaying)
                                }}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <span className="text-xs text-gray-500">Recording saved</span>
                        </div>

                        <audio
                            ref={audioPlayerRef}
                            src={audioUrl || ''}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={deleteRecording}
                                disabled={isUploading}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Use Voice Note</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {uploadError && (
                    <p className="mt-2 text-xs text-red-500 text-center">{uploadError}</p>
                )}
            </div>
        </div>
    )
}
