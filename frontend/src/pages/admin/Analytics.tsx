import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, FileText, Loader2, RefreshCw } from 'lucide-react'

interface AnalyticsSummary {
    total_teachers: number
    total_queries: number
    total_resources: number
    active_this_week: number
}

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<AnalyticsSummary | null>(null)

    useEffect(() => {
        // Simulate loading analytics data
        const timer = setTimeout(() => {
            setStats({
                total_teachers: 128,
                total_queries: 3450,
                total_resources: 87,
                active_this_week: 45
            })
            setLoading(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    const cards = [
        { label: 'Total Teachers', value: stats?.total_teachers || 0, icon: Users, color: 'blue' },
        { label: 'Total Queries', value: stats?.total_queries || 0, icon: BarChart3, color: 'emerald' },
        { label: 'Resources Published', value: stats?.total_resources || 0, icon: FileText, color: 'purple' },
        { label: 'Active This Week', value: stats?.active_this_week || 0, icon: TrendingUp, color: 'orange' },
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-gray-500 text-sm">Organization-wide usage statistics</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-${card.color}-100 dark:bg-${card.color}-900/20`}>
                            <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage Trends</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm">Chart visualization coming soon</p>
                </div>
            </div>
        </div>
    )
}
