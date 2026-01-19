import { useState, useEffect } from 'react'
import {
    ClipboardList,
    Loader2,
    CheckCircle,
    ChevronRight,
    Clock,
    Send
} from 'lucide-react'
import { surveyApi } from '../../services/api'

interface Survey {
    id: number
    title: string
    description: string | null
    questions: Question[]
    status: string
    created_at: string
}

interface Question {
    question: string
    type: 'text' | 'rating' | 'single_choice' | 'multi_choice'
    options?: string[]
    required: boolean
}

export default function TeacherSurveys() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
    const [answers, setAnswers] = useState<Record<number, any>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        loadSurveys()
    }, [])

    const loadSurveys = async () => {
        try {
            const data = await surveyApi.getAssigned()
            setSurveys(Array.isArray(data) ? data : (data.items || []))
        } catch (err) {
            console.error('Failed to load surveys:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selectedSurvey) return
        setSubmitting(true)

        try {
            // Convert answers to array format required by API
            const answersArray = Object.entries(answers).map(([idx, answer]) => ({
                question_index: parseInt(idx),
                answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
            }))
            await surveyApi.submitResponse({
                survey_id: selectedSurvey.id,
                answers: answersArray
            })
            setSubmitted(true)
            setSelectedSurvey(null)
            setAnswers({})
            loadSurveys() // Refresh list
        } catch (err) {
            console.error('Failed to submit survey:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const updateAnswer = (questionIndex: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading surveys...</p>
                </div>
            </div>
        )
    }

    // Survey taking view
    if (selectedSurvey) {
        return (
            <div className="p-4 lg:p-6 animate-fade-in max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="header-gradient p-6">
                        <button
                            onClick={() => setSelectedSurvey(null)}
                            className="text-white/70 hover:text-white text-sm mb-2 flex items-center gap-1"
                        >
                            ← Back to surveys
                        </button>
                        <h1 className="text-2xl font-bold text-white">{selectedSurvey.title}</h1>
                        {selectedSurvey.description && (
                            <p className="text-white/70 mt-1">{selectedSurvey.description}</p>
                        )}
                    </div>

                    {/* Questions */}
                    <div className="p-6 space-y-6">
                        {selectedSurvey.questions.map((q, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {q.question}
                                        {q.required && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                </div>

                                {/* Text answer */}
                                {q.type === 'text' && (
                                    <textarea
                                        value={answers[idx] || ''}
                                        onChange={(e) => updateAnswer(idx, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                                        placeholder="Type your answer..."
                                        rows={3}
                                    />
                                )}

                                {/* Rating */}
                                {q.type === 'rating' && (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => updateAnswer(idx, n)}
                                                className={`w-12 h-12 rounded-xl font-bold transition-all ${answers[idx] === n
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                                                    }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Single choice */}
                                {q.type === 'single_choice' && q.options && (
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => (
                                            <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-300 transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`question-${idx}`}
                                                    checked={answers[idx] === opt}
                                                    onChange={() => updateAnswer(idx, opt)}
                                                    className="w-4 h-4 text-primary-500"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Multi choice */}
                                {q.type === 'multi_choice' && q.options && (
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => (
                                            <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-300 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(answers[idx] || []).includes(opt)}
                                                    onChange={(e) => {
                                                        const current = answers[idx] || []
                                                        if (e.target.checked) {
                                                            updateAnswer(idx, [...current, opt])
                                                        } else {
                                                            updateAnswer(idx, current.filter((v: string) => v !== opt))
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-primary-500"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Submit */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
        )
    }

    // Survey list view
    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Surveys</h1>
                            <p className="text-white/70 text-sm">Complete surveys assigned to you</p>
                        </div>
                    </div>
                </div>
            </div>

            {submitted && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Survey submitted successfully!</span>
                </div>
            )}

            {/* Survey List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {surveys.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No pending surveys</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Surveys assigned by your CRP/ARP will appear here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {surveys.map((survey) => (
                            <div
                                key={survey.id}
                                onClick={() => setSelectedSurvey(survey)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <ClipboardList className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {survey.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{new Date(survey.created_at).toLocaleDateString('en-IN')}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{survey.questions?.length || 0} questions</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                            Pending
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
