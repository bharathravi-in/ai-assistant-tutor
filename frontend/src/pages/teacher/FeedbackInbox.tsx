import { useState, useEffect } from 'react'
import {
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Send,
    Loader2,
    ClipboardList
} from 'lucide-react'
import { surveyApi } from '../../services/api'

// Types
interface Survey {
    id: number
    title: string
    description: string | null
    questions: SurveyQuestion[]
    status: string
    created_at: string
}

interface SurveyQuestion {
    question: string
    type: 'text' | 'rating' | 'single_choice' | 'multi_choice'
    options?: string[]
    required: boolean
}

export default function SurveyInbox() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
    const [surveyAnswers, setSurveyAnswers] = useState<Record<number, any>>({})
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        fetchSurveys()
    }, [])

    const fetchSurveys = async () => {
        try {
            const data = await surveyApi.getAssigned()
            setSurveys(Array.isArray(data) ? data : (data.items || []))
        } catch (err: any) {
            console.error('Failed to fetch surveys:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitSurvey = async () => {
        if (!selectedSurvey) return

        // Validate required answers
        const unanswered = selectedSurvey.questions.filter(
            (q, idx) => q.required && !surveyAnswers[idx]
        )
        if (unanswered.length > 0) {
            setError('Please answer all required questions')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            const answersArray = Object.entries(surveyAnswers).map(([idx, answer]) => ({
                question_index: parseInt(idx),
                answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
            }))
            await surveyApi.submitResponse({
                survey_id: selectedSurvey.id,
                answers: answersArray
            })
            setSelectedSurvey(null)
            setSurveyAnswers({})
            fetchSurveys()
            setSuccessMessage('Survey submitted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit survey')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            Surveys
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Respond to surveys assigned by your CRP/ARP
                        </p>
                    </div>
                    {surveys.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium text-sm">
                            {surveys.length} pending
                        </span>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Surveys List */}
                {surveys.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No pending surveys
                        </h3>
                        <p className="text-gray-500">Surveys assigned by your CRP/ARP will appear here.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {surveys.map((survey) => (
                                <div
                                    key={survey.id}
                                    onClick={() => setSelectedSurvey(survey)}
                                    className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                                <ClipboardList className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {survey.title}
                                                </h3>
                                                {survey.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                        {survey.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDate(survey.created_at)}
                                                    </span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{survey.questions?.length || 0} questions</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                Pending
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Survey Response Modal */}
            {selectedSurvey && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                            <button
                                onClick={() => {
                                    setSelectedSurvey(null)
                                    setSurveyAnswers({})
                                    setError('')
                                }}
                                className="text-white/70 hover:text-white text-sm mb-2 flex items-center gap-1"
                            >
                                ← Back to surveys
                            </button>
                            <h1 className="text-2xl font-bold text-white">{selectedSurvey.title}</h1>
                            {selectedSurvey.description && (
                                <p className="text-white/70 mt-1">{selectedSurvey.description}</p>
                            )}
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
                            {selectedSurvey.questions.map((q, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {q.question}
                                            {q.required && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                    </div>

                                    {q.type === 'text' && (
                                        <textarea
                                            value={surveyAnswers[idx] || ''}
                                            onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Type your answer..."
                                            rows={3}
                                        />
                                    )}

                                    {q.type === 'rating' && (
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setSurveyAnswers(prev => ({ ...prev, [idx]: n }))}
                                                    className={`w-12 h-12 rounded-xl font-bold transition-all ${surveyAnswers[idx] === n
                                                        ? 'bg-orange-500 text-white shadow-lg'
                                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-orange-300'
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'single_choice' && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((opt, optIdx) => (
                                                <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${surveyAnswers[idx] === opt
                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-orange-300'
                                                    }`}>
                                                    <input
                                                        type="radio"
                                                        name={`survey-question-${idx}`}
                                                        checked={surveyAnswers[idx] === opt}
                                                        onChange={() => setSurveyAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'multi_choice' && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((opt, optIdx) => (
                                                <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(surveyAnswers[idx] || []).includes(opt)
                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-orange-300'
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(surveyAnswers[idx] || []).includes(opt)}
                                                        onChange={(e) => {
                                                            const current = surveyAnswers[idx] || []
                                                            if (e.target.checked) {
                                                                setSurveyAnswers(prev => ({ ...prev, [idx]: [...current, opt] }))
                                                            } else {
                                                                setSurveyAnswers(prev => ({ ...prev, [idx]: current.filter((v: string) => v !== opt) }))
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleSubmitSurvey}
                                disabled={submitting}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Survey
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
