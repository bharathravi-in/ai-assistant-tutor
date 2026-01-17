import { useState, useEffect } from 'react'
import {
    Building2,
    Plus,
    Loader2,
    Search,
    X,
    MapPin,
    School as SchoolIcon,
    Trash2,
    CheckCircle,
    AlertCircle,
    Pencil,
    Eye,
    EyeOff
} from 'lucide-react'
import api from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'

interface DistrictData {
    id: number
    name: string
    state_id: number
    is_active: boolean
}

interface BlockData {
    id: number
    name: string
    district_id: number
    is_active: boolean
}

interface ClusterData {
    id: number
    name: string
    block_id: number
    is_active: boolean
}

interface SchoolData {
    id: number
    name: string
    code: string | null
    block_id: number
    cluster_id: number | null
    board_id: number | null
    medium_id: number | null
    address: string | null
    teacher_count: number
    student_count: number
    is_active: boolean
}

export default function SchoolConfig() {
    const { states } = useMasterData()
    const [activeTab, setActiveTab] = useState<'districts' | 'blocks' | 'clusters' | 'schools'>('districts')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Filters
    const [selectedStateId, setSelectedStateId] = useState<number>(0)
    const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0)
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0)

    // Data from API
    const [districts, setDistricts] = useState<DistrictData[]>([])
    const [blocks, setBlocks] = useState<BlockData[]>([])
    const [clusters, setClusters] = useState<ClusterData[]>([])
    const [schools, setSchools] = useState<SchoolData[]>([])

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        state_id: 0,
        district_id: 0,
        block_id: 0,
        cluster_id: 0,
        code: '',
        address: ''
    })
    const [formDistricts, setFormDistricts] = useState<DistrictData[]>([])
    const [formBlocks, setFormBlocks] = useState<BlockData[]>([])
    const [formClusters, setFormClusters] = useState<ClusterData[]>([])
    const [loadingFormData, setLoadingFormData] = useState(false)

    useEffect(() => {
        loadData()
    }, [activeTab, selectedStateId, selectedDistrictId, selectedBlockId])

    // Load districts for dropdowns when needed
    useEffect(() => {
        const loadDistricts = async () => {
            try {
                const res = await api.get('/admin/config/districts')
                setDistricts(res.data)
            } catch (err) {
                console.error('Failed to load districts:', err)
            }
        }
        if (activeTab === 'blocks' || activeTab === 'schools') {
            loadDistricts()
        }
    }, [activeTab])

    // Load blocks for school dropdown when creating schools
    useEffect(() => {
        const loadBlocks = async () => {
            try {
                const res = await api.get('/admin/config/blocks')
                setBlocks(res.data)
            } catch (err) {
                console.error('Failed to load blocks:', err)
            }
        }
        if (activeTab === 'schools') {
            loadBlocks()
        }
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            switch (activeTab) {
                case 'districts':
                    const distParams = selectedStateId ? `?state_id=${selectedStateId}` : ''
                    const distRes = await api.get(`/admin/config/districts${distParams}`)
                    setDistricts(distRes.data)
                    break
                case 'blocks':
                    const blockParams = selectedDistrictId ? `?district_id=${selectedDistrictId}` : ''
                    const blockRes = await api.get(`/admin/config/blocks${blockParams}`)
                    setBlocks(blockRes.data)
                    break
                case 'clusters':
                    const clusterParams = selectedBlockId ? `?block_id=${selectedBlockId}` : ''
                    const clusterRes = await api.get(`/admin/config/clusters${clusterParams}`)
                    setClusters(clusterRes.data)
                    break
                case 'schools':
                    let schoolParams = ''
                    if (selectedBlockId) schoolParams = `?block_id=${selectedBlockId}`
                    else if (selectedDistrictId) schoolParams = `?district_id=${selectedDistrictId}`
                    const schoolRes = await api.get(`/admin/config/schools${schoolParams}`)
                    setSchools(schoolRes.data)
                    break
            }
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setErrorMessage('')
        try {
            let endpoint = ''
            let payload: any = {}

            switch (activeTab) {
                case 'districts':
                    endpoint = '/admin/config/districts'
                    payload = { name: formData.name, state_id: formData.state_id }
                    break
                case 'blocks':
                    endpoint = '/admin/config/blocks'
                    payload = { name: formData.name, district_id: formData.district_id }
                    break
                case 'clusters':
                    endpoint = '/admin/config/clusters'
                    payload = { name: formData.name, block_id: formData.block_id }
                    break
                case 'schools':
                    endpoint = '/admin/config/schools'
                    payload = {
                        name: formData.name,
                        block_id: formData.block_id,
                        cluster_id: formData.cluster_id || null,
                        code: formData.code || null,
                        address: formData.address || null
                    }
                    break
            }

            if (isEditing) {
                await api.put(`${endpoint}/${editingId}`, payload)
            } else {
                await api.post(endpoint, payload)
            }
            setShowCreateModal(false)
            setSuccessMessage(`${activeTab.slice(0, -1)} ${isEditing ? 'updated' : 'created'} successfully!`)
            setTimeout(() => setSuccessMessage(''), 3000)
            loadData()
            resetForm()
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || 'Failed to create')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item permanently?')) return
        try {
            await api.delete(`/admin/config/${activeTab}/${id}`)
            setSuccessMessage(`${activeTab.slice(0, -1)} deleted permanently!`)
            setTimeout(() => setSuccessMessage(''), 3000)
            loadData()
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || 'Failed to delete')
        }
    }

    const handleToggleStatus = async (id: number) => {
        try {
            await api.patch(`/admin/config/${activeTab}/${id}/toggle`)
            setSuccessMessage(`Status updated successfully!`)
            setTimeout(() => setSuccessMessage(''), 3000)
            loadData()
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || 'Failed to update status')
        }
    }

    const handleEdit = async (item: any) => {
        resetForm()
        setIsEditing(true)
        setEditingId(item.id)

        const baseData = {
            name: item.name,
            state_id: item.state_id || 0,
            district_id: item.district_id || 0,
            block_id: item.block_id || 0,
            cluster_id: item.cluster_id || 0,
            code: item.code || '',
            address: item.address || ''
        }

        // Set breadcrumb logic for deeper entities
        if (activeTab === 'blocks' || activeTab === 'clusters' || activeTab === 'schools') {
            // Need to find parent IDs if they aren't on the item
            if (activeTab === 'blocks') {
                const dist = districts.find(d => d.id === item.district_id)
                baseData.state_id = dist?.state_id || 0
                await handleFormStateChange(baseData.state_id)
                baseData.district_id = item.district_id
            } else if (activeTab === 'clusters') {
                const block = blocks.find(b => b.id === item.block_id)
                const dist = districts.find(d => d.id === block?.district_id)
                baseData.state_id = dist?.state_id || 0
                await handleFormStateChange(baseData.state_id)
                baseData.district_id = dist?.id || 0
                await handleFormDistrictChange(baseData.district_id)
                baseData.block_id = item.block_id
            } else if (activeTab === 'schools') {
                const block = blocks.find(b => b.id === item.block_id)
                const dist = districts.find(d => d.id === block?.district_id)
                baseData.state_id = dist?.state_id || 0
                await handleFormStateChange(baseData.state_id)
                baseData.district_id = dist?.id || 0
                await handleFormDistrictChange(baseData.district_id)
                baseData.block_id = item.block_id
                await handleFormBlockChange(baseData.block_id)
                baseData.cluster_id = item.cluster_id || 0
            }
        }

        setFormData(baseData)
        setShowCreateModal(true)
    }

    const resetForm = () => {
        setFormData({ name: '', state_id: 0, district_id: 0, block_id: 0, cluster_id: 0, code: '', address: '' })
        setFormDistricts([])
        setFormBlocks([])
        setFormClusters([])
        setIsEditing(false)
        setEditingId(null)
    }

    // Cascading: Load districts when state is selected in form
    const handleFormStateChange = async (stateId: number) => {
        setFormData(prev => ({ ...prev, state_id: stateId, district_id: 0, block_id: 0 }))
        setFormBlocks([])
        if (stateId) {
            setLoadingFormData(true)
            try {
                const res = await api.get(`/admin/config/districts?state_id=${stateId}`)
                setFormDistricts(res.data)
            } catch (err) {
                console.error('Failed to load districts:', err)
            } finally {
                setLoadingFormData(false)
            }
        } else {
            setFormDistricts([])
        }
    }

    // Cascading: Load blocks when district is selected in form
    const handleFormDistrictChange = async (districtId: number) => {
        setFormData(prev => ({ ...prev, district_id: districtId, block_id: 0, cluster_id: 0 }))
        setFormClusters([])
        if (districtId) {
            setLoadingFormData(true)
            try {
                const res = await api.get(`/admin/config/blocks?district_id=${districtId}`)
                setFormBlocks(res.data)
            } catch (err) {
                console.error('Failed to load blocks:', err)
            } finally {
                setLoadingFormData(false)
            }
        } else {
            setFormBlocks([])
        }
    }

    // Cascading: Load clusters when block is selected in form
    const handleFormBlockChange = async (blockId: number) => {
        setFormData(prev => ({ ...prev, block_id: blockId, cluster_id: 0 }))
        if (blockId) {
            setLoadingFormData(true)
            try {
                const res = await api.get(`/admin/config/clusters?block_id=${blockId}`)
                setFormClusters(res.data)
            } catch (err) {
                console.error('Failed to load clusters:', err)
            } finally {
                setLoadingFormData(false)
            }
        } else {
            setFormClusters([])
        }
    }

    const openCreateModal = () => {
        resetForm()
        setShowCreateModal(true)
    }

    // Get state name for district display
    const getStateName = (stateId: number) => {
        return states.find(s => s.id === stateId)?.name || '-'
    }

    // Get district name for block display
    const getDistrictName = (districtId: number) => {
        return districts.find(d => d.id === districtId)?.name || '-'
    }

    const filteredDistricts = districts.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredBlocks = blocks.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading && districts.length === 0 && blocks.length === 0 && schools.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">School Configuration</h1>
                                <p className="text-white/70 text-sm">Manage districts, blocks, and schools</p>
                            </div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add {activeTab === 'districts' ? 'District' : activeTab === 'blocks' ? 'Block' : 'School'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 dark:text-green-300">{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 dark:text-red-300">{errorMessage}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('districts')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'districts'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MapPin className="w-4 h-4" />
                    Districts ({districts.length})
                </button>
                <button
                    onClick={() => setActiveTab('blocks')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'blocks'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Blocks ({blocks.length})
                </button>
                <button
                    onClick={() => setActiveTab('clusters')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'clusters'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Clusters ({clusters.length})
                </button>
                <button
                    onClick={() => setActiveTab('schools')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'schools'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <SchoolIcon className="w-4 h-4" />
                    Schools ({schools.length})
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                    />
                </div>

                {activeTab === 'districts' && (
                    <select
                        value={selectedStateId}
                        onChange={e => setSelectedStateId(Number(e.target.value))}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <option value={0}>All States</option>
                        {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}

                {activeTab === 'blocks' && (
                    <select
                        value={selectedDistrictId}
                        onChange={e => setSelectedDistrictId(Number(e.target.value))}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <option value={0}>All Districts</option>
                        {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                )}

                {activeTab === 'clusters' && (
                    <select
                        value={selectedBlockId}
                        onChange={e => setSelectedBlockId(Number(e.target.value))}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <option value={0}>All Blocks</option>
                        {blocks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                )}

                {activeTab === 'schools' && (
                    <select
                        value={selectedBlockId}
                        onChange={e => setSelectedBlockId(Number(e.target.value))}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <option value={0}>All Blocks</option>
                        {blocks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                    {activeTab === 'districts' && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">State</th>}
                                    {activeTab === 'blocks' && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">District</th>}
                                    {activeTab === 'schools' && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Code</th>}
                                    {activeTab === 'schools' && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Teachers</th>}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activeTab === 'districts' && filteredDistricts.map(d => (
                                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{getStateName(d.state_id)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {d.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(d)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(d.id)}
                                                    className={`p-2 rounded-lg ${d.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={d.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {d.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(d.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'blocks' && filteredBlocks.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{b.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{getDistrictName(b.district_id)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {b.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(b)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(b.id)}
                                                    className={`p-2 rounded-lg ${b.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={b.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(b.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'clusters' && clusters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Block ID: {c.block_id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(c.id)}
                                                    className={`p-2 rounded-lg ${c.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={c.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {c.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeTab === 'schools' && filteredSchools.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.code || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.teacher_count}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(s.id)}
                                                    className={`p-2 rounded-lg ${s.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={s.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {s.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {((activeTab === 'districts' && filteredDistricts.length === 0) ||
                            (activeTab === 'blocks' && filteredBlocks.length === 0) ||
                            (activeTab === 'schools' && filteredSchools.length === 0)) && (
                                <div className="p-12 text-center text-gray-500">
                                    No {activeTab} found. Click "Add" to create one.
                                </div>
                            )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl">
                        <div className="p-6 header-gradient rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                    {isEditing ? 'Edit' : 'Add'} {activeTab === 'districts' ? 'District' : activeTab === 'blocks' ? 'Block' : activeTab === 'clusters' ? 'Cluster' : 'School'}
                                </h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                                    required
                                />
                            </div>

                            {activeTab === 'districts' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                                    <select
                                        value={formData.state_id}
                                        onChange={e => setFormData({ ...formData, state_id: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                        required
                                    >
                                        <option value={0}>Select State</option>
                                        {states.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'blocks' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                                        <select
                                            value={formData.state_id}
                                            onChange={e => handleFormStateChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            required
                                        >
                                            <option value={0}>Select State</option>
                                            {states.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District *</label>
                                        <select
                                            value={formData.district_id}
                                            onChange={e => setFormData({ ...formData, district_id: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.state_id || loadingFormData}
                                            required
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select District'}</option>
                                            {formDistricts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeTab === 'clusters' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                                        <select
                                            value={formData.state_id}
                                            onChange={e => handleFormStateChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            required
                                        >
                                            <option value={0}>Select State</option>
                                            {states.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District *</label>
                                        <select
                                            value={formData.district_id}
                                            onChange={e => handleFormDistrictChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.state_id || loadingFormData}
                                            required
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select District'}</option>
                                            {formDistricts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Block *</label>
                                        <select
                                            value={formData.block_id}
                                            onChange={e => setFormData({ ...formData, block_id: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.district_id || loadingFormData}
                                            required
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select Block'}</option>
                                            {formBlocks.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeTab === 'schools' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                                        <select
                                            value={formData.state_id}
                                            onChange={e => handleFormStateChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            required
                                        >
                                            <option value={0}>Select State</option>
                                            {states.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District *</label>
                                        <select
                                            value={formData.district_id}
                                            onChange={e => handleFormDistrictChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.state_id || loadingFormData}
                                            required
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select District'}</option>
                                            {formDistricts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Block *</label>
                                        <select
                                            value={formData.block_id}
                                            onChange={e => handleFormBlockChange(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.district_id || loadingFormData}
                                            required
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select Block'}</option>
                                            {formBlocks.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cluster</label>
                                        <select
                                            value={formData.cluster_id}
                                            onChange={e => setFormData({ ...formData, cluster_id: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            disabled={!formData.block_id || loadingFormData}
                                        >
                                            <option value={0}>{loadingFormData ? 'Loading...' : 'Select Cluster (Optional)'}</option>
                                            {formClusters.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Code (UDISE)</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            placeholder="e.g., 29290104901"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
                                            rows={2}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.name}
                                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                                    {isEditing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
