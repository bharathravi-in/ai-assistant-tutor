import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2,
    Users,
    MessageSquare,
    TrendingUp,
    Settings,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash,
    ExternalLink,
    Crown
} from 'lucide-react'

interface Organization {
    id: number
    name: string
    slug: string
    subscription_plan: string
    is_active: boolean
    created_at: string
    users_count?: number
}

interface DashboardStats {
    total_organizations: number
    active_organizations: number
    total_users: number
    total_queries: number
    organizations_by_plan: Record<string, number>
    recent_organizations: Organization[]
}

const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
}

export default function SuperadminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newOrg, setNewOrg] = useState({ name: '', slug: '', contact_email: '', subscription_plan: 'free', admin_name: '', admin_phone: '', admin_password: '' })

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (err) {
            console.error('Failed to fetch dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    const createOrganization = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newOrg)
            })
            if (response.ok) {
                setShowCreateModal(false)
                setNewOrg({ name: '', slug: '', contact_email: '', subscription_plan: 'free', admin_name: '', admin_phone: '', admin_password: '' })
                fetchDashboard()
            }
        } catch (err) {
            console.error('Failed to create organization:', err)
        }
    }

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Platform Administration
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Manage organizations, settings, and subscriptions
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Organizations</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats?.total_organizations || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                        {stats?.active_organizations || 0} active
                    </p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats?.total_users || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Queries</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats?.total_queries || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Plans</p>
                            <div className="flex gap-2 mt-2">
                                {Object.entries(stats?.organizations_by_plan || {}).map(([plan, count]) => (
                                    <span key={plan} className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[plan] || planColors.free}`}>
                                        {plan}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                            <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/superadmin/organizations')}
                    className="card p-6 text-left hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 group-hover:scale-110 transition-transform">
                            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Manage Organizations</h3>
                            <p className="text-sm text-gray-500">View and edit all organizations</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/superadmin/plans')}
                    className="card p-6 text-left hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Subscription Plans</h3>
                            <p className="text-sm text-gray-500">Configure plan limits and pricing</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/superadmin/settings')}
                    className="card p-6 text-left hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:scale-110 transition-transform">
                            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Platform Settings</h3>
                            <p className="text-sm text-gray-500">Configure global settings</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Recent Organizations */}
            <div className="card">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Organizations
                        </h2>
                        <button
                            onClick={() => navigate('/superadmin/organizations')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                            View All <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Users
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {stats?.recent_organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                                            <p className="text-sm text-gray-500">{org.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[org.subscription_plan] || planColors.free}`}>
                                            {org.subscription_plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {org.users_count || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {org.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => navigate(`/superadmin/organizations/${org.id}`)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Organization Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Create New Organization
                        </h2>
                        <div className="space-y-4">
                            {/* Organization Details */}
                            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Organization Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Organization Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newOrg.name}
                                            onChange={(e) => {
                                                setNewOrg({
                                                    ...newOrg,
                                                    name: e.target.value,
                                                    slug: generateSlug(e.target.value)
                                                })
                                            }}
                                            className="input"
                                            placeholder="Acme Schools"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Slug (URL-friendly) *
                                        </label>
                                        <input
                                            type="text"
                                            value={newOrg.slug}
                                            onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                                            className="input"
                                            placeholder="acme-schools"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            value={newOrg.contact_email}
                                            onChange={(e) => setNewOrg({ ...newOrg, contact_email: e.target.value })}
                                            className="input"
                                            placeholder="admin@acme.edu"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Subscription Plan
                                        </label>
                                        <select
                                            value={newOrg.subscription_plan}
                                            onChange={(e) => setNewOrg({ ...newOrg, subscription_plan: e.target.value })}
                                            className="input"
                                        >
                                            <option value="free">Free</option>
                                            <option value="starter">Starter</option>
                                            <option value="professional">Professional</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Admin User Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Admin User</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Admin Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newOrg.admin_name || ''}
                                            onChange={(e) => setNewOrg({ ...newOrg, admin_name: e.target.value })}
                                            className="input"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Admin Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            value={newOrg.admin_phone || ''}
                                            onChange={(e) => setNewOrg({ ...newOrg, admin_phone: e.target.value })}
                                            className="input"
                                            placeholder="9876543210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Admin Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={newOrg.admin_password || ''}
                                            onChange={(e) => setNewOrg({ ...newOrg, admin_password: e.target.value })}
                                            className="input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createOrganization}
                                disabled={!newOrg.name || !newOrg.slug || !newOrg.admin_name || !newOrg.admin_phone || !newOrg.admin_password}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50"
                            >
                                Create Organization
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
