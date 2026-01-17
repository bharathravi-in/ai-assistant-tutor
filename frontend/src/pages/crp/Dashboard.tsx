import { useState, useEffect } from 'react'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    MessageSquare,
    User,
    Users,
    ChevronRight,
    Loader2,
    X,
    Sparkles,
    MapPin,
    Bell,
    UserCheck,
    UserX,
    Activity
} from 'lucide-react'
import { crpApi } from '../../services/api'
import type { Query } from '../../types'
import VoiceRecorder from '../../components/common/VoiceRecorder'

interface TeacherStatus {
    id: number
    name: string
    school: string
    last_activity: string | null
    query_count_week: number
    pending_reflections: number
    status: 'active' | 'inactive' | 'at_risk'
}

export default function CRPDashboard() {
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
    const [stats, setStats] = useState<{
        pending_reviews: number
        queries_today: number
    } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [isVoiceMode, setIsVoiceMode] = useState(false)
    const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
    const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
    const [filterMode, setFilterMode] = useState<string>('all')
    const [activeTab, setActiveTab] = useState<'queries' | 'teachers'>('queries')
    const [teachers, setTeachers] = useState<TeacherStatus[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [queriesData, statsData, teachersData] = await Promise.all([
                crpApi.getQueries({ page_size: 20 }),
                crpApi.getStats(),
                crpApi.getTeachers()
            ])
            setQueries(queriesData.items)
            setStats(statsData)
            setTeachers(teachersData.teachers || [])
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRespond = async (isOverride: boolean = false) => {
        if (!selectedQuery) return

        const obsNotes = (document.getElementById('obs-notes') as HTMLTextAreaElement)?.value || ''
        const responseText = (document.getElementById('crp-response') as HTMLTextAreaElement)?.value || ''

        setSubmitting(true)
        try {
            await crpApi.respond({
                query_id: selectedQuery.id,
                response_text: responseText || voiceTranscript || '',
                observation_notes: obsNotes,
                voice_note_url: voiceUrl || undefined,
                voice_note_transcript: voiceTranscript || undefined,
                tag: isOverride ? 'best_practice' : 'effective',
                overrides_ai: isOverride
            })
            setSelectedQuery(null)
            loadData()
        } catch (err) {
            console.error('Failed to respond:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'explain': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            case 'assist': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
            case 'plan': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500'
            case 'inactive': return 'bg-gray-400'
            case 'at_risk': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200'
            case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200'
            case 'at_risk': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    const filteredQueries = queries.filter(q => {
        if (filterMode === 'all') return true
        if (filterMode === 'pending') return q.requires_crp_review
        if (filterMode === 'resolved') return q.is_resolved
        return q.mode === filterMode
    })

    const inactiveTeachers = teachers.filter(t => t.status === 'inactive' || t.status === 'at_risk')
    const teachersWithPendingReflections = teachers.filter(t => t.pending_reflections > 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
                    <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Dashboard Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden animate-fade-in p-8 lg:p-10 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                CRP Operations Center
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">
                                Performance monitoring and teacher network guidance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center gap-3">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="font-bold uppercase tracking-wider text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priority Alerts */}
            {(inactiveTeachers.length > 0 || teachersWithPendingReflections.length > 0) && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-red-800 dark:text-red-300">Priority Alerts</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {inactiveTeachers.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                    <UserX className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{inactiveTeachers.length} Teachers Need Attention</p>
                                    <p className="text-xs text-gray-500">Inactive for 3+ days</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                        {teachersWithPendingReflections.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{teachersWithPendingReflections.reduce((a, t) => a + t.pending_reflections, 0)} Pending Reflections</p>
                                    <p className="text-xs text-gray-500">From {teachersWithPendingReflections.length} teachers</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {stats?.pending_reviews || 0}
                            </p>
                            <p className="text-xs text-gray-500">Pending Reviews</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                            <MessageSquare className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {stats?.queries_today || 0}
                            </p>
                            <p className="text-xs text-gray-500">Queries Today</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                            <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {teachers.filter(t => t.status === 'active').length}
                            </p>
                            <p className="text-xs text-gray-500">Active Teachers</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-secondary-100 dark:bg-secondary-900/30">
                            <CheckCircle className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {queries.filter(q => q.is_resolved).length}
                            </p>
                            <p className="text-xs text-gray-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('queries')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'queries'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Teacher Queries
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'teachers'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Teacher Network
                    {inactiveTeachers.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {inactiveTeachers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Queries Tab */}
            {activeTab === 'queries' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            Teacher Queries ({queries.length})
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {['all', 'pending', 'explain', 'assist', 'plan'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(mode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === mode
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredQueries.length === 0 ? (
                            <div className="p-12 text-center">
                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No queries found</p>
                            </div>
                        ) : (
                            filteredQueries.map((query) => (
                                <div
                                    key={query.id}
                                    onClick={() => setSelectedQuery(query)}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 dark:text-white truncate pr-4">
                                                    {query.input_text}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getModeColor(query.mode)}`}>
                                                        {query.mode}
                                                    </span>
                                                    {query.grade && (
                                                        <span className="text-xs text-gray-500">Grade {query.grade}</span>
                                                    )}
                                                    {query.requires_crp_review && (
                                                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            Needs Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            My Teacher Network ({teachers.length})
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {teachers.map((teacher) => (
                            <div
                                key={teacher.id}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                                {teacher.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(teacher.status)}`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {teacher.school}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                <Activity className="w-3 h-3 inline mr-1" />
                                                {teacher.query_count_week} queries this week
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Last active: {teacher.last_activity ? new Date(teacher.last_activity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(teacher.status)}`}>
                                            {teacher.status.replace('_', ' ')}
                                        </span>
                                        {teacher.pending_reflections > 0 && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                {teacher.pending_reflections} pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Query Detail Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-xl">
                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Query Details</h3>
                                        <p className="text-white/70 text-sm">Review and respond</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-5">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Teacher's Question</label>
                                <p className="text-gray-800 dark:text-white mt-1">{selectedQuery.input_text}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Grade', value: selectedQuery.grade || 'N/A' },
                                    { label: 'Subject', value: selectedQuery.subject || 'N/A' },
                                    { label: 'Class Type', value: selectedQuery.is_multigrade ? 'Multigrade' : 'Single' },
                                    { label: 'Class Size', value: selectedQuery.class_size || 'N/A' }
                                ].map(item => (
                                    <div key={item.label} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> AI Response
                                </label>
                                <div className="mt-2 p-4 bg-primary-50 dark:bg-gray-900 rounded-xl max-h-[150px] overflow-y-auto">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {selectedQuery.ai_response || 'No AI response yet'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Observation Notes</label>
                                <textarea
                                    id="obs-notes"
                                    placeholder="Add notes from your classroom observation..."
                                    className="w-full mt-2 p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Your Guidance</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                                        className="text-xs text-primary-600 font-semibold hover:underline"
                                    >
                                        {isVoiceMode ? '✏️ Switch to Text' : '🎤 Record Voice'}
                                    </button>
                                </div>

                                {isVoiceMode ? (
                                    <div className="space-y-3">
                                        <VoiceRecorder
                                            purpose="response"
                                            onUploadComplete={(url, transcript) => {
                                                setVoiceUrl(url)
                                                setVoiceTranscript(transcript)
                                            }}
                                        />
                                        {voiceTranscript && (
                                            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                                <span className="text-[10px] font-bold uppercase text-primary-600">Transcript</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">"{voiceTranscript}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        id="crp-response"
                                        placeholder="Provide specific, actionable guidance..."
                                        className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                                        rows={3}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => handleRespond(true)}
                                disabled={submitting}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-lg disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '⭐ Best Practice'}
                            </button>
                            <button
                                onClick={() => handleRespond(false)}
                                disabled={submitting}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-primary-500 text-white font-semibold shadow-lg disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '📤 Send Guidance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
