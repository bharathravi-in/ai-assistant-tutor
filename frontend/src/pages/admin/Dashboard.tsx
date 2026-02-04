import { useState, useEffect } from 'react'
import {
    Users,
    MessageSquare,
    TrendingUp,
    Clock,
    BarChart3,
    AlertTriangle,
    School,
    Heart
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import type { AdminDashboard as AdminDashboardType } from '../../types'

interface ClassroomContext {
    context_distribution: { multigrade: number; single_grade: number }
    class_size_distribution: Record<string, number>
    success_by_context: {
        multigrade: { total: number; worked: number; rate: number }
        single_grade: { total: number; worked: number; rate: number }
    }
}

interface SentimentAnalytics {
    total_analyzed: number
    sentiments: Record<string, { count: number; percentage: number }>
}

interface TrainingGap {
    subject: string
    grade: number
    total_reflections: number
    worked: number
    success_rate: number
    needs_attention: boolean
}

interface TrainingGapsData {
    training_gaps: TrainingGap[]
    total_gaps_identified: number
}

export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null)
    const [classroomContext, setClassroomContext] = useState<ClassroomContext | null>(null)
    const [sentiment, setSentiment] = useState<SentimentAnalytics | null>(null)
    const [trainingGaps, setTrainingGaps] = useState<TrainingGapsData | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const [data, ctx, sent, gaps] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getClassroomContextAnalytics(),
                adminApi.getReflectionSentimentAnalytics(),
                adminApi.getTrainingGaps(5)
            ])
            setDashboard(data)
            setClassroomContext(ctx)
            setSentiment(sent)
            setTrainingGaps(gaps)
        } catch (err) {
            console.error('Failed to load dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
            </div>
        )
    }

    if (!dashboard) {
        return (
            <div className="text-center text-gray-500 py-10">
                Failed to load dashboard
            </div>
        )
    }

    const sentimentColors: Record<string, string> = {
        positive: 'bg-green-500',
        encouraging: 'bg-emerald-500',
        neutral: 'bg-gray-400',
        frustrated: 'bg-orange-500',
        critical: 'bg-red-500',
        growth_oriented: 'bg-blue-500',
    }

    return (
        <div className="p-4 lg:p-6 space-y-8 animate-fade-in">
            {/* Dashboard Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden animate-fade-in p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                DIET Analytics Hub
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">
                                Evidence-based insights and educational performance monitoring
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                {dashboard.total_users}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="badge-primary">
                            Teachers: {dashboard.users_by_role.teacher}
                        </span>
                        <span className="badge-primary">
                            CRP: {dashboard.users_by_role.crp}
                        </span>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Queries</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                {dashboard.total_queries}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="badge-success">
                            +{dashboard.queries_this_week} this week
                        </span>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Success Rate</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                {dashboard.success_rate}%
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${dashboard.success_rate}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Response Time</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                {(dashboard.avg_response_time_ms / 1000).toFixed(1)}s
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Target: &lt; 2 minutes
                    </div>
                </div>
            </div>

            {/* DIET Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Classroom Context */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <School className="w-5 h-5 text-primary-500" />
                        Classroom Context
                    </h3>
                    {classroomContext && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Multigrade</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {classroomContext.context_distribution.multigrade}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        {classroomContext.success_by_context.multigrade.rate}% success
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Single Grade</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {classroomContext.context_distribution.single_grade}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {classroomContext.success_by_context.single_grade.rate}% success
                                    </span>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Class Size Distribution</p>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {Object.entries(classroomContext.class_size_distribution).map(([size, count]) => (
                                        <div key={size} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">{count}</p>
                                            <p className="text-[10px] text-gray-500 capitalize">{size.replace('_', ' ')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reflection Sentiment */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        Teacher Sentiment
                    </h3>
                    {sentiment && sentiment.total_analyzed > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">{sentiment.total_analyzed} reflections analyzed</p>
                            {Object.entries(sentiment.sentiments).map(([name, data]) => (
                                <div key={name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{name.replace('_', ' ')}</span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">{data.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`${sentimentColors[name] || 'bg-gray-400'} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${data.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No sentiment data yet</p>
                    )}
                </div>

                {/* Training Gaps */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning-500" />
                        Training Gaps
                    </h3>
                    {trainingGaps && trainingGaps.training_gaps.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">{trainingGaps.total_gaps_identified} areas need attention</p>
                            {trainingGaps.training_gaps.map((gap, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white text-sm">{gap.subject}</p>
                                        <p className="text-xs text-gray-500">Grade {gap.grade}</p>
                                    </div>
                                    <span className={`text-sm font-bold px-2 py-1 rounded-lg ${gap.needs_attention
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {gap.success_rate}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No training gaps identified</p>
                    )}
                </div>
            </div>

            {/* Users by Role */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        Users by Role
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(dashboard.users_by_role).map(([role, count]) => (
                            <div key={role}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role}</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${(count / dashboard.total_users) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="card-hover p-4 text-left group">
                            <Users className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-800 dark:text-white">Manage Users</p>
                            <p className="text-xs text-gray-500">View and edit users</p>
                        </button>
                        <button className="card-hover p-4 text-left group">
                            <MessageSquare className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-800 dark:text-white">View Queries</p>
                            <p className="text-xs text-gray-500">Browse all queries</p>
                        </button>
                        <button className="card-hover p-4 text-left group">
                            <BarChart3 className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-800 dark:text-white">Analytics</p>
                            <p className="text-xs text-gray-500">Detailed reports</p>
                        </button>
                        <button
                            onClick={() => navigate('/admin/state-analytics')}
                            className="card-hover p-4 text-left group"
                        >
                            <TrendingUp className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-800 dark:text-white">State Oversight</p>
                            <p className="text-xs text-gray-500">Regional trends</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
