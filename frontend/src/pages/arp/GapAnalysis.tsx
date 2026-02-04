import { useState, useEffect } from 'react'
import {
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Users,
    MessageSquare,
    Loader2,
    RefreshCw,
    BarChart3,
    PieChart,
    Target,
    Lightbulb
} from 'lucide-react'
import { analyticsApi } from '../../services/api'

interface GapMetrics {
    total_queries: number
    unique_teachers: number
    topics_covered: number
    common_challenges: { topic: string; count: number }[]
    query_by_grade: { grade: number; count: number }[]
    query_by_subject: { subject: string; count: number }[]
    uncovered_topics: string[]
    recommendations: string[]
}

export default function GapAnalysis() {
    const [metrics, setMetrics] = useState<GapMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

    useEffect(() => {
        loadMetrics()
    }, [timeRange])

    const loadMetrics = async () => {
        setLoading(true)
        try {
            const response = await analyticsApi.getArpGapAnalysis(timeRange)
            setMetrics(response)
        } catch (err) {
            console.error('Failed to load gap metrics:', err)
        } finally {
            setLoading(false)
        }
    }

    const maxQueryCount = metrics?.query_by_grade ? Math.max(...metrics.query_by_grade.map(g => g.count)) : 0
    const maxSubjectCount = metrics?.query_by_subject ? Math.max(...metrics.query_by_subject.map(s => s.count)) : 0

    if (loading) {
        return (
            <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Gap Analysis
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Identify training gaps and teacher needs
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last 90 Days</option>
                    </select>
                    <button
                        onClick={loadMetrics}
                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics?.total_queries.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Total Queries</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics?.unique_teachers}</p>
                            <p className="text-xs text-gray-500">Active Teachers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics?.topics_covered}</p>
                            <p className="text-xs text-gray-500">Topics Covered</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics?.uncovered_topics.length}</p>
                            <p className="text-xs text-gray-500">Gap Areas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Common Challenges */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-red-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Common Challenges</h2>
                    </div>
                    <div className="space-y-3">
                        {metrics?.common_challenges.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.topic}</span>
                                        <span className="text-xs text-gray-500">{item.count} queries</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                                            style={{ width: `${(item.count / metrics.common_challenges[0].count) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Queries by Subject */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Queries by Subject</h2>
                    </div>
                    <div className="space-y-3">
                        {metrics?.query_by_subject.map((item, index) => {
                            const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.subject}</span>
                                            <span className="text-xs text-gray-500">{item.count}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index % colors.length]} rounded-full`}
                                                style={{ width: `${(item.count / maxSubjectCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Queries by Grade */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-teal-500" />
                    <h2 className="font-semibold text-gray-800 dark:text-white">Queries by Grade Level</h2>
                </div>
                <div className="flex items-end gap-2 h-48">
                    {metrics?.query_by_grade.map((item) => (
                        <div key={item.grade} className="flex-1 flex flex-col items-center">
                            <div
                                className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-md transition-all duration-500"
                                style={{ height: `${(item.count / maxQueryCount) * 100}%` }}
                            />
                            <span className="text-xs text-gray-500 mt-2">{item.grade}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Uncovered Topics */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Training Gap Areas</h2>
                    </div>
                    <div className="space-y-2">
                        {metrics?.uncovered_topics.map((topic, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                            >
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="text-sm text-orange-800 dark:text-orange-300">{topic}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">AI Recommendations</h2>
                    </div>
                    <div className="space-y-2">
                        {metrics?.recommendations.map((rec, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {index + 1}
                                </span>
                                <span className="text-sm text-blue-800 dark:text-blue-300">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
