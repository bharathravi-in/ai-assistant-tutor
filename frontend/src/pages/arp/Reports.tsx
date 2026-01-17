import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    Download,
    FileText,
    AlertTriangle,
    Target,
    MapPin,
    Star
} from 'lucide-react'
import { arpApi } from '../../services/api'

interface DistrictStats {
    name: string
    teachers: number
    crps: number
    queries: number
    success_rate: number
}

export default function ARPReports() {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')
    const [stats, setStats] = useState({
        total_teachers: 0,
        total_crps: 0,
        total_queries: 0,
        success_rate: 0
    })
    const [districts, setDistricts] = useState<DistrictStats[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [dashboardData, districtsData] = await Promise.all([
                arpApi.getDashboard(),
                arpApi.getDistrictPerformance()
            ])

            setStats({
                total_teachers: dashboardData.active_teachers || 0,
                total_crps: districtsData.districts?.reduce((acc: number, d: any) => acc + d.crps, 0) || 0,
                total_queries: dashboardData.total_queries || 0,
                success_rate: dashboardData.success_rate || 0
            })

            setDistricts(districtsData.districts || [])
        } catch (err) {
            console.error('Failed to load ARP reports:', err)
        } finally {
            setLoading(false)
        }
    }

    const getSuccessColor = (rate: number) => {
        if (rate >= 85) return 'text-green-600'
        if (rate >= 70) return 'text-yellow-600'
        return 'text-red-600'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-gray-500">Loading regional reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-cyan-600 to-blue-600">
                <div className="relative p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white">Regional Reports</h1>
                                <p className="text-white/70 mt-1">District-level performance and analytics</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['week', 'month', 'quarter', 'year'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p
                                        ? 'bg-white text-cyan-600'
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

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="flex items-center text-xs text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +8%
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_teachers}</p>
                    <p className="text-sm text-gray-500">Total Teachers</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Star className="w-5 h-5 text-purple-500" />
                        <span className="text-xs text-gray-500">{districts.length} districts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_crps}</p>
                    <p className="text-sm text-gray-500">Total CRPs</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        <span className="flex items-center text-xs text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +23%
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_queries}</p>
                    <p className="text-sm text-gray-500">Total Queries</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className="flex items-center text-xs text-green-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +3%
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${getSuccessColor(stats.success_rate)}`}>{stats.success_rate}%</p>
                    <p className="text-sm text-gray-500">Avg Success Rate</p>
                </div>
            </div>

            {/* District Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">District Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">District</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Teachers</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">CRPs</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Queries</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Success Rate</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {districts.map((district, idx) => (
                                <tr key={district.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {district.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">{district.teachers}</td>
                                    <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">{district.crps}</td>
                                    <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">{district.queries}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`text-sm font-medium ${getSuccessColor(district.success_rate)}`}>
                                            {district.success_rate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {idx % 2 === 0 ? (
                                            <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Regional Summary</p>
                            <p className="text-xs text-gray-500">PDF format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">CRP Performance</p>
                            <p className="text-xs text-gray-500">Excel format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">Training Gaps</p>
                            <p className="text-xs text-gray-500">PDF format</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-auto" />
                    </button>
                </div>
            </div>
        </div>
    )
}
