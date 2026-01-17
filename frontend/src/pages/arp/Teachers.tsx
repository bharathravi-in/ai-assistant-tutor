import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Clock,
    Star,
    Target
} from 'lucide-react'
import { arpApi } from '../../services/api'

interface CRPPerformance {
    id: number
    name: string
    district: string
    teachers_count: number
    response_rate: number
    avg_response_time: string
    pending_reviews: number
    total_responses: number
    rating: number
    status: 'active' | 'inactive' | 'at_risk'
}

export default function ARPTeachers() {
    const [crps, setCrps] = useState<CRPPerformance[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await arpApi.getCrpPerformance()
            setCrps(data.crps || [])
        } catch (err) {
            console.error('Failed to load CRP performance:', err)
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        active: crps.filter(c => c.status === 'active').length,
        at_risk: crps.filter(c => c.status === 'at_risk').length,
        inactive: crps.filter(c => c.status === 'inactive').length,
    }

    const getPerformanceColor = (rate: number) => {
        if (rate >= 85) return 'bg-green-100 text-green-700 border-green-200'
        if (rate >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        return 'bg-red-100 text-red-700 border-red-200'
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200'
            case 'at_risk': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    const filteredCrps = crps.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.district.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus
        return matchesSearch && matchesFilter
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-gray-500">Loading CRP network...</p>
                </div>
            </div>
        )
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="header-gradient">
                <div className="relative p-6 lg:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">CRP Network</h1>
                            <p className="text-white/70 mt-1">Monitor and support CRPs in your region</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary-light)]/10 dark:bg-[var(--color-primary)]/30">
                            <Users className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{crps.length}</p>
                            <p className="text-sm text-gray-500">Total CRPs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            <p className="text-sm text-gray-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.at_risk}</p>
                            <p className="text-sm text-gray-500">At Risk</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                            <Target className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                            <p className="text-sm text-gray-500">Inactive</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search CRP or district..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'at_risk', 'inactive'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === status
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* CRP List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CRP</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">District</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Teachers</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Response Rate</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Time</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pending</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredCrps.map(crp => (
                                <tr key={crp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
                                                {crp.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{crp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                            <MapPin className="w-3 h-3" />
                                            {crp.district}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{crp.teachers_count}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(crp.response_rate)}`}>
                                            {crp.response_rate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {crp.avg_response_time}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {crp.pending_reviews > 0 ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                {crp.pending_reviews}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="flex items-center justify-center gap-1 text-sm font-medium text-yellow-600">
                                            <Star className="w-3 h-3 fill-yellow-400" />
                                            {crp.rating}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(crp.status)}`}>
                                            {crp.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
