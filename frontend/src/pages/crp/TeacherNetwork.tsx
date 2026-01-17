import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Users,
    Search,
    User,
    MapPin,
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    MessageSquare,
    ChevronRight,
    RefreshCw,
    Filter,
    UserCheck,
    UserX,
    UserPlus
} from 'lucide-react'
import { crpApi } from '../../services/api'

interface Teacher {
    id: number
    name: string
    school: string
    last_activity: string | null
    query_count_week: number
    pending_reflections: number
    status: 'active' | 'inactive' | 'at_risk'
}

export default function TeacherNetwork() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [stats, setStats] = useState({ active: 0, at_risk: 0, inactive: 0 })

    useEffect(() => {
        loadTeachers()
    }, [])

    const loadTeachers = async () => {
        setLoading(true)
        try {
            const data = await crpApi.getTeachers()
            setTeachers(data.teachers || [])
            setStats(data.stats || { active: 0, at_risk: 0, inactive: 0 })
        } catch (err) {
            console.error('Failed to load teachers:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200'
            case 'at_risk': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <UserCheck className="w-4 h-4 text-green-600" />
            case 'at_risk': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
            case 'inactive': return <UserX className="w-4 h-4 text-red-600" />
            default: return <User className="w-4 h-4 text-gray-600" />
        }
    }

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.school.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || t.status === filterStatus
        return matchesSearch && matchesFilter
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading teachers...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="header-gradient">
                <div className="relative p-6 lg:p-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white">My Teacher Network</h1>
                                <p className="text-white/70 mt-1">Monitor and support teachers in your cluster</p>
                            </div>
                        </div>
                        <Link
                            to="/crp/create-teacher"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Add Teacher</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                            <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            <p className="text-sm text-gray-500">Active Teachers</p>
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
                            <UserX className="w-5 h-5 text-red-600" />
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
                        placeholder="Search teacher or school..."
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

            {/* Teacher List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {filteredTeachers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No teachers found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredTeachers.map(teacher => (
                            <div key={teacher.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${teacher.status === 'active' ? 'bg-green-100' :
                                            teacher.status === 'at_risk' ? 'bg-yellow-100' : 'bg-red-100'
                                            }`}>
                                            {getStatusIcon(teacher.status)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{teacher.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {teacher.school}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <Activity className="w-3 h-3" />
                                                {teacher.query_count_week} queries this week
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Last active: {teacher.last_activity ? new Date(teacher.last_activity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadge(teacher.status)}`}>
                                            {teacher.status.replace('_', ' ')}
                                        </span>
                                        {teacher.pending_reflections > 0 && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                {teacher.pending_reflections} pending
                                            </span>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
