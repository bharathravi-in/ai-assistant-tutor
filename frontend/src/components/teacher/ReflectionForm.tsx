import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, MessageSquare, Loader2, Check, Mic } from 'lucide-react'
import { teacherApi } from '../../services/api'
import VoiceRecorder from '../common/VoiceRecorder'

interface ReflectionFormProps {
    queryId: number
    onComplete: () => void
}

export default function ReflectionForm({ queryId, onComplete }: ReflectionFormProps) {
    const { t } = useTranslation()
    const [tried, setTried] = useState<boolean | null>(null)
    const [worked, setWorked] = useState<boolean | null>(null)
    const [feedback, setFeedback] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
    const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
    const [isVoiceMode, setIsVoiceMode] = useState(false)

    const handleSubmit = async () => {
        if (tried === null) return

        setLoading(true)
        try {
            await teacherApi.submitReflection({
                query_id: queryId,
                tried,
                worked: worked ?? undefined,
                text_feedback: feedback || undefined,
                voice_note_url: voiceUrl || undefined,
                voice_note_transcript: voiceTranscript || undefined,
            })
            setSubmitted(true)
            setTimeout(onComplete, 2000)
        } catch (err) {
            console.error('Failed to submit reflection:', err)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="card p-6 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-gray-800 dark:text-white">
                    {t('reflection.thanks')}
                </p>
            </div>
        )
    }

    return (
        <div className="card p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
                {t('reflection.title')}
            </h3>

            {/* Tried question */}
            <div className="mb-6">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('reflection.tried')}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setTried(true)}
                        className={`
              flex-1 py-3 rounded-xl font-medium transition-all duration-200
              ${tried === true
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
            `}
                    >
                        <ThumbsUp className="w-5 h-5 mx-auto" />
                        <span className="block mt-1 text-sm">{t('reflection.yes')}</span>
                    </button>
                    <button
                        onClick={() => setTried(false)}
                        className={`
              flex-1 py-3 rounded-xl font-medium transition-all duration-200
              ${tried === false
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
            `}
                    >
                        <ThumbsDown className="w-5 h-5 mx-auto" />
                        <span className="block mt-1 text-sm">{t('reflection.no')}</span>
                    </button>
                </div>
            </div>

            {/* Worked question (only if tried) */}
            {tried && (
                <div className="mb-6 animate-slide-up">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t('reflection.worked')}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setWorked(true)}
                            className={`
                flex-1 py-3 rounded-xl font-medium transition-all duration-200
                ${worked === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
              `}
                        >
                            {t('reflection.yes')}
                        </button>
                        <button
                            onClick={() => setWorked(false)}
                            className={`
                flex-1 py-3 rounded-xl font-medium transition-all duration-200
                ${worked === false
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
              `}
                        >
                            {t('reflection.no')}
                        </button>
                    </div>
                </div>
            )}

            {/* Optional text feedback */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                        {isVoiceMode ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        {isVoiceMode ? 'Voice Reflection' : t('reflection.feedback')}
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                        className="text-xs text-primary-600 font-medium hover:underline"
                    >
                        {isVoiceMode ? 'Switch to Text' : 'Record Voice Instead'}
                    </button>
                </div>

                {isVoiceMode ? (
                    <div className="space-y-4">
                        <VoiceRecorder
                            purpose="reflection"
                            onUploadComplete={(url, transcript) => {
                                setVoiceUrl(url)
                                setVoiceTranscript(transcript)
                                if (transcript && !feedback) setFeedback(transcript)
                            }}
                        />
                        {voiceTranscript && (
                            <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800 text-sm italic text-gray-600 dark:text-gray-400">
                                <span className="font-bold text-[10px] uppercase block mb-1">Transcript</span>
                                "{voiceTranscript}"
                            </div>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="input min-h-[80px] resize-none"
                        placeholder="What happened in the classroom?..."
                    />
                )}
            </div>

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={tried === null || loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    t('reflection.submit')
                )}
            </button>
        </div>
    )
}
