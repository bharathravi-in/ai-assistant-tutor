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
            case 'explain': return 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/10'
            case 'assist': return 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/10'
            case 'plan': return 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/10'
            default: return 'bg-[#F2F2F7] text-[#8E8E93]'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-[#34C759]'
            case 'inactive': return 'bg-[#AEAEB2]'
            case 'at_risk': return 'bg-[#FF3B30]'
            default: return 'bg-[#AEAEB2]'
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-[#34C759]/10 text-[#34C759] border-transparent'
            case 'inactive': return 'bg-[#F2F2F7] text-[#8E8E93] border-transparent'
            case 'at_risk': return 'bg-[#FF3B30]/10 text-[#FF3B30] border-transparent'
            default: return 'bg-[#F2F2F7] text-[#8E8E93]'
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
            <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[32px] border border-[#E5E5EA] dark:border-white/5 shadow-ios p-8 lg:p-10 mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/5 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-[20px] bg-[#007AFF] flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                                Operations Center
                            </h1>
                            <p className="text-[#8E8E93] font-medium mt-1">
                                Performance monitoring and guidance network
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-5 py-3 bg-[#F2F2F7] dark:bg-white/5 rounded-2xl border border-transparent dark:border-white/10 text-[#1C1C1E] dark:text-white text-sm flex items-center gap-3">
                            <Clock className="w-4 h-4 text-[#007AFF]" />
                            <span className="font-bold uppercase tracking-widest text-[11px]">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priority Alerts */}
            {(inactiveTeachers.length > 0 || teachersWithPendingReflections.length > 0) && (
                <div className="bg-[#FF3B30]/5 dark:bg-[#FF3B30]/10 rounded-[24px] p-6 border border-[#FF3B30]/10 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FF3B30] flex items-center justify-center">
                            <Bell className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-[#FF3B30] uppercase tracking-widest">Priority Interventions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {inactiveTeachers.length > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-[18px] border border-[#FF3B30]/10 shadow-sm group cursor-pointer hover:border-[#FF3B30]/30 transition-all">
                                <div className="w-12 h-12 rounded-[14px] bg-[#FF3B30]/10 flex items-center justify-center">
                                    <UserX className="w-6 h-6 text-[#FF3B30]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[#1C1C1E] dark:text-white">{inactiveTeachers.length} Network Risks</p>
                                    <p className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wider">Teachers inactive for 3+ days</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#AEAEB2] group-hover:text-[#FF3B30] transition-colors" />
                            </div>
                        )}
                        {teachersWithPendingReflections.length > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-[18px] border border-[#FF9500]/10 shadow-sm group cursor-pointer hover:border-[#FF9500]/30 transition-all">
                                <div className="w-12 h-12 rounded-[14px] bg-[#FF9500]/10 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-[#FF9500]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[#1C1C1E] dark:text-white">{teachersWithPendingReflections.reduce((a, t) => a + t.pending_reflections, 0)} Reflections</p>
                                    <p className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wider">From {teachersWithPendingReflections.length} teachers</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[#AEAEB2] group-hover:text-[#FF9500] transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Reviews', val: stats?.pending_reviews || 0, icon: AlertCircle, color: '#FF3B30' },
                    { label: 'Queries Today', val: stats?.queries_today || 0, icon: MessageSquare, color: '#007AFF' },
                    { label: 'Active Network', val: teachers.filter(t => t.status === 'active').length, icon: UserCheck, color: '#34C759' },
                    { label: 'Resolved', val: queries.filter(q => q.is_resolved).length, icon: CheckCircle, color: '#5856D6' }
                ].map((item, i) => (
                    <div key={i} className="card p-6 flex items-start justify-between group hover:border-[#007AFF]/30 transition-all">
                        <div>
                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">{item.label}</p>
                            <h4 className="text-3xl font-bold text-[#1C1C1E] dark:text-white">{item.val}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-[#F2F2F7] dark:bg-white/5 transition-transform group-hover:scale-110">
                            <item.icon className="w-6 h-6" style={{ color: item.color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation - Segmented Control */}
            <div className="p-1.5 bg-[#F2F2F7] dark:bg-white/5 rounded-[14px] flex w-fit gap-1">
                <button
                    onClick={() => setActiveTab('queries')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-[10px] text-sm font-semibold transition-all ${activeTab === 'queries'
                        ? 'bg-white dark:bg-white/10 shadow-ios text-[#007AFF] animate-scale-in'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Pending Queries
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-[10px] text-sm font-semibold transition-all relative ${activeTab === 'teachers'
                        ? 'bg-white dark:bg-white/10 shadow-ios text-[#007AFF] animate-scale-in'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Teacher Network
                    {inactiveTeachers.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#FF3B30] text-white text-[10px] flex items-center justify-center border-2 border-[#F2F2F7] dark:border-gray-900">
                            {inactiveTeachers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Queries Tab */}
            {activeTab === 'queries' && (
                <div className="card-highlight overflow-hidden">
                    <div className="p-6 border-b border-[#E5E5EA] dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-[#007AFF]" />
                            </div>
                            <h2 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider">
                                Active Inquiries ({queries.length})
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-[#F2F2F7] dark:bg-white/5 rounded-[12px]">
                            {['all', 'pending', 'explain', 'assist', 'plan'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(mode)}
                                    className={`px-4 py-1.5 rounded-[9px] text-[10px] font-bold uppercase tracking-widest transition-all ${filterMode === mode
                                        ? 'bg-white dark:bg-white/10 shadow-sm text-[#007AFF]'
                                        : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                        {filteredQueries.length === 0 ? (
                            <div className="p-20 text-center">
                                <MessageSquare className="w-12 h-12 text-[#AEAEB2] mx-auto mb-4" />
                                <p className="text-[#8E8E93] font-medium">No pending queries</p>
                            </div>
                        ) : (
                            filteredQueries.map((query) => (
                                <div
                                    key={query.id}
                                    onClick={() => setSelectedQuery(query)}
                                    className="p-5 hover:bg-[#F2F2F7] dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[14px] bg-[#F2F2F7] dark:bg-white/10 flex items-center justify-center group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF] transition-colors">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[#1C1C1E] dark:text-white truncate pr-4 text-sm">
                                                    {query.input_text}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold uppercase tracking-widest border ${getModeColor(query.mode)}`}>
                                                        {query.mode}
                                                    </span>
                                                    {query.grade && (
                                                        <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">Grade {query.grade}</span>
                                                    )}
                                                    {query.requires_crp_review && (
                                                        <span className="text-[10px] text-[#FF9500] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-pulse" />
                                                            Urgent Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#AEAEB2] group-hover:text-[#007AFF] transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
                <div className="card-highlight overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-white/5 bg-[#F2F2F7]/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-[#007AFF]" />
                            </div>
                            <h2 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider">
                                Teacher Network ({teachers.length})
                            </h2>
                        </div>
                    </div>

                    <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                        {teachers.map((teacher) => (
                            <div
                                key={teacher.id}
                                className="p-5 hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#007AFF] to-[#0051FF] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#007AFF]/10">
                                                {teacher.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-4 border-white dark:border-[#1C1C1E] ${getStatusColor(teacher.status)} transition-colors duration-300`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1C1C1E] dark:text-white mb-0.5">{teacher.name}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                                <MapPin className="w-3 h-3" />
                                                {teacher.school}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <div className="flex items-center justify-end gap-2 text-[#8E8E93]">
                                                <Activity className="w-3.5 h-3.5" />
                                                <span className="text-xs font-semibold">{teacher.query_count_week} queries / wk</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-[#AEAEB2] uppercase tracking-wider mt-1">
                                                Active {teacher.last_activity ? new Date(teacher.last_activity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-widest border ${getStatusBadge(teacher.status)}`}>
                                                {teacher.status.replace('_', ' ')}
                                            </span>
                                            {teacher.pending_reflections > 0 && (
                                                <span className="px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-widest bg-[#FF9500]/10 text-[#FF9500]">
                                                    {teacher.pending_reflections} Pending
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-white/5 flex items-center justify-center text-[#AEAEB2] group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF] transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Query Detail Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 bg-[#1C1C1E]/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[36px] shadow-2xl border border-white/20 dark:border-white/5 animate-zoom-in-95 flex flex-col">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-[#E5E5EA] dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/5 blur-3xl rounded-full -mr-20 -mt-20" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
                                        <MessageSquare className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#1C1C1E] dark:text-white">Review Inquiry</h3>
                                        <p className="text-[#8E8E93] font-medium uppercase text-[10px] tracking-widest mt-1">Direct stakeholder feedback</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="w-12 h-12 rounded-full bg-[#F2F2F7] dark:bg-white/5 hover:bg-[#E5E5EA] dark:hover:bg-white/10 flex items-center justify-center transition-all"
                                >
                                    <X className="w-6 h-6 text-[#1C1C1E] dark:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            <div className="p-6 bg-[#F2F2F7] dark:bg-white/5 rounded-[24px] border border-transparent dark:border-white/5">
                                <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-3 block">Perspective & Inquiry</label>
                                <p className="text-[#1C1C1E] dark:text-white font-semibold leading-relaxed text-lg italic">
                                    "{selectedQuery.input_text}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Academic Year', value: selectedQuery.grade ? `Grade ${selectedQuery.grade}` : 'General' },
                                    { label: 'Focus Subject', value: selectedQuery.subject || 'All Disciplines' },
                                    { label: 'Environment', value: selectedQuery.is_multigrade ? 'Hybrid' : 'Uniform' },
                                    { label: 'Cohort Size', value: selectedQuery.class_size || 'Standard' }
                                ].map(item => (
                                    <div key={item.label} className="bg-white dark:bg-white/5 rounded-[20px] p-4 border border-[#F2F2F7] dark:border-white/5 shadow-sm">
                                        <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1.5">{item.label}</p>
                                        <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#007AFF]" />
                                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Intelligent Synthesis (AI)</label>
                                </div>
                                <div className="p-6 bg-[#007AFF]/5 dark:bg-[#007AFF]/10 rounded-[24px] border border-[#007AFF]/10">
                                    <p className="text-[#1C1C1E] dark:text-white/90 text-[15px] leading-relaxed font-medium">
                                        {selectedQuery.ai_response || 'Synthesizing professional response...'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest px-1">Contextual Observations</label>
                                <textarea
                                    id="obs-notes"
                                    placeholder="Annotate specific classroom dynamics or observations..."
                                    className="w-full p-5 text-sm font-medium bg-[#F2F2F7] dark:bg-white/5 border border-transparent focus:border-[#007AFF]/30 dark:focus:border-[#007AFF]/30 rounded-[20px] focus:ring-0 resize-none transition-all h-24"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Professional Guidance</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#007AFF] hover:underline flex items-center gap-1.5 bg-[#007AFF]/10 px-3 py-1.5 rounded-full"
                                    >
                                        {isVoiceMode ? '✏️ Type Response' : '🎤 Oral Briefing'}
                                    </button>
                                </div>

                                {isVoiceMode ? (
                                    <div className="space-y-4">
                                        <VoiceRecorder
                                            purpose="response"
                                            onUploadComplete={(url, transcript) => {
                                                setVoiceUrl(url)
                                                setVoiceTranscript(transcript)
                                            }}
                                        />
                                        {voiceTranscript && (
                                            <div className="p-5 bg-[#007AFF]/5 dark:bg-[#007AFF]/10 rounded-[18px] border border-[#007AFF]/10">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#007AFF]">Transcript</span>
                                                <p className="text-sm text-[#1C1C1E] dark:text-white mt-2 italic font-medium">"{voiceTranscript}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        id="crp-response"
                                        placeholder="Deliver high-fidelity guidance and actionable steps..."
                                        className="w-full p-5 text-sm font-medium bg-[#F2F2F7] dark:bg-white/5 border border-transparent focus:border-[#1C1C1E]/20 dark:focus:border-white/20 rounded-[20px] focus:ring-0 resize-none transition-all h-32"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-[#F2F2F7] dark:bg-white/5 border-t border-[#E5E5EA] dark:border-white/5 flex gap-4">
                            <button
                                onClick={() => handleRespond(true)}
                                disabled={submitting}
                                className="flex-1 py-4 px-6 rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 text-[#1C1C1E] dark:text-white font-bold text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 text-[#FF9500]" /> Best Practice</>}
                            </button>
                            <button
                                onClick={() => handleRespond(false)}
                                disabled={submitting}
                                className="flex-1 py-4 px-6 rounded-[18px] bg-[#007AFF] text-white font-bold text-sm shadow-lg shadow-[#007AFF]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Finalize & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
