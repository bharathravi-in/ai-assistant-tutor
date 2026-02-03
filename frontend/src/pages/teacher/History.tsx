import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    History,
    Search,
    Lightbulb,
    Users,
    Clock,
    MessageSquare,
    ExternalLink,
    Sparkles
} from 'lucide-react'
import { teacherApi } from '../../services/api'

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
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMode, setFilterMode] = useState<string | null>(searchParams.get('mode'))

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

    // Navigate to Ask AI with the selected query in a new tab
    const handleQueryClick = (query: Query) => {
        window.open(`/teacher/ask-question?historyId=${query.id}`, '_blank')
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: '#264092' }} />
                    <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8 bg-[#F8F9FB] dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <History className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query History</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{queries.length} total queries • Click to revisit</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search your queries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                            />
                        </div>

                        {/* Mode Filters */}
                        <div className="flex gap-2">
                            {['EXPLAIN', 'ASSIST', 'PLAN'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(filterMode === mode ? null : mode)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterMode === mode ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                                        }`}
                                    style={filterMode === mode ? { background: modeColors[mode] } : {}}
                                >
                                    {modeLabels[mode]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card Grid */}
                {filteredQueries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredQueries.map((query) => {
                            const ModeIcon = modeIcons[query.mode] || MessageSquare
                            return (
                                <button
                                    key={query.id}
                                    onClick={() => handleQueryClick(query)}
                                    className="group text-left bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/30 transition-all active:scale-[0.98]"
                                >
                                    {/* Mode Icon & Badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: `${modeColors[query.mode]}15`, color: modeColors[query.mode] }}
                                        >
                                            <ModeIcon className="w-5 h-5" />
                                        </div>
                                        <span
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                                            style={{ background: `${modeColors[query.mode]}15`, color: modeColors[query.mode] }}
                                        >
                                            {modeLabels[query.mode]}
                                        </span>
                                    </div>

                                    {/* Query Text */}
                                    <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {query.input_text}
                                    </h3>

                                    {/* Timestamp & Open Indicator */}
                                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDate(query.created_at)} • {formatTime(query.created_at)}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No queries yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            Start by asking the AI a question. Your history will appear here for easy access.
                        </p>
                        <button
                            onClick={() => navigate('/teacher/ask-question')}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            Ask AI Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
