import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    History,
    Search,
    BookOpen,
    Users,
    ClipboardList,
    MessageSquare,
    Clock,
    ChevronRight,
    Star,
    Trash2,
    ArrowLeft,
    FileQuestion,
    Palette,
    ShieldCheck
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

const modeIcons: Record<string, typeof BookOpen> = {
    EXPLAIN: BookOpen,
    ASSIST: Users,
    PLAN: ClipboardList,
}

const modeColors: Record<string, string> = {
    EXPLAIN: '#264092',
    ASSIST: '#EF951E',
    PLAN: '#22c55e',
}

const modeLabels: Record<string, string> = {
    EXPLAIN: 'Explain',
    ASSIST: 'Assist',
    PLAN: 'Plan',
}

export default function TeacherHistory() {
    const { language: selectedLanguage } = useTranslation()
    const [searchParams] = useSearchParams()
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMode, setFilterMode] = useState<string | null>(searchParams.get('mode'))
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)

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
                {/* Header */}
                <div
                    className="relative rounded-3xl p-6 lg:p-8 text-white overflow-hidden mb-6"
                    style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: '#EF951E', transform: 'translate(30%, -40%)' }} />

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 149, 30, 0.9)' }}>
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold">Query History</h1>
                                <p className="text-white/70">{queries.length} total queries</p>
                            </div>
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
                                                onClick={() => setSelectedQuery(query)}
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
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Detail Header */}
                                <div
                                    className="p-6 text-white"
                                    style={{ background: `linear-gradient(135deg, ${modeColors[selectedQuery.mode]} 0%, ${modeColors[selectedQuery.mode]}dd 100%)` }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => setSelectedQuery(null)}
                                            className="lg:hidden flex items-center gap-2 text-white/80 hover:text-white"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            Back
                                        </button>
                                        <div className="flex gap-2 ml-auto">
                                            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                                                <Star className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-red-200">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/20">
                                            {(() => {
                                                const ModeIcon = modeIcons[selectedQuery.mode] || MessageSquare
                                                return <ModeIcon className="w-6 h-6" />
                                            })()}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-white/80">{modeLabels[selectedQuery.mode]} Mode</span>
                                            <p className="text-xs text-white/60">
                                                {formatDate(selectedQuery.created_at)} at {formatTime(selectedQuery.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Question</h3>
                                    <p className="text-gray-800 dark:text-white">{selectedQuery.input_text}</p>
                                </div>

                                {/* Response */}
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">AI Response</h3>
                                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        <StructuredAIResponse
                                            content={selectedQuery.ai_response || 'No response available.'}
                                            structured={selectedQuery.structured}
                                            topic={selectedQuery.input_text}
                                            language={selectedLanguage}
                                        />
                                    </div>
                                </div>


                                {/* Action Buttons */}
                                <div className="p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=quiz&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20"
                                        >
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <FileQuestion className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-semibold text-sm">Generate Quiz</span>
                                                <p className="text-xs text-white/70">Create assessment</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=tlm&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20"
                                        >
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <Palette className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-semibold text-sm">Design TLM</span>
                                                <p className="text-xs text-white/70">Visual aids</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => window.location.href = `/teacher?mode=audit&topic=${encodeURIComponent(selectedQuery.input_text)}`}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/20"
                                        >
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-semibold text-sm">NCERT Audit</span>
                                                <p className="text-xs text-white/70">Check compliance</p>
                                            </div>
                                        </button>
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
