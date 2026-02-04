import { useState, useEffect } from 'react'
import {
    MapPin,
    TrendingUp,
    MessageSquare,
    CheckCircle,
    BarChart3,
    Users,
    Loader2,
    Calendar,
    ChevronDown
} from 'lucide-react'
import { analyticsApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

interface DistrictActivity {
    district: string
    count: number
}

interface TopTopic {
    topic: string
    count: number
}

interface StateAnalyticsData {
    state_id: number
    period_days: number
    total_queries: number
    success_rate: number
    district_activity: DistrictActivity[]
    top_topics: TopTopic[]
}

export default function StateAnalytics() {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)
    const [data, setData] = useState<StateAnalyticsData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const stateId = user?.state_id || 1 // Fallback to 1 for demo

    useEffect(() => {
        loadData()
    }, [days, stateId])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await analyticsApi.getStateAnalytics(stateId, days)
            setData(res)
        } catch (err) {
            console.error('Failed to load state analytics:', err)
            setError('Failed to load state-level insights. Are you registered to a state?')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                >
                    Retry
                </button>
            </div>
        )
    }

    const maxActivity = data?.district_activity[0]?.count || 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <MapPin className="w-7 h-7 text-primary-500" />
                        State Oversight Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">
                        Regional performance and engagement monitoring
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Engagement</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {data?.total_queries.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        Queries across all districts
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Solution Success Rate</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {data?.success_rate}%
                    </div>
                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${data?.success_rate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Active Districts</span>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {data?.district_activity.length}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Reporting activity this period
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* District Heatmap (Simulated with Bar Intensity) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        District Activity Intensity
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {data?.district_activity.map((dist, idx) => {
                            const intensity = (dist.count / maxActivity) * 100
                            return (
                                <div key={idx} className="group">
                                    <div className="flex items-center justify-between mb-1.5 px-1">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {dist.district}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-primary-500 transition-colors">
                                            {dist.count} queries
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-900/50 h-3 rounded-full overflow-hidden p-[2px]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000 origin-left"
                                            style={{ width: `${intensity}%`, opacity: Math.max(0.3, intensity / 100) }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {(!data || data.district_activity.length === 0) && (
                            <div className="text-center py-20 text-gray-400">
                                No district activity recorded in this period
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Topics & Gaps */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl h-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            Prevailing Regional Topics
                        </h3>
                        <div className="space-y-4">
                            {data?.top_topics.map((topic, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-primary-500 shadow-sm">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {topic.topic}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {topic.count} related inquiries
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600">
                                        High Interest
                                    </div>
                                </div>
                            ))}
                            {(!data || data.top_topics.length === 0) && (
                                <div className="text-center py-20 text-gray-400">
                                    No topic data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
