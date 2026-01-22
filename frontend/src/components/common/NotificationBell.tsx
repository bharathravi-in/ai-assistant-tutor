/**
 * NotificationBell - Shows alert notifications for CRP/ARP/Admin users
 * Connects to /alerts/stats backend endpoint
 */
import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle, Users, X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface AlertStats {
    high_priority_count: number
    medium_priority_count: number
    low_priority_count: number
    total_flagged_teachers: number
}

export default function NotificationBell() {
    const { user, token } = useAuthStore()
    const [stats, setStats] = useState<AlertStats | null>(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)

    // Show for all authenticated users including teachers
    const showBell = user?.role && ['crp', 'arp', 'admin', 'superadmin', 'teacher'].includes(user.role.toLowerCase())

    useEffect(() => {
        if (showBell && token) {
            fetchAlertStats()
            // Refresh every 5 minutes
            const interval = setInterval(fetchAlertStats, 5 * 60 * 1000)
            return () => clearInterval(interval)
        }
    }, [showBell, token])

    const fetchAlertStats = async () => {
        if (!token) return
        setLoading(true)
        try {
            const response = await fetch('/api/alerts/stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (err) {
            console.error('Failed to fetch alert stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!showBell) return null

    const totalAlerts = stats ? stats.high_priority_count + stats.medium_priority_count : 0
    const hasHighPriority = stats?.high_priority_count && stats.high_priority_count > 0

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-2 rounded-lg transition-colors relative ${hasHighPriority
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
            >
                <Bell className="w-5 h-5" />
                {totalAlerts > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white rounded-full ${hasHighPriority ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                        {totalAlerts > 9 ? '9+' : totalAlerts}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Alerts</h3>
                            <button onClick={() => setShowDropdown(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : stats ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.high_priority_count > 0 && (
                                    <div className="p-3 flex items-center gap-3 bg-red-50 dark:bg-red-900/20">
                                        <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                                {stats.high_priority_count} High Priority
                                            </p>
                                            <p className="text-xs text-red-600/70">Teachers need immediate help</p>
                                        </div>
                                    </div>
                                )}
                                {stats.medium_priority_count > 0 && (
                                    <div className="p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-500 text-white flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {stats.medium_priority_count} Medium Priority
                                            </p>
                                            <p className="text-xs text-gray-500">Teachers showing struggle patterns</p>
                                        </div>
                                    </div>
                                )}
                                {stats.total_flagged_teachers === 0 && (
                                    <div className="p-4 text-center">
                                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">All teachers doing well!</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                No alerts available
                            </div>
                        )}

                        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                            <a
                                href="/crp"
                                className="block w-full text-center text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 py-2 rounded-lg transition-colors"
                            >
                                View Dashboard →
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
