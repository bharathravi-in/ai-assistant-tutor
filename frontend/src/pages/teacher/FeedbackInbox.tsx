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
                <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-black text-[#1C1C1E] dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#007AFF] to-[#0051FF] text-white flex items-center justify-center shadow-lg shadow-[#007AFF]/10">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            Academic Surveys
                        </h1>
                    </div>
                    {surveys.length > 0 && (
                        <span className="px-4 py-1.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-black text-[10px] uppercase tracking-widest border border-[#007AFF]/20">
                            {surveys.length} Priority
                        </span>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-[#34C759]/10 border border-[#34C759]/20 rounded-[20px] flex items-center gap-3 text-[#34C759] animate-fade-in shadow-sm">
                        <CheckCircle className="w-5 h-5 font-bold" />
                        <span className="font-bold text-sm tracking-tight">{successMessage}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-[20px] animate-fade-in shadow-sm">
                        <div className="flex items-center gap-3 text-[#FF3B30]">
                            <AlertCircle className="w-5 h-5 font-bold" />
                            <p className="text-sm font-bold tracking-tight">{error}</p>
                        </div>
                    </div>
                )}

                {/* Surveys List */}
                {surveys.length === 0 ? (
                    <div className="text-center py-24 card-highlight">
                        <div className="w-20 h-20 rounded-full bg-[#F2F2F7] dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <ClipboardList className="w-10 h-10 text-[#AEAEB2]" />
                        </div>
                        <h3 className="text-xl font-black text-[#1C1C1E] dark:text-white mb-2">
                            Inbox Clear
                        </h3>
                        <p className="text-sm text-[#8E8E93] font-medium">No pending academic surveys from your CRP/ARP.</p>
                    </div>
                ) : (
                    <div className="card-highlight overflow-hidden animate-fade-in shadow-ios">
                        <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                            {surveys.map((survey) => (
                                <div
                                    key={survey.id}
                                    onClick={() => setSelectedSurvey(survey)}
                                    className="p-4 lg:p-5 hover:bg-[#F2F2F7] dark:hover:bg-white/5 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-[12px] bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                                <ClipboardList className="w-5 h-5 text-[#007AFF]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[#1C1C1E] dark:text-white text-lg truncate mb-1">
                                                    {survey.title}
                                                </h3>
                                                {survey.description && (
                                                    <p className="text-sm text-[#8E8E93] font-medium line-clamp-1">
                                                        {survey.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#AEAEB2] uppercase tracking-widest">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDate(survey.created_at)}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-[#D1D1D6]" />
                                                    <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                                                        {survey.questions?.length || 0} Inquiries
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500] uppercase tracking-widest border border-transparent">
                                                Awaiting
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-[#AEAEB2] group-hover:translate-x-1 transition-transform" />
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-2 lg:p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] w-full max-w-xl max-h-[96vh] shadow-ios flex flex-col overflow-hidden">
                        <div className="relative px-5 py-4 lg:px-6 lg:py-5 bg-gradient-to-br from-[#007AFF] to-[#0051FF]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF9500]/20 blur-[60px] rounded-full -ml-24 -mb-24" />

                            <button
                                onClick={() => {
                                    setSelectedSurvey(null)
                                    setSurveyAnswers({})
                                    setError('')
                                }}
                                className="relative text-white/80 hover:text-white text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 group transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                Back to Inbox
                            </button>
                            <h1 className="relative text-xl lg:text-2xl font-black text-white leading-tight pr-8">{selectedSurvey.title}</h1>
                            {selectedSurvey.description && (
                                <p className="relative text-white/80 mt-1 font-medium text-xs leading-relaxed max-w-xl">{selectedSurvey.description}</p>
                            )}
                        </div>

                        <div className="p-4 lg:p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#F2F2F7]/50 dark:bg-black/20">
                            {selectedSurvey.questions.map((q, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 animate-scale-in">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-bold text-[#1C1C1E] dark:text-white leading-tight pt-1">
                                            {q.question}
                                            {q.required && <span className="text-[#FF3B30] ml-1">*</span>}
                                        </p>
                                    </div>

                                    <div className="ml-8.5">
                                        {q.type === 'text' && (
                                            <textarea
                                                value={surveyAnswers[idx] || ''}
                                                onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-white/5 resize-none text-[#1C1C1E] dark:text-white font-medium text-xs focus:ring-1 focus:ring-[#007AFF] outline-none transition-all placeholder-[#AEAEB2]"
                                                placeholder="Express your pedagogical perspective..."
                                                rows={2}
                                            />
                                        )}

                                        {q.type === 'rating' && (
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setSurveyAnswers(prev => ({ ...prev, [idx]: n }))}
                                                        className={`w-10 h-10 rounded-[10px] font-black text-sm transition-all active:scale-[0.9] ${surveyAnswers[idx] === n
                                                            ? 'bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/20 animate-scale-in'
                                                            : 'bg-white dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 text-[#8E8E93] hover:border-[#007AFF]/20'
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'single_choice' && q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options.map((opt, optIdx) => (
                                                    <label key={optIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-[12px] border cursor-pointer transition-all active:scale-[0.98] ${surveyAnswers[idx] === opt
                                                        ? 'bg-[#007AFF]/10 border-[#007AFF] shadow-sm'
                                                        : 'bg-white dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 hover:border-[#007AFF]/20'
                                                        }`}>
                                                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${surveyAnswers[idx] === opt ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[#AEAEB2] bg-transparent'}`}>
                                                            {surveyAnswers[idx] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            checked={surveyAnswers[idx] === opt}
                                                            onChange={() => setSurveyAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                        />
                                                        <span className={`text-[11px] font-bold ${surveyAnswers[idx] === opt ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'multi_choice' && q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isChecked = (surveyAnswers[idx] || []).includes(opt);
                                                    return (
                                                        <label key={optIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-[12px] border cursor-pointer transition-all active:scale-[0.98] ${isChecked
                                                            ? 'bg-[#007AFF]/10 border-[#007AFF] shadow-sm'
                                                            : 'bg-white dark:bg-white/5 border-[#E5E5EA] dark:border-white/10 hover:border-[#007AFF]/20'
                                                            }`}>
                                                            <div className={`w-3.5 h-3.5 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[#AEAEB2] bg-transparent'}`}>
                                                                {isChecked && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const current = surveyAnswers[idx] || []
                                                                    if (e.target.checked) {
                                                                        setSurveyAnswers(prev => ({ ...prev, [idx]: [...current, opt] }))
                                                                    } else {
                                                                        setSurveyAnswers(prev => ({ ...prev, [idx]: current.filter((v: string) => v !== opt) }))
                                                                    }
                                                                }}
                                                            />
                                                            <span className={`text-[11px] font-bold ${isChecked ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>{opt}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                            <button
                                onClick={handleSubmitSurvey}
                                disabled={submitting}
                                className="w-full py-3 rounded-[14px] bg-gradient-to-r from-[#007AFF] to-[#0051FF] text-white font-black text-[10px] tracking-wider uppercase shadow-md hover:bg-[#0051FF] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        SUBMIT FEEDBACK
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
