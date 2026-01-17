import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    CheckCircle,
    Clock,
    Download,
    Calendar,
    FileText,
    AlertTriangle,
    Target,
    RefreshCw,
    Filter
} from 'lucide-react'
import { crpApi } from '../../services/api'

interface CRPStats {
    pending_reviews: number
    queries_today: number
    responses_by_tag: Record<string, number>
}

interface TeacherStat {
    id: number
    name: string
    school: string
    status: string
    query_count_week: number
    pending_reflections: number
}

export default function CRPReports() {
    const [stats, setStats] = useState<CRPStats | null>(null)
    const [teachers, setTeachers] = useState<TeacherStat[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('week')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [statsData, teachersData] = await Promise.all([
                crpApi.getStats(),
                crpApi.getTeachers()
            ])
            setStats(statsData)
            setTeachers(teachersData.teachers || [])
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    // Calculate metrics
    const totalQueries = teachers.reduce((sum, t) => sum + t.query_count_week, 0)
    const activeTeachers = teachers.filter(t => t.status === 'active').length
    const inactiveTeachers = teachers.filter(t => t.status === 'inactive').length
    const pendingReflections = teachers.reduce((sum, t) => sum + t.pending_reflections, 0)

    const topTeachers = [...teachers]
        .sort((a, b) => b.query_count_week - a.query_count_week)
        .slice(0, 5)

    const needsAttention = teachers.filter(t => t.status === 'inactive' || t.pending_reflections > 2)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="header-gradient">
                <div className="relative p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white">Reports & Analytics</h1>
                                <p className="text-white/70 mt-1">Track your cluster performance and teacher engagement</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['week', 'month', 'quarter'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p
                                        ? 'bg-white text-emerald-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        <span className="flex items-center text-xs text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12%
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQueries}</p>
                    <p className="text-sm text-gray-500">Total Queries</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Users className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-500">{teachers.length} total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTeachers}</p>
                    <p className="text-sm text-gray-500">Active Teachers</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <span className="flex items-center text-xs text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +5
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pending_reviews || 0}</p>
                    <p className="text-sm text-gray-500">Pending Reviews</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="flex items-center text-xs text-red-600">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            -2
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveTeachers}</p>
                    <p className="text-sm text-gray-500">Inactive Teachers</p>
                </div>
            </div>

            {/* Response Tags Breakdown */}
            {stats?.responses_by_tag && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Categories</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stats.responses_by_tag).map(([tag, count]) => (
                            <div key={tag} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                <p className="text-2xl font-bold text-primary-600">{count}</p>
                                <p className="text-sm text-gray-500 capitalize">{tag.replace('_', ' ')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Active Teachers */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Most Active Teachers
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {topTeachers.map((teacher, idx) => (
                            <div key={teacher.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-500'
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                                        <p className="text-xs text-gray-500">{teacher.school}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-full text-sm font-medium">
                                    {teacher.query_count_week} queries
                                </span>
                            </div>
                        ))}
                        {topTeachers.length === 0 && (
                            <p className="p-4 text-center text-gray-500">No data available</p>
                        )}
                    </div>
                </div>

                {/* Needs Attention */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Needs Attention ({needsAttention.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {needsAttention.slice(0, 5).map(teacher => (
                            <div key={teacher.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                                    <p className="text-xs text-gray-500">{teacher.school}</p>
                                </div>
                                <div className="flex gap-2">
                                    {teacher.status === 'inactive' && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                            Inactive
                                        </span>
                                    )}
                                    {teacher.pending_reflections > 2 && (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                            {teacher.pending_reflections} pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {needsAttention.length === 0 && (
                            <div className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-gray-500">All teachers are on track!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Download Reports */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Weekly Summary</p>
                            <p className="text-xs text-gray-500">PDF format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Teacher Performance</p>
                            <p className="text-xs text-gray-500">Excel format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Target className="w-5 h-5 text-purple-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Action Items</p>
                            <p className="text-xs text-gray-500">PDF format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                </div>
            </div>
        </div>
    )
}
