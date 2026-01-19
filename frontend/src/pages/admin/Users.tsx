import { useState, useEffect } from 'react'
import {
    Users, Search, Filter, Loader2, MoreVertical,
    UserCheck, UserX, Plus, X, Edit2, Shield,
    MapPin, School, Check
} from 'lucide-react'
import api from '../../services/api'

interface UserItem {
    id: number
    name: string | null
    phone: string
    email: string | null
    role: string
    is_active: boolean
    last_login: string | null
    created_at: string
    state_id?: number
    district_id?: number
    block_id?: number
    cluster_id?: number
    school_id?: number
    assigned_arp_id?: number
    school_name?: string
    school_district?: string
    school_block?: string
    school_state?: string
}

interface LocationItem {
    id: number
    name: string
}

export default function AdminUsers() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UserItem[]>([])
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [editingUser, setEditingUser] = useState<UserItem | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Hierarchy States
    const [states, setStates] = useState<LocationItem[]>([])
    const [districts, setDistricts] = useState<LocationItem[]>([])
    const [blocks, setBlocks] = useState<LocationItem[]>([])
    const [clusters, setClusters] = useState<LocationItem[]>([])
    const [schools, setSchools] = useState<LocationItem[]>([])
    const [arps, setArps] = useState<UserItem[]>([])

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'TEACHER',
        state_id: undefined as number | undefined,
        district_id: undefined as number | undefined,
        block_id: undefined as number | undefined,
        cluster_id: undefined as number | undefined,
        school_id: undefined as number | undefined,
        assigned_arp_id: undefined as number | undefined,
    })

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users')
            setUsers(res.data.items || [])
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchStates = async () => {
        try {
            const res = await api.get('/admin/config/public/states')
            setStates(res.data)
        } catch (err) { }
    }

    const fetchDistricts = async (stateId: number) => {
        try {
            const res = await api.get(`/admin/config/public/districts?state_id=${stateId}`)
            setDistricts(res.data)
        } catch (err) { }
    }

    const fetchBlocks = async (distId: number) => {
        try {
            const res = await api.get(`/admin/config/public/blocks?district_id=${distId}`)
            setBlocks(res.data)
        } catch (err) { }
    }

    const fetchClusters = async (blockId: number) => {
        try {
            const res = await api.get(`/admin/config/public/clusters?block_id=${blockId}`)
            setClusters(res.data)
        } catch (err) { }
    }

    const fetchSchools = async (clusterId: number) => {
        try {
            const res = await api.get(`/admin/config/public/schools?cluster_id=${clusterId}`)
            setSchools(res.data)
        } catch (err) { }
    }

    const fetchARPs = async () => {
        try {
            const res = await api.get('/admin/users?role=ARP')
            setArps(res.data.items || [])
        } catch (err) { }
    }

    useEffect(() => {
        fetchUsers()
        fetchStates()
        fetchARPs()
    }, [])

    const handleLocationChange = (level: string, id: number) => {
        switch (level) {
            case 'state':
                setForm({ ...form, state_id: id, district_id: undefined, block_id: undefined, cluster_id: undefined, school_id: undefined })
                fetchDistricts(id)
                setDistricts([])
                setBlocks([])
                setClusters([])
                setSchools([])
                break
            case 'district':
                setForm({ ...form, district_id: id, block_id: undefined, cluster_id: undefined, school_id: undefined })
                fetchBlocks(id)
                setBlocks([])
                setClusters([])
                setSchools([])
                break
            case 'block':
                setForm({ ...form, block_id: id, cluster_id: undefined, school_id: undefined })
                fetchClusters(id)
                setClusters([])
                setSchools([])
                break
            case 'cluster':
                setForm({ ...form, cluster_id: id, school_id: undefined })
                fetchSchools(id)
                setSchools([])
                break
            case 'school':
                setForm({ ...form, school_id: id })
                break
        }
    }

    const handleSaveUser = async () => {
        if (!form.phone || (modalMode === 'create' && !form.password)) {
            setError('Phone and password are required')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            const url = modalMode === 'create' ? '/admin/users' : `/admin/users/${editingUser?.id}`
            const method = modalMode === 'create' ? 'post' : 'put'

            const res = await (api as any)[method](url, form)
            if (res.status === 200 || res.status === 201) {
                setShowModal(false)
                fetchUsers()
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save user')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleUserStatus = async (user: UserItem) => {
        try {
            await api.post(`/admin/users/${user.id}/toggle-status`)
            fetchUsers()
        } catch (err) { }
    }

    const openEditModal = (user: UserItem) => {
        setModalMode('edit')
        setEditingUser(user)
        setForm({
            name: user.name || '',
            phone: user.phone,
            email: user.email || '',
            password: '',
            role: user.role,
            state_id: user.state_id,
            district_id: user.district_id,
            block_id: user.block_id,
            cluster_id: user.cluster_id,
            school_id: user.school_id,
            assigned_arp_id: user.assigned_arp_id,
        })

        // Populate dropdowns for editing
        if (user.state_id) fetchDistricts(user.state_id)
        if (user.district_id) fetchBlocks(user.district_id)
        if (user.block_id) fetchClusters(user.block_id)
        if (user.cluster_id) fetchSchools(user.cluster_id)

        setShowModal(true)
    }

    const openCreateModal = () => {
        setModalMode('create')
        setForm({
            name: '', phone: '', email: '', password: '', role: 'TEACHER',
            state_id: undefined, district_id: undefined, block_id: undefined,
            cluster_id: undefined, school_id: undefined, assigned_arp_id: undefined
        })
        setShowModal(true)
    }

    const formatLastActive = (lastLogin: string | null) => {
        if (!lastLogin) return 'Never'
        const date = new Date(lastLogin)
        const diff = Date.now() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden animate-fade-in mb-8">
                <div className="px-10 py-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-50 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Organization Directory</h1>
                            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs mt-1">Hierarchical User Management</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black shadow-xl"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        <span>ONBOARD NEW USER</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
                    <p className="text-gray-500 font-medium">Loading organization directory...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-20 text-center animate-slide-up">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No users identified</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Your search didn't match any users or your organization hasn't added any yet.</p>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary"
                    >
                        Create First User
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Identify</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Assignment</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Engagement</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="group hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.is_active ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {(user.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{user.name || 'Anonymous'}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{user.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Shield className={`w-3 h-3 ${user.role === 'ADMIN' ? 'text-purple-500' :
                                                        user.role === 'ARP' ? 'text-blue-500' :
                                                            user.role === 'CRP' ? 'text-emerald-500' : 'text-amber-500'
                                                        }`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'ARP' ? 'bg-blue-100 text-blue-700' :
                                                            user.role === 'CRP' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                {user.school_name && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                        <School className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{user.school_name}</span>
                                                    </div>
                                                )}
                                                {user.school_block && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {user.school_block}, {user.school_district}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => toggleUserStatus(user)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${user.is_active
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-300'
                                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}>
                                                {user.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                <span className="text-xs font-bold uppercase tracking-wide">{user.is_active ? 'Active' : 'Inactive'}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">Last Activity</p>
                                                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">{formatLastActive(user.last_login)}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Comprehensive User Modal (Create/Edit) */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-in">
                        {/* Modal Header */}
                        <div className="px-8 py-10 bg-primary-600 flex items-center justify-between text-white">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                    {modalMode === 'create' ? <Plus className="w-8 h-8" /> : <Edit2 className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black">{modalMode === 'create' ? 'Onboard New User' : 'Edit User Profile'}</h2>
                                    <p className="text-white/80 text-sm font-medium">Define organization hierarchy and roles</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-8 h-8 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3 animate-shake">
                                    <UserX className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Section: Professional Identity */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-primary-600">
                                    <Shield className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-xs">Professional Identity</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                                            placeholder="Ex: Rajesh Kumar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Role Type</label>
                                        <select
                                            value={form.role}
                                            onChange={e => setForm({ ...form, role: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-primary-700"
                                        >
                                            <option value="TEACHER">Teacher</option>
                                            <option value="CRP">CRP (Cluster Resource Person)</option>
                                            <option value="ARP">ARP (Academic Resource Person)</option>
                                            <option value="ADMIN">Administrator</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                                            placeholder="10-digit mobile"
                                        />
                                    </div>
                                    {modalMode === 'create' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Login Password</label>
                                            <input
                                                type="password"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Hierarchy & Assignment */}
                            {(form.role === 'TEACHER' || form.role === 'CRP' || form.role === 'ARP') && (
                                <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-primary-600">
                                        <MapPin className="w-5 h-5" />
                                        <h3 className="font-bold uppercase tracking-widest text-xs">Hierarchy & Assignment</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* State Selection */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">State</label>
                                            <select
                                                value={form.state_id || ''}
                                                onChange={e => handleLocationChange('state', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl transition-all font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                            >
                                                <option value="">Select State</option>
                                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>

                                        {/* District Selection */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">District</label>
                                            <select
                                                value={form.district_id || ''}
                                                disabled={!form.state_id}
                                                onChange={e => handleLocationChange('district', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-50 rounded-2xl transition-all font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                            >
                                                <option value="">Select District</option>
                                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Block Selection */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Block</label>
                                            <select
                                                value={form.block_id || ''}
                                                disabled={!form.district_id}
                                                onChange={e => handleLocationChange('block', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-50 rounded-2xl transition-all font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                            >
                                                <option value="">Select Block</option>
                                                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Cluster Selection (for CRP/Teacher) */}
                                        {(form.role === 'CRP' || form.role === 'TEACHER') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Cluster</label>
                                                <select
                                                    value={form.cluster_id || ''}
                                                    disabled={!form.block_id}
                                                    onChange={e => handleLocationChange('cluster', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-50 rounded-2xl transition-all font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                                >
                                                    <option value="">Select Cluster</option>
                                                    {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {/* School Selection (for Teacher) */}
                                        {form.role === 'TEACHER' && (
                                            <div className="space-y-2 col-span-1 md:col-span-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Assigned School</label>
                                                <select
                                                    value={form.school_id || ''}
                                                    disabled={!form.cluster_id}
                                                    onChange={e => handleLocationChange('school', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-50 rounded-2xl transition-all font-bold text-primary-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                                >
                                                    <option value="">Select School</option>
                                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {/* ARP Selection (for CRP) */}
                                        {form.role === 'CRP' && (
                                            <div className="space-y-2 col-span-1 md:col-span-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Reporting ARP</label>
                                                <select
                                                    value={form.assigned_arp_id || ''}
                                                    onChange={e => setForm({ ...form, assigned_arp_id: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl transition-all font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                                                >
                                                    <option value="">Select ARP</option>
                                                    {arps.map(arp => <option key={arp.id} value={arp.id}>{arp.name} ({arp.phone})</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={submitting}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>{modalMode === 'create' ? 'Confirm Onboarding' : 'Save Changes'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
