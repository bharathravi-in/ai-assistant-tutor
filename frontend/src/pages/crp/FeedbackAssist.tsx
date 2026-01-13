import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Sparkles,
    FileText,
    Target,
    Users,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Calendar,
    User as UserIcon,
    BookOpen,
    Send,
    Plus,
    X,
    LayoutTemplate
} from 'lucide-react'
import { crpSupportApi } from '../../services/api'

interface AIPart {
    title: string
    content: string
    icon: any
    color: string
}

export default function FeedbackAssist() {
    const { t, i18n } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [feedback, setFeedback] = useState<any>(null)
    const [improvementPlan, setImprovementPlan] = useState<any>(null)
    const [template, setTemplate] = useState<any>(null)

    // Form state
    const [teacherName, setTeacherName] = useState('')
    const [classObserved, setClassObserved] = useState('')
    const [subjectTopic, setSubjectTopic] = useState('')
    const [observationNotes, setObservationNotes] = useState('')
    const [keyAreas, setKeyAreas] = useState<string[]>([])
    const [newArea, setNewArea] = useState('')

    const handleGenerateFeedback = async () => {
        if (!teacherName || !observationNotes) return

        setIsLoading(true)
        try {
            const result = await crpSupportApi.generateFeedback({
                teacher_name: teacherName,
                class_observed: classObserved,
                subject_topic: subjectTopic,
                observation_notes: observationNotes,
                language: i18n.language
            })
            setFeedback(result.feedback)
        } catch (error) {
            console.error('Failed to generate feedback', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGeneratePlan = async () => {
        if (!teacherName || keyAreas.length === 0) return

        setIsLoading(true)
        try {
            const result = await crpSupportApi.generateImprovementPlan({
                teacher_name: teacherName,
                key_areas: keyAreas,
                current_strengths: [], // Optional
                target_duration_weeks: 4,
                language: i18n.language
            })
            setImprovementPlan(result.plan)
        } catch (error) {
            console.error('Failed to generate plan', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTemplate = async () => {
        try {
            const result = await crpSupportApi.getObservationTemplate()
            setTemplate(result.template)
        } catch (error) {
            console.error('Failed to fetch template', error)
        }
    }

    useEffect(() => {
        fetchTemplate()
    }, [])

    const addArea = () => {
        if (newArea.trim() && !keyAreas.includes(newArea.trim())) {
            setKeyAreas([...keyAreas, newArea.trim()])
            setNewArea('')
        }
    }

    const removeArea = (area: string) => {
        setKeyAreas(keyAreas.filter(a => a !== area))
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary-600" />
                    Feedback Assistant
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Generate specific, actionable feedback for teachers based on your classroom observations.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Observation Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={teacherName}
                                        onChange={(e) => setTeacherName(e.target.value)}
                                        placeholder="e.g. Rajesh Kumar"
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                                    <input
                                        type="text"
                                        value={classObserved}
                                        onChange={(e) => setClassObserved(e.target.value)}
                                        placeholder="e.g. Class 5-C"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject/Topic</label>
                                    <input
                                        type="text"
                                        value={subjectTopic}
                                        onChange={(e) => setSubjectTopic(e.target.value)}
                                        placeholder="e.g. Math / Fractions"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observation Notes</label>
                                <textarea
                                    value={observationNotes}
                                    onChange={(e) => setObservationNotes(e.target.value)}
                                    placeholder="Enter your rough notes here... What went well? What could be improved?"
                                    className="w-full min-h-[150px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                />
                            </div>

                            <button
                                onClick={handleGenerateFeedback}
                                disabled={isLoading || !teacherName || !observationNotes}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Generate Feedback</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-orange-500" />
                            Improvement Areas
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">Add areas you want to include in a multi-week improvement plan.</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newArea}
                                onChange={(e) => setNewArea(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addArea()}
                                placeholder="e.g. Classroom Management"
                                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                            />
                            <button
                                onClick={addArea}
                                className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {keyAreas.map(area => (
                                <span key={area} className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium border border-orange-100 dark:border-orange-800">
                                    {area}
                                    <button onClick={() => removeArea(area)}><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                            {keyAreas.length === 0 && <p className="text-sm text-gray-400 italic">No areas added yet</p>}
                        </div>

                        <button
                            onClick={handleGeneratePlan}
                            disabled={isLoading || !teacherName || keyAreas.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Improvement Plan'}
                        </button>
                    </div>
                </div>

                {/* Right Column: AI Output */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Feedback Results */}
                    {feedback ? (
                        <div className="space-y-6 animate-slide-up">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-primary-900/5 border border-primary-100 dark:border-primary-900/20 overflow-hidden">
                                <div className="bg-primary-600 p-6 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-6 h-6" />
                                            <h3 className="text-xl font-bold">Generated Feedback</h3>
                                        </div>
                                        <div className="text-xs bg-white/20 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                                            Generated for {teacherName}
                                        </div>
                                    </div>
                                    <p className="text-primary-100 text-sm">Actionable insights based on your observation notes.</p>
                                </div>
                                <div className="p-8 space-y-8">
                                    {/* Strengths */}
                                    <div className="relative pl-8 border-l-2 border-green-500">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                        <h4 className="text-green-600 dark:text-green-400 font-bold mb-3 uppercase tracking-wider text-xs">Observed Strengths</h4>
                                        <ul className="space-y-2">
                                            {feedback.strengths?.map((s: string, i: number) => (
                                                <li key={i} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Actionable Suggestions */}
                                    <div className="relative pl-8 border-l-2 border-primary-500">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-full flex items-center justify-center">
                                            <Target className="w-3 h-3 text-primary-500" />
                                        </div>
                                        <h4 className="text-primary-600 dark:text-primary-400 font-bold mb-4 uppercase tracking-wider text-xs">Actionable Recommendations</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {feedback.actionable_suggestions?.map((s: any, i: number) => (
                                                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl group hover:border-primary-200 transition-colors">
                                                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded text-[10px] font-bold uppercase mb-2">
                                                        {s.category}
                                                    </span>
                                                    <p className="font-semibold text-gray-800 dark:text-white text-sm mb-2">{s.suggestion}</p>
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 italic">
                                                        "Try saying: {s.how_to_implement}"
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Micro-learning */}
                                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-primary-700 rounded-3xl text-white">
                                        <div className="flex items-center gap-3 mb-4">
                                            <BookOpen className="w-6 h-6 p-1 bg-white/20 rounded-lg" />
                                            <h4 className="font-bold">Recommended Resources</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {feedback.recommended_micro_learning?.map((res: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors cursor-pointer group border border-white/10">
                                                    <div>
                                                        <p className="font-semibold text-sm">{res.resource_title}</p>
                                                        <p className="text-xs text-white/60">{res.type} • {res.focus_area}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Feedback Script */}
                                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-6 rounded-3xl">
                                        <h4 className="text-orange-700 dark:text-orange-400 font-bold mb-3 text-sm flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Mentor Speech Suggestion
                                        </h4>
                                        <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">
                                            "{feedback.suggested_feedback_script}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : improvementPlan ? (
                        <div className="space-y-6 animate-slide-up">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <Calendar className="w-7 h-7 text-orange-500" />
                                    Growth Plan: {teacherName}
                                </h3>

                                <div className="space-y-12">
                                    {improvementPlan.milestones?.map((m: any, i: number) => (
                                        <div key={i} className="relative pl-12">
                                            <div className="absolute left-0 top-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center font-bold text-orange-600 border border-orange-200">
                                                {i + 1}
                                            </div>
                                            {i < improvementPlan.milestones.length - 1 && (
                                                <div className="absolute left-4 top-8 bottom-[-48px] w-0.5 bg-gray-100 dark:bg-gray-700" />
                                            )}

                                            <div className="mb-4">
                                                <h4 className="text-lg font-bold text-gray-800 dark:text-white">{m.milestone_title}</h4>
                                                <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">{m.focus_area}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Activities</p>
                                                        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                                                            {m.specific_activities?.map((a: string, j: number) => (
                                                                <li key={j} className="flex gap-2">• {a}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-green-500 uppercase mb-2">Success Indicator</p>
                                                        <p className="text-sm text-green-700 dark:text-green-400">{m.success_indicator}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">Waiting for Observation Notes</h3>
                            <p className="text-gray-400 max-w-sm">Fill in the details on the left to generate specific mentorship feedback and growth plans.</p>

                            {template && (
                                <div className="mt-12 w-full max-w-md">
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest justify-center">
                                        <LayoutTemplate className="w-4 h-4" />
                                        Observation Template
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {template.sections?.map((sec: any, i: number) => (
                                            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-left">
                                                <p className="text-xs font-bold text-gray-800 dark:text-white mb-1 truncate">{sec.title}</p>
                                                <p className="text-[10px] text-gray-400 line-clamp-2">{sec.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
