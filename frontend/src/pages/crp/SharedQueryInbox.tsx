import { useState, useEffect } from 'react'
import {
    Inbox,
    MessageSquare,
    CheckCircle,
    Clock,
    Loader2,
    X,
    Send,
    Filter,
    ChevronRight,
    Sparkles
} from 'lucide-react'
import { crpApi } from '../../services/api'

interface SharedQuery {
    id: number
    query_id: number
    teacher_id: number
    teacher_name: string
    input_text: string
    mode: string
    grade: number | null
    subject: string | null
    is_reviewed: boolean
    mentor_notes: string | null
    created_at: string
    reviewed_at: string | null
}

export default function SharedQueryInbox() {
    const [queries, setQueries] = useState<SharedQuery[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all')
    const [selectedQuery, setSelectedQuery] = useState<SharedQuery | null>(null)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [stats, setStats] = useState({ total: 0, pending: 0 })

    useEffect(() => {
        loadQueries()
    }, [filter])

    const loadQueries = async () => {
        setLoading(true)
        try {
            const reviewed = filter === 'pending' ? false : filter === 'reviewed' ? true : undefined
            const response = await crpApi.getSharedQueries({ reviewed })
            setQueries(response.items || [])
            setStats({
                total: response.total || 0,
                pending: response.pending_count || 0
            })
        } catch (err) {
            console.error('Failed to load shared queries:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async () => {
        if (!selectedQuery) return
        setSubmitting(true)

        try {
            await crpApi.reviewSharedQuery(selectedQuery.id, notes || undefined)
            setSelectedQuery(null)
            setNotes('')
            loadQueries()
        } catch (err) {
            console.error('Failed to review query:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'explain': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'assist': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'plan': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <Inbox className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Shared Query Inbox</h1>
                                <p className="text-white/70 text-sm">Review queries shared by teachers</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                                <span className="text-2xl font-bold text-white">{stats.pending}</span>
                                <span className="text-sm text-white/70 ml-1">pending</span>
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                                <span className="text-2xl font-bold text-white">{stats.total}</span>
                                <span className="text-sm text-white/70 ml-1">total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 mr-2">Filter:</span>
                    {(['all', 'pending', 'reviewed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Query List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : queries.length === 0 ? (
                    <div className="p-12 text-center">
                        <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No shared queries yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Queries will appear here when teachers share them
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {queries.map((query) => (
                            <div
                                key={query.id}
                                onClick={() => {
                                    setSelectedQuery(query)
                                    setNotes(query.mentor_notes || '')
                                }}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {query.teacher_name?.charAt(0) || 'T'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {query.teacher_name || 'Unknown Teacher'}
                                                </span>
                                                {query.is_reviewed ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Reviewed
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-4">
                                                {query.input_text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getModeColor(query.mode)}`}>
                                                    {query.mode}
                                                </span>
                                                {query.grade && (
                                                    <span className="text-xs text-gray-500">Grade {query.grade}</span>
                                                )}
                                                {query.subject && (
                                                    <span className="text-xs text-gray-500">{query.subject}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">
                                            {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-xl">
                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Shared Query</h3>
                                        <p className="text-white/70 text-sm">From {selectedQuery.teacher_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-5">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Teacher's Question</label>
                                <p className="text-gray-800 dark:text-white mt-1">{selectedQuery.input_text}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Mode</p>
                                    <p className={`text-sm font-semibold mt-1 ${getModeColor(selectedQuery.mode).replace('bg-', 'text-').split(' ')[1]}`}>
                                        {selectedQuery.mode}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Grade</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                                        {selectedQuery.grade || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Subject</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                                        {selectedQuery.subject || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3.5 h-3.5" /> Your Mentor Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add your observations, suggestions, or encouragement for the teacher..."
                                    className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={4}
                                />
                            </div>

                            {selectedQuery.is_reviewed && selectedQuery.reviewed_at && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                        Reviewed on {new Date(selectedQuery.reviewed_at).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setSelectedQuery(null)}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReview}
                                disabled={submitting}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        {selectedQuery.is_reviewed ? 'Update Review' : 'Mark as Reviewed'}
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
