import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2,
    Search,
    Plus,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Users,
    Settings
} from 'lucide-react'

interface Organization {
    id: number
    name: string
    slug: string
    subscription_plan: string
    is_active: boolean
    created_at: string
    users_count?: number
    contact_email?: string
}

const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
}

export default function OrganizationsList() {
    const navigate = useNavigate()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/organizations', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setOrganizations(data)
            }
        } catch (err) {
            console.error('Failed to fetch organizations:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Organizations
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Manage all tenant organizations
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/superadmin/organizations/new')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Organization
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrgs.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => navigate(`/superadmin/organizations/${org.id}`)}
                        className="card p-6 cursor-pointer hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[org.subscription_plan] || planColors.free}`}>
                                {org.subscription_plan}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {org.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{org.slug}</p>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{org.users_count || 0} users</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {org.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/superadmin/organizations/${org.id}`)
                            }}
                            className="mt-4 w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center justify-center gap-2 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Configure
                        </button>
                    </div>
                ))}
            </div>

            {filteredOrgs.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No organizations found
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Create your first organization to get started
                    </p>
                    <button
                        onClick={() => navigate('/superadmin')}
                        className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-medium"
                    >
                        Create Organization
                    </button>
                </div>
            )}
        </div>
    )
}
