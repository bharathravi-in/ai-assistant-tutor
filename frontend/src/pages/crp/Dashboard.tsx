import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    MessageSquare,
    User,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react'
import { crpApi } from '../../services/api'
import type { Query } from '../../types'

export default function CRPDashboard() {
    const { t } = useTranslation()
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
    const [stats, setStats] = useState<{
        pending_reviews: number
        queries_today: number
    } | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [queriesData, statsData] = await Promise.all([
                crpApi.getQueries({ page_size: 20 }),
                crpApi.getStats()
            ])
            setQueries(queriesData.items)
            setStats(statsData)
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'explain': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            case 'assist': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            case 'plan': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="card-gradient">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    CRP Dashboard
                </h1>
                <p className="text-white/80 mt-1">
                    Monitor and review teacher queries
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-danger-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {stats?.pending_reviews || 0}
                            </p>
                            <p className="text-sm text-gray-500">Pending Reviews</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {stats?.queries_today || 0}
                            </p>
                            <p className="text-sm text-gray-500">Queries Today</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-500/10 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-success-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {queries.filter(q => q.is_resolved).length}
                            </p>
                            <p className="text-sm text-gray-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Query List */}
            <div className="card">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Teacher Queries
                    </h2>
                    <button className="btn-secondary flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {queries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No queries yet
                        </div>
                    ) : (
                        queries.map((query) => (
                            <div
                                key={query.id}
                                onClick={() => setSelectedQuery(query)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white line-clamp-1">
                                                {query.input_text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getModeColor(query.mode)}`}>
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
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(query.created_at).toLocaleTimeString()}
                                            </div>
                                            {query.requires_crp_review && (
                                                <span className="text-xs text-warning-600 font-medium">Needs Review</span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Query Detail Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-2xl max-h-[80vh] overflow-auto animate-scale-in">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Query Details</h3>
                            <button
                                onClick={() => setSelectedQuery(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Question</label>
                                <p className="text-gray-800 dark:text-white mt-1">{selectedQuery.input_text}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">AI Response</label>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                    {selectedQuery.ai_response || 'No response yet'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1">
                                    Approve Response
                                </button>
                                <button className="btn-secondary flex-1">
                                    Add Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
