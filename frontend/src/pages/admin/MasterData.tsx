import { useState, useEffect } from 'react'
import {
    Database,
    Plus,
    Loader2,
    Search,
    X,
    MapPin,
    BookOpen,
    GraduationCap,
    Building,
    Languages,
    Trash2,
    CheckCircle,
    AlertCircle,
    Globe,
    Eye,
    EyeOff
} from 'lucide-react'
import api from '../../services/api'
import { useAdminLanguages, type AppLanguage } from '../../hooks/useAppLanguages'

interface BaseItem {
    id: number
    name: string
    code?: string
    is_active: boolean
}

interface State extends BaseItem {
    code: string
}

interface District extends BaseItem {
    state_id: number
}

interface Subject extends BaseItem {
    code: string
    name_hindi?: string
}

interface Grade extends BaseItem {
    number: number
    alias?: string
}

interface Board extends BaseItem {
    code: string
    full_name?: string
}

interface Medium extends BaseItem {
    code: string
}

type TabType = 'states' | 'districts' | 'subjects' | 'grades' | 'boards' | 'mediums' | 'languages'

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'states', label: 'States', icon: MapPin },
    { id: 'districts', label: 'Districts', icon: Building },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'grades', label: 'Classes', icon: GraduationCap },
    { id: 'boards', label: 'Boards', icon: Building },
    { id: 'mediums', label: 'Mediums', icon: Languages },
    { id: 'languages', label: 'App Languages', icon: Globe },
]

// Languages Panel Component
function LanguagesPanel() {
    const { languages, isLoading, toggleLanguage, seedLanguages, refetch } = useAdminLanguages()
    const [seeding, setSeeding] = useState(false)
    const [togglingId, setTogglingId] = useState<number | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSeedLanguages = async () => {
        setSeeding(true)
        try {
            const result = await seedLanguages()
            setMessage({ type: 'success', text: result.message })
            setTimeout(() => setMessage(null), 3000)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to seed languages' })
        } finally {
            setSeeding(false)
        }
    }

    const handleToggleLanguage = async (id: number, currentActive: boolean) => {
        setTogglingId(id)
        try {
            await toggleLanguage(id, !currentActive)
            setMessage({ type: 'success', text: `Language ${!currentActive ? 'enabled' : 'disabled'} successfully` })
            setTimeout(() => setMessage(null), 2000)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to toggle language' })
        } finally {
            setTogglingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-300">Application Languages</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            Enable or disable languages that teachers can use in the app. Only enabled languages will appear in the language selector.
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Seed Button */}
            {languages.length === 0 && (
                <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Languages Configured</h3>
                    <p className="text-gray-500 mb-4">Click below to add all official Indian languages</p>
                    <button
                        onClick={handleSeedLanguages}
                        disabled={seeding}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                    >
                        {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Seed All Indian Languages
                    </button>
                </div>
            )}

            {/* Languages Grid */}
            {languages.length > 0 && (
                <>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            {languages.filter(l => l.is_active).length} of {languages.length} languages enabled
                        </p>
                        <button
                            onClick={handleSeedLanguages}
                            disabled={seeding}
                            className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Missing Languages
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {languages.map((lang) => (
                            <div
                                key={lang.id}
                                className={`p-4 rounded-xl border transition-all ${
                                    lang.is_active
                                        ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                                            lang.is_active 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                        }`}>
                                            {lang.native_name.slice(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{lang.name}</h4>
                                            <p className="text-sm text-gray-500">{lang.native_name} • {lang.code.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleLanguage(lang.id, lang.is_active)}
                                        disabled={togglingId === lang.id || lang.code === 'en'}
                                        className={`p-2 rounded-lg transition-colors ${
                                            lang.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300'
                                        } disabled:opacity-50`}
                                        title={lang.code === 'en' ? 'English cannot be disabled' : (lang.is_active ? 'Disable' : 'Enable')}
                                    >
                                        {togglingId === lang.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : lang.is_active ? (
                                            <Eye className="w-5 h-5" />
                                        ) : (
                                            <EyeOff className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {lang.script && (
                                    <p className="text-xs text-gray-400 mt-2">Script: {lang.script}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default function MasterData() {
    const [activeTab, setActiveTab] = useState<TabType>('states')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [selectedStateId, setSelectedStateId] = useState<number>(0)

    // Data
    const [states, setStates] = useState<State[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [grades, setGrades] = useState<Grade[]>([])
    const [boards, setBoards] = useState<Board[]>([])
    const [mediums, setMediums] = useState<Medium[]>([])

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        name_hindi: '',
        full_name: '',
        number: 1,
        alias: '',
        state_id: 0
    })

    useEffect(() => {
        loadData()
    }, [activeTab, selectedStateId])

    // Load states first for districts filter
    useEffect(() => {
        const loadStates = async () => {
            try {
                const response = await api.get('/admin/config/states')
                setStates(response.data)
            } catch (err) {
                console.error('Failed to load states')
            }
        }
        loadStates()
    }, [])

    const loadData = async () => {
        setLoading(true)
        setErrorMessage('')
        try {
            let endpoint = `/admin/config/${activeTab}`
            if (activeTab === 'districts' && selectedStateId > 0) {
                endpoint += `?state_id=${selectedStateId}`
            }
            const response = await api.get(endpoint)
            switch (activeTab) {
                case 'states': setStates(response.data); break
                case 'districts': setDistricts(response.data); break
                case 'subjects': setSubjects(response.data); break
                case 'grades': setGrades(response.data); break
                case 'boards': setBoards(response.data); break
                case 'mediums': setMediums(response.data); break
            }
        } catch (err: any) {
            console.error('Failed to load data:', err)
            // Use sample data if API fails
            loadSampleData()
        } finally {
            setLoading(false)
        }
    }

    const loadSampleData = () => {
        switch (activeTab) {
            case 'states':
                setStates([
                    { id: 1, name: 'Karnataka', code: 'KA', is_active: true },
                    { id: 2, name: 'Tamil Nadu', code: 'TN', is_active: true },
                    { id: 3, name: 'Maharashtra', code: 'MH', is_active: true },
                    { id: 4, name: 'Kerala', code: 'KL', is_active: true },
                    { id: 5, name: 'Andhra Pradesh', code: 'AP', is_active: true },
                ])
                break
            case 'subjects':
                setSubjects([
                    { id: 1, name: 'Mathematics', code: 'MATH', name_hindi: 'गणित', is_active: true },
                    { id: 2, name: 'Science', code: 'SCI', name_hindi: 'विज्ञान', is_active: true },
                    { id: 3, name: 'English', code: 'ENG', name_hindi: 'अंग्रेज़ी', is_active: true },
                    { id: 4, name: 'Hindi', code: 'HIN', name_hindi: 'हिंदी', is_active: true },
                    { id: 5, name: 'Social Studies', code: 'SST', name_hindi: 'सामाजिक अध्ययन', is_active: true },
                    { id: 6, name: 'Kannada', code: 'KAN', name_hindi: 'कन्नड़', is_active: true },
                    { id: 7, name: 'EVS', code: 'EVS', name_hindi: 'पर्यावरण अध्ययन', is_active: true },
                ])
                break
            case 'grades':
                setGrades([
                    { id: 1, number: 1, name: 'Class 1', alias: 'I', is_active: true },
                    { id: 2, number: 2, name: 'Class 2', alias: 'II', is_active: true },
                    { id: 3, number: 3, name: 'Class 3', alias: 'III', is_active: true },
                    { id: 4, number: 4, name: 'Class 4', alias: 'IV', is_active: true },
                    { id: 5, number: 5, name: 'Class 5', alias: 'V', is_active: true },
                    { id: 6, number: 6, name: 'Class 6', alias: 'VI', is_active: true },
                    { id: 7, number: 7, name: 'Class 7', alias: 'VII', is_active: true },
                    { id: 8, number: 8, name: 'Class 8', alias: 'VIII', is_active: true },
                    { id: 9, number: 9, name: 'Class 9', alias: 'IX', is_active: true },
                    { id: 10, number: 10, name: 'Class 10', alias: 'X', is_active: true },
                    { id: 11, number: 11, name: 'Class 11', alias: 'XI', is_active: true },
                    { id: 12, number: 12, name: 'Class 12', alias: 'XII', is_active: true },
                ])
                break
            case 'boards':
                setBoards([
                    { id: 1, name: 'CBSE', code: 'CBSE', full_name: 'Central Board of Secondary Education', is_active: true },
                    { id: 2, name: 'ICSE', code: 'ICSE', full_name: 'Indian Certificate of Secondary Education', is_active: true },
                    { id: 3, name: 'Karnataka State Board', code: 'KAR', full_name: 'Karnataka Secondary Education Examination Board', is_active: true },
                    { id: 4, name: 'Tamil Nadu State Board', code: 'TN', full_name: 'Tamil Nadu Board of Secondary Education', is_active: true },
                ])
                break
            case 'mediums':
                setMediums([
                    { id: 1, name: 'English', code: 'EN', is_active: true },
                    { id: 2, name: 'Hindi', code: 'HI', is_active: true },
                    { id: 3, name: 'Kannada', code: 'KN', is_active: true },
                    { id: 4, name: 'Tamil', code: 'TA', is_active: true },
                    { id: 5, name: 'Telugu', code: 'TE', is_active: true },
                    { id: 6, name: 'Marathi', code: 'MR', is_active: true },
                ])
                break
            case 'districts':
                setDistricts([
                    { id: 1, name: 'Bengaluru Urban', state_id: 1, is_active: true },
                    { id: 2, name: 'Bengaluru Rural', state_id: 1, is_active: true },
                    { id: 3, name: 'Mysuru', state_id: 1, is_active: true },
                ])
                break
        }
    }

    const resetForm = () => {
        setFormData({ name: '', code: '', name_hindi: '', full_name: '', number: 1, alias: '', state_id: 0 })
        setEditingId(null)
    }

    const openCreateModal = () => {
        resetForm()
        setShowModal(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setErrorMessage('')

        try {
            const endpoint = `/admin/config/${activeTab}`
            let payload: Record<string, unknown> = { name: formData.name }

            switch (activeTab) {
                case 'states':
                case 'mediums':
                    payload.code = formData.code
                    break
                case 'subjects':
                    payload.code = formData.code
                    payload.name_hindi = formData.name_hindi || undefined
                    break
                case 'grades':
                    payload.number = formData.number
                    payload.alias = formData.alias || undefined
                    break
                case 'boards':
                    payload.code = formData.code
                    payload.full_name = formData.full_name || undefined
                    break
                case 'districts':
                    payload.state_id = formData.state_id
                    break
            }

            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, payload)
            } else {
                await api.post(endpoint, payload)
            }

            setShowModal(false)
            setSuccessMessage(editingId ? 'Updated successfully!' : 'Created successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
            loadData()
            resetForm()
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return

        try {
            await api.delete(`/admin/config/${activeTab}/${id}`)
            setSuccessMessage('Deleted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
            loadData()
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || 'Failed to delete')
        }
    }

    const getCurrentData = (): BaseItem[] => {
        const query = searchQuery.toLowerCase()
        let data: BaseItem[] = []
        switch (activeTab) {
            case 'states': data = states; break
            case 'districts': data = districts; break
            case 'subjects': data = subjects; break
            case 'grades': data = grades; break
            case 'boards': data = boards; break
            case 'mediums': data = mediums; break
        }
        return data.filter(item => item.name.toLowerCase().includes(query))
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Master Data</h1>
                                <p className="text-white/70 text-sm">Configure states, subjects, classes, and more</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={async () => {
                                    setSaving(true)
                                    try {
                                        await api.post('/admin/config/seed-data')
                                        setSuccessMessage('Master data seeded successfully!')
                                        setTimeout(() => setSuccessMessage(''), 3000)
                                        loadData()
                                    } catch (err: any) {
                                        setErrorMessage(err.response?.data?.detail || 'Failed to seed data')
                                    } finally {
                                        setSaving(false)
                                    }
                                }}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Seed India Data
                            </button>

                            <a
                                href={`/api/admin/config/download-template/${activeTab}`}
                                download
                                className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                Template
                            </a>

                            <label className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium flex items-center gap-2 cursor-pointer transition-colors">
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        setSaving(true)
                                        try {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            const res = await api.post(`/admin/config/bulk-upload/${activeTab}`, formData)
                                            setSuccessMessage(`Uploaded: ${res.data.success} added, ${res.data.failed} failed`)
                                            setTimeout(() => setSuccessMessage(''), 5000)
                                            loadData()
                                        } catch (err: any) {
                                            setErrorMessage('Upload failed')
                                        } finally {
                                            setSaving(false)
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                <Plus className="w-4 h-4" />
                                Upload CSV
                            </label>

                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Add {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
                            </button>
                        </div>
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
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    {activeTab === 'districts' && (
                        <select
                            value={selectedStateId}
                            onChange={(e) => setSelectedStateId(parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 min-w-[200px]"
                        >
                            <option value={0}>All States</option>
                            {states.map(state => (
                                <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Languages Tab - Special Panel */}
            {activeTab === 'languages' ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <LanguagesPanel />
                </div>
            ) : (
            /* Data Table for other tabs */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    {(activeTab === 'states' || activeTab === 'subjects' || activeTab === 'boards' || activeTab === 'mediums') && (
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                                    )}
                                    {activeTab === 'grades' && (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alias</th>
                                        </>
                                    )}
                                    {activeTab === 'subjects' && (
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hindi Name</th>
                                    )}
                                    {activeTab === 'boards' && (
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {getCurrentData().map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        {(activeTab === 'states' || activeTab === 'subjects' || activeTab === 'boards' || activeTab === 'mediums') && (
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                                                    {item.code}
                                                </span>
                                            </td>
                                        )}
                                        {activeTab === 'grades' && (
                                            <>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(item as Grade).number}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(item as Grade).alias || '-'}</td>
                                            </>
                                        )}
                                        {activeTab === 'subjects' && (
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(item as Subject).name_hindi || '-'}</td>
                                        )}
                                        {activeTab === 'boards' && (
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{(item as Board).full_name || '-'}</td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {getCurrentData().length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No items found
                            </div>
                        )}
                    </div>
                )}
            </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && activeTab !== 'languages' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl">
                        <div className="p-6 bg-gradient-to-r from-amber-600 to-orange-600">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                    {editingId ? 'Edit' : 'Add'} {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    required
                                />
                            </div>

                            {(activeTab === 'states' || activeTab === 'subjects' || activeTab === 'boards' || activeTab === 'mediums') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            )}

                            {activeTab === 'subjects' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Hindi Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_hindi}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name_hindi: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                            )}

                            {activeTab === 'grades' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Class Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, number: parseInt(e.target.value) }))}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                            min={1}
                                            max={12}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Roman Numeral Alias
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.alias}
                                            onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                            placeholder="e.g., I, II, III"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'boards' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                            )}

                            {activeTab === 'districts' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.state_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state_id: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                        required
                                    >
                                        <option value={0}>Select State</option>
                                        {states.map(state => (
                                            <option key={state.id} value={state.id}>{state.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !formData.name}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
