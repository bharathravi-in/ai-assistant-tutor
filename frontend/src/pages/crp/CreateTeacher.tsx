import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users,
    UserPlus,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    X,
    Shield,
    MapPin,
    School,
    Check,
    ArrowLeft,
    CheckCircle
} from 'lucide-react'
import { crpApi, configApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'

interface LocationItem {
    id: number
    name: string
}

export default function CreateTeacher() {
    const navigate = useNavigate()
    const { grades: masterGrades, subjects: masterSubjects } = useMasterData()
    const GRADES = masterGrades.map(g => g.number)
    const SUBJECTS = masterSubjects.map(s => s.name)

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
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
        state_id: undefined as number | undefined,
        district_id: undefined as number | undefined,
        block_id: undefined as number | undefined,
        cluster_id: undefined as number | undefined,
        school_id: undefined as number | undefined,
        grades_taught: [] as number[],
        subjects_taught: [] as string[]
    })

    useEffect(() => {
        fetchStates()
    }, [])

    const fetchStates = async () => {
        try {
            const data = await configApi.getStates()
            setStates(data)
        } catch (err) { console.error('Failed to fetch states', err) }
    }

    const fetchDistricts = async (stateId: number) => {
        try {
            const data = await configApi.getDistricts(stateId)
            setDistricts(data)
        } catch (err) { console.error('Failed to fetch districts', err) }
    }

    const fetchBlocks = async (districtId: number) => {
        try {
            const data = await configApi.getBlocks(districtId)
            setBlocks(data)
        } catch (err) { console.error('Failed to fetch blocks', err) }
    }

    const fetchClusters = async (blockId: number) => {
        try {
            const data = await configApi.getClusters(blockId)
            setClusters(data)
        } catch (err) { console.error('Failed to fetch clusters', err) }
    }

    const fetchSchools = async (clusterId: number) => {
        try {
            const data = await configApi.getSchools(undefined, undefined, clusterId)
            setSchools(data)
        } catch (err) { console.error('Failed to fetch schools', err) }
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        setSuccess(false)

        // Get school name for display
        const selectedSchool = schools.find(s => s.id === form.school_id)
        const selectedDistrict = districts.find(d => d.id === form.district_id)

        try {
            await crpApi.createTeacher({
                name: form.name,
                phone: form.phone,
                password: form.password,
                school_name: selectedSchool?.name,
                school_district: selectedDistrict?.name,
                grades: form.grades_taught.length > 0 ? form.grades_taught : undefined,
                subjects: form.subjects_taught.length > 0 ? form.subjects_taught : undefined
            })
            setSuccess(true)
            setForm({
                name: '', phone: '', email: '', password: '',
                state_id: undefined, district_id: undefined, block_id: undefined,
                cluster_id: undefined, school_id: undefined,
                grades_taught: [], subjects_taught: []
            })
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create teacher')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50 dark:border-gray-700 bg-indigo-600">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/crp/teachers')}
                            className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft className="w-7 h-7 text-white" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Onboard New Teacher</h1>
                            <p className="text-white/80 font-medium text-sm mt-1">Add a teacher to your network</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Teacher Created Successfully!</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">They can now log in with their phone number and password.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Enter teacher's full name"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-all"
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                placeholder="10-digit phone number"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-all"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email (Optional)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="teacher@example.com"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="Create a secure password"
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Hierarchy */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Location</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* State */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
                            <select
                                value={form.state_id || ''}
                                onChange={e => handleLocationChange('state', Number(e.target.value))}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                            >
                                <option value="">Select State</option>
                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* District */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">District</label>
                            <select
                                value={form.district_id || ''}
                                onChange={e => handleLocationChange('district', Number(e.target.value))}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                                disabled={!form.state_id}
                            >
                                <option value="">{form.state_id ? 'Select District' : 'Select state first'}</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Block */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Block</label>
                            <select
                                value={form.block_id || ''}
                                onChange={e => handleLocationChange('block', Number(e.target.value))}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                                disabled={!form.district_id}
                            >
                                <option value="">{form.district_id ? 'Select Block' : 'Select district first'}</option>
                                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* Cluster */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cluster</label>
                            <select
                                value={form.cluster_id || ''}
                                onChange={e => handleLocationChange('cluster', Number(e.target.value))}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                                disabled={!form.block_id}
                            >
                                <option value="">{form.block_id ? 'Select Cluster' : 'Select block first'}</option>
                                {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* School */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">School</label>
                            <select
                                value={form.school_id || ''}
                                onChange={e => handleLocationChange('school', Number(e.target.value))}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                                disabled={!form.cluster_id}
                            >
                                <option value="">{form.cluster_id ? 'Select School' : 'Select cluster first'}</option>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Academic Context */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <School className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Teaching Details</h2>
                    </div>

                    {/* Grades */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Grades Taught</label>
                        <div className="flex flex-wrap gap-2">
                            {GRADES.map(grade => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => handleGradeToggle(grade)}
                                    className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${form.grades_taught.includes(grade)
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Subjects Taught</label>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map(subject => (
                                <button
                                    key={subject}
                                    type="button"
                                    onClick={() => handleSubjectToggle(subject)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.subjects_taught.includes(subject)
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={submitting || !form.name || !form.phone || !form.password}
                    className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
                    <span>{submitting ? 'Creating Teacher...' : 'Create Teacher'}</span>
                </button>
            </form>
        </div>
    )
}
