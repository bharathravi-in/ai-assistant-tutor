import { useState, useEffect } from 'react'
import {
    Users,
    MessageSquare,
    TrendingUp,
    Clock,
    BarChart3,
    Loader2
} from 'lucide-react'
import { adminApi } from '../../services/api'
import type { AdminDashboard as AdminDashboardType } from '../../types'

export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const data = await adminApi.getDashboard()
            setDashboard(data)
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="card-gradient">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    Admin Dashboard
                </h1>
                <p className="text-white/80 mt-1">
                    Platform overview and analytics
                </p>
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

            {/* Charts Section */}
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
                        <button className="card-hover p-4 text-left group">
                            <TrendingUp className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-gray-800 dark:text-white">Effectiveness</p>
                            <p className="text-xs text-gray-500">Strategy analysis</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
