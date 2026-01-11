import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, MessageSquare, Loader2, Check } from 'lucide-react'
import { teacherApi } from '../../services/api'

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

    const handleSubmit = async () => {
        if (tried === null) return

        setLoading(true)
        try {
            await teacherApi.submitReflection({
                query_id: queryId,
                tried,
                worked: worked ?? undefined,
                text_feedback: feedback || undefined,
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
                <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    {t('reflection.feedback')}
                </label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input min-h-[80px] resize-none"
                    placeholder="Optional..."
                />
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
