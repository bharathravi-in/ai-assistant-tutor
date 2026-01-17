import { useState, useEffect } from 'react'
import {
    Users,
    UserPlus,
    Loader2,
    AlertCircle,
    Search,
    MoreVertical,
    Eye,
    EyeOff,
    X,
    Shield,
    MapPin,
    School,
    Check,
    UserCheck,
    UserX,
    Edit2
} from 'lucide-react'
import { arpApi, configApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'

interface LocationItem {
    id: number
    name: string
}

interface User {
    id: number
    name: string
    phone: string
    email: string | null
    role: string
    school_name: string | null
    school_district: string | null
    school_block: string | null
    is_active: boolean
    created_at: string
    last_login: string | null
    state_id?: number
    district_id?: number
    block_id?: number
    cluster_id?: number
    school_id?: number
}

export default function UserManagement() {
    const { grades: masterGrades, subjects: masterSubjects } = useMasterData()
    const GRADES = masterGrades.map(g => g.number)
    const SUBJECTS = masterSubjects.map(s => s.name)

    const [activeTab, setActiveTab] = useState<'TEACHER' | 'CRP'>('TEACHER')
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Hierarchy States
    const [states, setStates] = useState<LocationItem[]>([])
    const [districts, setDistricts] = useState<LocationItem[]>([])
    const [blocks, setBlocks] = useState<LocationItem[]>([])
    const [clusters, setClusters] = useState<LocationItem[]>([])
    const [schools, setSchools] = useState<LocationItem[]>([])

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
        grades_taught: [] as number[],
        subjects_taught: [] as string[]
    })

    useEffect(() => {
        loadUsers()
        fetchStates()
    }, [activeTab])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await arpApi.getUsers({ role: activeTab })
            setUsers(data.items || [])
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchStates = async () => {
        try {
            const data = await configApi.getStates()
            setStates(data)
        } catch (err) { }
    }

    const fetchDistricts = async (stateId: number) => {
        try {
            const data = await configApi.getDistricts(stateId)
            setDistricts(data)
        } catch (err) { }
    }

    const fetchBlocks = async (distId: number) => {
        try {
            const data = await configApi.getBlocks(distId)
            setBlocks(data)
        } catch (err) { }
    }

    const fetchClusters = async (blockId: number) => {
        try {
            const data = await configApi.getClusters(blockId)
            setClusters(data)
        } catch (err) { }
    }

    const fetchSchools = async (clusterId: number) => {
        try {
            const data = await configApi.getSchools(undefined, undefined, clusterId)
            setSchools(data)
        } catch (err) { }
    }

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

    const handleGradeToggle = (grade: number) => {
        setForm(prev => ({
            ...prev,
            grades_taught: prev.grades_taught.includes(grade)
                ? prev.grades_taught.filter(g => g !== grade)
                : [...prev.grades_taught, grade]
        }))
    }

    const handleSubjectToggle = (subject: string) => {
        setForm(prev => ({
            ...prev,
            subjects_taught: prev.subjects_taught.includes(subject)
                ? prev.subjects_taught.filter(s => s !== subject)
                : [...prev.subjects_taught, subject]
        }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            if (modalMode === 'edit' && editingUser) {
                await arpApi.updateUser(editingUser.id, {
                    ...form,
                    role: form.role || activeTab
                })
            } else {
                await arpApi.createUser({
                    ...form,
                    role: activeTab
                })
            }
            setShowModal(false)
            setForm({
                name: '', phone: '', email: '', password: '', role: activeTab,
                state_id: undefined, district_id: undefined, block_id: undefined,
                cluster_id: undefined, school_id: undefined,
                grades_taught: [], subjects_taught: []
            })
            loadUsers()
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save user')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleStatus = async (user: User) => {
        try {
            await arpApi.toggleUserStatus(user.id)
            loadUsers()
        } catch (err) { }
    }

    const openCreateModal = () => {
        setModalMode('create')
        setEditingUser(null)
        setForm({
            name: '', phone: '', email: '', password: '', role: activeTab,
            state_id: undefined, district_id: undefined, block_id: undefined,
            cluster_id: undefined, school_id: undefined,
            grades_taught: [], subjects_taught: []
        })
        setShowModal(true)
    }

    const openEditModal = async (user: User) => {
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
            grades_taught: [],
            subjects_taught: []
        })
        // Load hierarchical data for editing
        if (user.state_id) await fetchDistricts(user.state_id)
        if (user.district_id) await fetchBlocks(user.district_id)
        if (user.block_id) await fetchClusters(user.block_id)
        if (user.cluster_id) await fetchSchools(user.cluster_id)
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
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
    )

    return (
        <div className="p-4 lg:p-6 animate-fade-in max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
                <div className="px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">User Management</h1>
                            <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Manage teachers and CRPs in your district</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>ONBOARD NEW {activeTab === 'TEACHER' ? 'TEACHER' : 'CRP'}</span>
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl w-full md:w-auto self-start">
                    <button
                        onClick={() => setActiveTab('TEACHER')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'TEACHER' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Teachers
                    </button>
                    <button
                        onClick={() => setActiveTab('CRP')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'CRP' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield className="w-4 h-4" />
                        CRPs
                    </button>
                </div>

                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading directory...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No users found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Try adjusting your search or add a new user to the system.</p>
                        <button onClick={openCreateModal} className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                            Add First {activeTab === 'TEACHER' ? 'Teacher' : 'CRP'}
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{user.name || 'Anonymous'}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">{user.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                                                    <School className="w-3 h-3" />
                                                    {user.school_name || '-'}
                                                </div>
                                                {user.school_block && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {user.school_block}, {user.school_district}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${user.is_active
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-200'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                {user.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{user.is_active ? 'Active' : 'Inactive'}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">Last Login</p>
                                                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">{formatLastActive(user.last_login)}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Comprehensive User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-in">
                        {/* Modal Header */}
                        <div className="px-8 py-10 bg-indigo-600 flex items-center justify-between text-white">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                    {modalMode === 'create' ? <UserPlus className="w-8 h-8" /> : <Edit2 className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black">{modalMode === 'create' ? 'Onboard' : 'Edit'} {activeTab === 'TEACHER' ? 'Teacher' : 'CRP'}</h2>
                                    <p className="text-white/80 text-sm font-medium">{modalMode === 'create' ? 'Define organization hierarchy and teaching context' : 'Update user profile and assignments'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-8 h-8 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Section: Professional Identity */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <Shield className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-[10px]">Professional Identity</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                                            placeholder="Ex: Rajesh Kumar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                                            placeholder="10-digit mobile"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Login Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Assigned Role</label>
                                        <div className="w-full px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-0 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-between">
                                            {activeTab}
                                            <Shield className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Hierarchy */}
                            <div className="space-y-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <MapPin className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-[10px]">Hierarchy & Geography</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">State</label>
                                        <select
                                            value={form.state_id || ''}
                                            onChange={e => handleLocationChange('state', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl transition-all font-bold text-sm outline-none"
                                        >
                                            <option value="">Select State</option>
                                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">District</label>
                                        <select
                                            value={form.district_id || ''}
                                            disabled={!form.state_id}
                                            onChange={e => handleLocationChange('district', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl transition-all font-bold text-sm outline-none disabled:opacity-50"
                                        >
                                            <option value="">Select District</option>
                                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Block</label>
                                        <select
                                            value={form.block_id || ''}
                                            disabled={!form.district_id}
                                            onChange={e => handleLocationChange('block', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl transition-all font-bold text-sm outline-none disabled:opacity-50"
                                        >
                                            <option value="">Select Block</option>
                                            {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cluster</label>
                                        <select
                                            value={form.cluster_id || ''}
                                            disabled={!form.block_id}
                                            onChange={e => handleLocationChange('cluster', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl transition-all font-bold text-sm outline-none disabled:opacity-50"
                                        >
                                            <option value="">Select Cluster</option>
                                            {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {activeTab === 'TEACHER' && (
                                        <div className="space-y-2 col-span-1 md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary School</label>
                                            <select
                                                value={form.school_id || ''}
                                                disabled={!form.cluster_id}
                                                onChange={e => handleLocationChange('school', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl transition-all font-bold text-sm outline-none disabled:opacity-50"
                                            >
                                                <option value="">Select School</option>
                                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Academic Context */}
                            {activeTab === 'TEACHER' && (
                                <div className="space-y-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-indigo-600">
                                        <School className="w-5 h-5" />
                                        <h3 className="font-bold uppercase tracking-widest text-[10px]">Academic Context</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Grades Taught</label>
                                            <div className="flex flex-wrap gap-2">
                                                {GRADES.map(grade => (
                                                    <button
                                                        key={grade}
                                                        type="button"
                                                        onClick={() => handleGradeToggle(grade)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${form.grades_taught.includes(grade)
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                                                            : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {grade}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subjects Specialization</label>
                                            <div className="flex flex-wrap gap-2">
                                                {SUBJECTS.map(subject => (
                                                    <button
                                                        key={subject}
                                                        type="button"
                                                        onClick={() => handleSubjectToggle(subject)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${form.subjects_taught.includes(subject)
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                                                            : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {subject}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-white transition-all uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={submitting || !form.name || !form.phone || (modalMode === 'create' && form.password === '')}
                                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                <span>{modalMode === 'create' ? 'Confirm Onboarding' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
