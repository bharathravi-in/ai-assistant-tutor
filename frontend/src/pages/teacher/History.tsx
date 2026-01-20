import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    History,
    Search,
    Lightbulb,
    Users,
    Clock,
    MessageSquare,
    ChevronRight,
    Star,
    Trash2,
    ArrowLeft,
    FileQuestion,
    Palette,
    ShieldCheck,
    Sparkles,
    CheckCircle,
    Loader2
} from 'lucide-react'
import { teacherApi } from '../../services/api'
import StructuredAIResponse from '../../components/common/StructuredAIResponse'
import useTranslation from '../../hooks/useTranslation'

interface Query {
    id: number
    mode: string  // Can be "EXPLAIN" | "explain" etc
    input_text: string
    ai_response: string
    structured?: any  // Structured response data for card display
    created_at: string
}

const modeIcons: Record<string, typeof Lightbulb> = {
    EXPLAIN: Lightbulb,
    ASSIST: Users,
    PLAN: Clock,
}

const modeColors: Record<string, string> = {
    EXPLAIN: '#2563EB',
    ASSIST: '#059669',
    PLAN: '#7C3AED',
}

const modeLabels: Record<string, string> = {
    EXPLAIN: 'Explain',
    ASSIST: 'Assist',
    PLAN: 'Plan',
}

export default function TeacherHistory() {
    const { language: selectedLanguage } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMode, setFilterMode] = useState<string | null>(searchParams.get('mode'))
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)

    // Redirect to Ask AI page with history ID
    const handleViewQuery = (query: Query) => {
        navigate(`/teacher/ask-question?historyId=${query.id}`)
    }


    // Reflection state
    const [reflectionRating, setReflectionRating] = useState<number | null>(null)
    const [reflectionSubmitted, setReflectionSubmitted] = useState(false)
    const [submittingReflection, setSubmittingReflection] = useState(false)

    // Reset reflection state when selected query changes
    useEffect(() => {
        setReflectionSubmitted(false)
        setReflectionRating(null)
    }, [selectedQuery])

    // Submit reflection to backend
    const handleReflectionSubmit = async () => {
        if (reflectionRating === null || !selectedQuery?.id) return

        setSubmittingReflection(true)
        try {
            await teacherApi.submitReflection({
                query_id: selectedQuery.id,
                tried: true,
                worked: reflectionRating >= 3,
                text_feedback: `Rating: ${reflectionRating}/5`
            })
            setReflectionSubmitted(true)
        } catch (err: any) {
            console.error('Failed to submit reflection:', err)
            // Still show success if it's a duplicate error
            if (err.response?.status === 400 && err.response?.data?.detail?.includes('already exists')) {
                setReflectionSubmitted(true)
            }
        } finally {
            setSubmittingReflection(false)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const data = await teacherApi.getQueries({ page_size: 50 })
            // Map API response to local Query type
            setQueries((data.items || []).map((item: any) => ({
                id: item.id,
                mode: item.mode?.toUpperCase() || 'EXPLAIN',
                input_text: item.input_text || '',
                ai_response: item.ai_response || '',
                structured: item.structured,
                created_at: item.created_at
            })))
        } catch (error) {
            console.error('Failed to load history:', error)
            setQueries([])
        } finally {
            setLoading(false)
        }
    }

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.input_text.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesMode = !filterMode || q.mode === filterMode
        return matchesSearch && matchesMode
    })

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const groupQueriesByDate = (queries: Query[]) => {
        const groups: Record<string, Query[]> = {}
        queries.forEach(query => {
            const dateKey = formatDate(query.created_at)
            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(query)
        })
        return groups
    }

    const groupedQueries = groupQueriesByDate(filteredQueries)

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: '#264092' }} />
                    <p className="text-gray-500">Loading history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header - Consistent with AskQuestion.tsx */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <History className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Query History</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{queries.length} total queries found</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search your queries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:outline-none focus:ring-2 transition-all"
                                style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                            />
                        </div>

                        {/* Mode Filters */}
                        <div className="flex gap-2">
                            {['EXPLAIN', 'ASSIST', 'PLAN'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(filterMode === mode ? null : mode)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterMode === mode ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    style={filterMode === mode ? { background: modeColors[mode] } : {}}
                                >
                                    {modeLabels[mode]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Query List */}
                    <div className={`${selectedQuery ? 'hidden lg:block' : ''} lg:col-span-1 space-y-4`}>
                        {Object.entries(groupedQueries).map(([date, dateQueries]) => (
                            <div key={date}>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">{date}</h3>
                                <div className="space-y-2">
                                    {dateQueries.map((query) => {
                                        const ModeIcon = modeIcons[query.mode] || MessageSquare
                                        const isSelected = selectedQuery?.id === query.id
                                        return (
                                            <button
                                                key={query.id}
                                                onClick={() => handleViewQuery(query)}
                                                className={`w-full text-left bg-white dark:bg-gray-800 p-4 rounded-2xl border transition-all hover:shadow-md ${isSelected ? 'shadow-lg' : 'border-gray-100 dark:border-gray-700'
                                                    }`}
                                                style={isSelected ? { borderColor: modeColors[query.mode] } : {}}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="p-2 rounded-xl flex-shrink-0"
                                                        style={{ background: `${modeColors[query.mode]}15`, color: modeColors[query.mode] }}
                                                    >
                                                        <ModeIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-800 dark:text-white font-medium line-clamp-2 text-sm">
                                                            {query.input_text}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-xs text-gray-400">{formatTime(query.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredQueries.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No queries found</p>
                                <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
                            </div>
                        )}
                    </div>

                    {/* Query Detail */}
                    <div className={`${selectedQuery ? '' : 'hidden lg:block'} lg:col-span-2`}>
                        {selectedQuery ? (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header - matching AskQuestion.tsx style */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedQuery(null)}
                                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">AI Response</h3>
                                            <p className="text-xs text-gray-500 capitalize">Mode: {modeLabels[selectedQuery.mode]} • {formatDate(selectedQuery.created_at)} at {formatTime(selectedQuery.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </button>
                                        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                            <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Your Question - highlighted background like AskQuestion.tsx */}
                                <div className="px-6 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Your Question</p>
                                    <p className="text-gray-800 dark:text-white">{selectedQuery.input_text}</p>
                                </div>

                                {/* Response Content */}
                                <div className="p-6">
                                    <div className="overflow-y-auto custom-scrollbar">
                                        <StructuredAIResponse
                                            content={selectedQuery.ai_response || 'No response available.'}
                                            structured={selectedQuery.structured}
                                            topic={selectedQuery.input_text}
                                            language={selectedLanguage}
                                        />
                                    </div>
                                </div>

                                {/* Quick Actions - horizontal layout like AskQuestion.tsx */}
                                <div className="px-6 pb-6">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=quiz&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                                        >
                                            <FileQuestion className="w-5 h-5" />
                                            Generate Quiz
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=tlm&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all"
                                        >
                                            <Palette className="w-5 h-5" />
                                            Design TLM
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=audit&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:shadow-lg transition-all"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            NCERT Audit
                                        </button>
                                    </div>
                                </div>

                                {/* Reflection Section - matching AskQuestion.tsx */}
                                <div className="px-6 py-8 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                    <div className="max-w-xl mx-auto text-center">
                                        {!reflectionSubmitted ? (
                                            <>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How was this response?</h4>
                                                <p className="text-sm text-gray-500 mb-6">Your feedback helps us improve the AI for your classroom needs.</p>

                                                <div className="flex items-center justify-center gap-2 mb-8">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setReflectionRating(star)}
                                                            className={`p-2 transition-all transform hover:scale-110 ${(reflectionRating || 0) >= star
                                                                ? 'text-yellow-400'
                                                                : 'text-gray-300 dark:text-gray-600'
                                                                }`}
                                                        >
                                                            <Star className={`w-8 h-8 ${(reflectionRating || 0) >= star ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={handleReflectionSubmit}
                                                    disabled={reflectionRating === null || submittingReflection}
                                                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50"
                                                >
                                                    {submittingReflection ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        'Submit Feedback'
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                                </div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Thank you!</h4>
                                                <p className="text-gray-500 dark:text-gray-400">Your feedback has been recorded.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                    <MessageSquare className="w-10 h-10" style={{ color: '#264092' }} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Select a query</h3>
                                <p className="text-gray-500 dark:text-gray-400">Click on any query from the list to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
