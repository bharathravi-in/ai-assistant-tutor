import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BookOpen,
    Users,
    ClipboardList,
    Send,
    Mic,
    Loader2,
    Sparkles,
    Volume2,
    ChevronRight,
    Lightbulb,
    Clock,
    TrendingUp,
    Star,
    ChevronDown,
    ChevronUp,
    Paperclip,
    X
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { aiApi, teacherSupportApi } from '../../services/api'
import type { QueryMode, QuickPrompt, Quiz, TLM, AuditResult } from '../../types'
import AIResponse from '../../components/teacher/AIResponse'
import ReflectionForm from '../../components/teacher/ReflectionForm'
import VoiceAssistant from '../../components/teacher/VoiceAssistant'
import QuizDrawer from '../../components/teacher/QuizDrawer'
import TLMDrawer from '../../components/teacher/TLMDrawer'

const modes: { id: QueryMode; icon: typeof BookOpen; label: string; description: string; color: string }[] = [
    { id: 'explain', icon: BookOpen, label: 'Explain / Teach', description: 'Get tips on explaining concepts to students', color: '#264092' },
    { id: 'assist', icon: Users, label: 'Classroom Assist', description: 'Get immediate help with challenges', color: '#EF951E' },
    { id: 'plan', icon: ClipboardList, label: 'Plan Lesson', description: 'Create an engaging lesson plan', color: '#22c55e' },
]

interface DisplayPrompt {
    icon: any
    text: string
    mode: QueryMode
}

const defaultQuickPrompts: DisplayPrompt[] = [
    { icon: Lightbulb, text: 'Explain photosynthesis for Class 6', mode: 'explain' as QueryMode },
    { icon: Clock, text: 'Create a 40-min lesson plan for Fractions', mode: 'plan' as QueryMode },
    { icon: TrendingUp, text: 'How to handle a noisy classroom?', mode: 'assist' as QueryMode },
    { icon: Star, text: 'Make learning fun for Class 5', mode: 'explain' as QueryMode },
]

export default function TeacherDashboard() {
    const { i18n } = useTranslation()
    const { mode, setMode, isLoading, setLoading, currentResponse, setResponse, setError } = useChatStore()
    const [inputText, setInputText] = useState('')
    const [showReflection, setShowReflection] = useState(false)
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
    const [showContext, setShowContext] = useState(true)
    const [dynamicQuickPrompts, setDynamicQuickPrompts] = useState<QuickPrompt[]>([])

    // Media State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string)
                }
                reader.readAsDataURL(file)
            } else {
                setPreviewUrl(null)
            }
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Quiz Genie State
    const [showQuizDrawer, setShowQuizDrawer] = useState(false)
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
    const [isQuizLoading, setIsQuizLoading] = useState(false)

    // TLM Designer State
    const [showTLMDrawer, setShowTLMDrawer] = useState(false)
    const [currentTLM, setCurrentTLM] = useState<TLM | null>(null)
    const [isTLMLoading, setIsTLMLoading] = useState(false)

    // NCERT Auditor State
    const [auditResults, setAuditResults] = useState<Record<number, AuditResult>>({})
    const [isAuditLoading, setIsAuditLoading] = useState(false)
    const [auditingQueryId, setAuditingQueryId] = useState<number | null>(null)

    useEffect(() => {
        const fetchQuickPrompts = async () => {
            try {
                const prompts = await teacherSupportApi.getQuickPrompts()
                setDynamicQuickPrompts(prompts)
            } catch (err) {
                console.error('Failed to fetch quick prompts', err)
            }
        }
        fetchQuickPrompts()
    }, [])

    const activeQuickPrompts: DisplayPrompt[] = dynamicQuickPrompts.length > 0
        ? dynamicQuickPrompts.map((p: QuickPrompt) => ({
            icon: p.mode === 'assist' ? TrendingUp : p.mode === 'plan' ? Clock : Lightbulb,
            text: p.text,
            mode: p.mode as QueryMode
        }))
        : defaultQuickPrompts

    // Classroom Context State
    const [grade, setGrade] = useState<number>(5)
    const [subject, setSubject] = useState('')
    const [topic, setTopic] = useState('')
    const [studentsLevel, setStudentsLevel] = useState('at grade level')
    const [isMultigrade, setIsMultigrade] = useState(false)
    const [classSize, setClassSize] = useState<number>(40)
    const [availableTime, setAvailableTime] = useState<number>(30)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || isLoading) return

        setLoading(true)
        setShowReflection(false)

        try {
            let uploadedMediaUrl = '';
            if (selectedFile) {
                setUploading(true);
                const uploadResult = await mediaApi.upload(selectedFile);
                uploadedMediaUrl = uploadResult.url;
                setUploading(false);
            }

            let response;
            if (mode === 'assist') {
                // Use specialized classroom help endpoint for assist mode
                const result = await teacherSupportApi.getClassroomHelp({
                    challenge: inputText,
                    grade,
                    subject,
                    topic,
                    students_level: studentsLevel,
                    is_multigrade: isMultigrade,
                    class_size: classSize,
                    instructional_time_minutes: availableTime,
                })
                response = {
                    query_id: result.query_id,
                    mode: 'assist' as QueryMode,
                    language: i18n.language,
                    content: result.guidance.immediate_action, // Fallback content
                    structured: result.guidance,
                    processing_time_ms: 0,
                    suggestions: []
                }
            } else {
                // Use generic ask for other modes
                response = await aiApi.ask({
                    mode,
                    input_text: inputText,
                    language: i18n.language,
                    grade,
                    subject,
                    topic,
                    is_multigrade: isMultigrade,
                    class_size: classSize,
                    instructional_time_minutes: availableTime,
                    media_path: uploadedMediaUrl
                })
            }
            setResponse(response)
            setInputText('')
            clearFile()
        } catch (err) {
            setError('Failed to get response. Please try again.')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    const handleGenerateQuiz = async (topicName: string, content: string) => {
        setIsQuizLoading(true)
        setShowQuizDrawer(true)
        try {
            const quiz = await aiApi.generateQuiz({
                topic: topicName || topic || 'Current Lesson',
                content: content,
                language: i18n.language,
                level: 'medium' // Can be made dynamic later
            })
            setCurrentQuiz(quiz)
        } catch (err) {
            console.error('Quiz generation failed', err)
            setError('Failed to generate quiz. Please try again.')
            setShowQuizDrawer(false)
        } finally {
            setIsQuizLoading(false)
        }
    }

    const handleGenerateTLM = async (topicName: string, content: string) => {
        setIsTLMLoading(true)
        setShowTLMDrawer(true)
        try {
            const tlm = await aiApi.generateTLM({
                topic: topicName || topic || 'Current Lesson',
                content: content,
                language: i18n.language
            })
            setCurrentTLM(tlm)
        } catch (err) {
            console.error('TLM generation failed', err)
            setError('Failed to design TLM. Please try again.')
            setShowTLMDrawer(false)
        } finally {
            setIsTLMLoading(false)
        }
    }

    const handleAuditContent = async (topicName: string, content: string) => {
        if (!currentResponse) return

        setIsAuditLoading(true)
        setAuditingQueryId(currentResponse.query_id)
        try {
            const audit = await aiApi.auditContent({
                topic: topicName || topic || 'Current Lesson',
                content: content,
                grade: grade,
                subject: subject
            })
            setAuditResults(prev => ({
                ...prev,
                [currentResponse.query_id]: audit
            }))
        } catch (err) {
            console.error('Audit failed', err)
            setError('Failed to audit content. Please try again.')
        } finally {
            setIsAuditLoading(false)
            setAuditingQueryId(null)
        }
    }

    const handleQuickPrompt = (prompt: string, promptMode: QueryMode) => {
        setMode(promptMode)
        setInputText(prompt)
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
                    {/* Hero Section */}
                    <div
                        className="relative rounded-3xl p-6 lg:p-10 text-white overflow-hidden shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: '#EF951E', transform: 'translate(30%, -40%)' }} />
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: '#F69953', transform: 'translate(-30%, 30%)' }} />

                        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 149, 30, 0.9)' }}>
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl lg:text-3xl font-bold">Hello, Teacher!</h1>
                                        <p className="text-white/70 text-sm lg:text-base">What can I help you with today?</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowVoiceAssistant(true)}
                                className="group flex items-center gap-3 px-6 py-4 rounded-2xl text-white transition-all duration-300 hover:scale-105 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                            >
                                <div className="relative">
                                    <Mic className="w-6 h-6" />
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-semibold">Voice Assistant</span>
                                    <span className="block text-xs text-white/80">Tap to speak</span>
                                </div>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 px-1">
                            Choose your mode
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {modes.map((m) => {
                                const isActive = mode === m.id
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${isActive
                                            ? 'bg-white dark:bg-gray-800 shadow-xl'
                                            : 'bg-white/80 dark:bg-gray-800/80 border-transparent hover:bg-white dark:hover:bg-gray-800'
                                            }`}
                                        style={isActive ? { borderColor: m.color, boxShadow: `0 8px 30px ${m.color}20` } : { borderColor: 'transparent' }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                            style={{
                                                background: isActive ? m.color : `${m.color}15`,
                                                color: isActive ? 'white' : m.color
                                            }}
                                        >
                                            <m.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{m.label}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{m.description}</p>
                                        {isActive && (
                                            <div
                                                className="absolute top-3 right-3 w-3 h-3 rounded-full"
                                                style={{ background: m.color }}
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Classroom Context Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <button
                            onClick={() => setShowContext(!showContext)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                <span className="font-semibold text-gray-700 dark:text-white">Classroom Context</span>
                                <span className="text-xs text-gray-400 font-normal">(Help us tailor the advice)</span>
                            </div>
                            {showContext ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {showContext && (
                            <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Class / Grade</label>
                                    <select
                                        value={grade}
                                        onChange={(e) => setGrade(parseInt(e.target.value))}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g. Mathematics"
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Fractions"
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Students' Level</label>
                                    <select
                                        value={studentsLevel}
                                        onChange={(e) => setStudentsLevel(e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    >
                                        <option value="at grade level">At grade level</option>
                                        <option value="below grade level">Below grade level</option>
                                        <option value="mixed abilities">Mixed abilities</option>
                                        <option value="struggling with basics">Struggling with basics</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                    <input
                                        type="checkbox"
                                        id="multigrade"
                                        checked={isMultigrade}
                                        onChange={(e) => setIsMultigrade(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="multigrade" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                        Multigrade Class
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Class Size</label>
                                    <input
                                        type="number"
                                        value={classSize}
                                        onChange={(e) => setClassSize(parseInt(e.target.value))}
                                        placeholder="e.g. 40"
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Time (mins)</label>
                                    <input
                                        type="number"
                                        value={availableTime}
                                        onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                                        placeholder="e.g. 30"
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    {!currentResponse && !isLoading && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
                                Quick prompts to get started
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {activeQuickPrompts.map((prompt: DisplayPrompt, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickPrompt(prompt.text, prompt.mode)}
                                        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all text-left group hover:shadow-md"
                                    >
                                        <div className="p-2 rounded-lg" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                            <prompt.icon className="w-5 h-5" style={{ color: '#264092' }} />
                                        </div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                                            {prompt.text}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Response Area */}
                    {(currentResponse || isLoading) && (
                        <div className="space-y-6 pb-32">
                            {isLoading ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                                    <div className="relative mb-4">
                                        <div
                                            className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 animate-spin"
                                        />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Thinking...</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your AI assistant is preparing a response</p>
                                </div>
                            ) : (
                                <>
                                    <AIResponse
                                        response={currentResponse!}
                                        mode={mode}
                                        onGenerateQuiz={handleGenerateQuiz}
                                        isQuizLoading={isQuizLoading}
                                        onGenerateTLM={handleGenerateTLM}
                                        isTLMLoading={isTLMLoading}
                                        onAudit={handleAuditContent}
                                        isAuditLoading={isAuditLoading && auditingQueryId === currentResponse?.query_id}
                                        auditResult={currentResponse ? auditResults[currentResponse.query_id] : undefined}
                                    />
                                    {!showReflection && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setShowReflection(true)}
                                                className="px-6 py-3 rounded-xl border-2 font-medium transition-all hover:shadow-md"
                                                style={{ borderColor: '#264092', color: '#264092' }}
                                            >
                                                Add Reflection
                                            </button>
                                        </div>
                                    )}
                                    {showReflection && (
                                        <ReflectionForm
                                            queryId={currentResponse!.query_id}
                                            onComplete={() => setShowReflection(false)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Bottom Input Section */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        {/* File Preview */}
                        {(selectedFile || uploading) && (
                            <div className="absolute bottom-full left-0 mb-4 animate-slide-up">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                    {previewUrl ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-primary-600" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-[120px]">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                                            {uploading ? 'Uploading...' : selectedFile?.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {uploading ? 'Processing content...' : 'Ready for AI analysis'}
                                        </p>
                                    </div>
                                    {!uploading && (
                                        <button
                                            type="button"
                                            onClick={clearFile}
                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {uploading && <Loader2 className="w-4 h-4 text-primary-600 animate-spin mr-2" />}
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'assist' ? "Describe the classroom challenge..." : "Explain Newton's laws..."}
                                className="w-full min-h-[60px] max-h-[150px] p-4 pr-40 text-gray-800 dark:text-white bg-transparent border-0 resize-none focus:outline-none custom-scrollbar"
                                disabled={isLoading || uploading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e as any);
                                    }
                                }}
                            />

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />

                            <div className="absolute right-2 bottom-2 flex items-center gap-1 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 rounded-xl transition-colors ${selectedFile ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    title="Upload lesson notes or textbook photo"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowVoiceAssistant(true)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || uploading || (!inputText.trim() && !selectedFile)}
                                    className="flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                    style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                                >
                                    {isLoading || uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            Press Enter to send. Use Shift+Enter for new line.
                        </p>
                    </form>
                </div>
            </div>

            {/* Modals */}
            <VoiceAssistant
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
            />

            <QuizDrawer
                isOpen={showQuizDrawer}
                onClose={() => setShowQuizDrawer(false)}
                quiz={currentQuiz}
                isLoading={isQuizLoading}
                onRegenerate={() => {
                    if (currentResponse) {
                        handleGenerateQuiz(currentResponse.query?.topic || topic || 'Current Lesson', currentResponse.content)
                    }
                }}
            />

            <TLMDrawer
                isOpen={showTLMDrawer}
                onClose={() => setShowTLMDrawer(false)}
                tlm={currentTLM}
                isLoading={isTLMLoading}
                onRegenerate={() => {
                    if (currentResponse) {
                        handleGenerateTLM(currentResponse.query?.topic || topic || 'Current Lesson', currentResponse.content)
                    }
                }}
            />
        </div>
    )
}
