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
    ChevronUp
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { aiApi, teacherSupportApi } from '../../services/api'
import type { QueryMode } from '../../types'
import AIResponse from '../../components/teacher/AIResponse'
import ReflectionForm from '../../components/teacher/ReflectionForm'
import VoiceAssistant from '../../components/teacher/VoiceAssistant'

const modes: { id: QueryMode; icon: typeof BookOpen; label: string; description: string; color: string }[] = [
    { id: 'explain', icon: BookOpen, label: 'Explain / Teach', description: 'Get tips on explaining concepts to students', color: '#264092' },
    { id: 'assist', icon: Users, label: 'Classroom Assist', description: 'Get immediate help with challenges', color: '#EF951E' },
    { id: 'plan', icon: ClipboardList, label: 'Plan Lesson', description: 'Create an engaging lesson plan', color: '#22c55e' },
]

const defaultQuickPrompts = [
    { icon: Lightbulb, text: 'How to teach fractions to Class 4?', mode: 'explain' as QueryMode },
    { icon: Clock, text: '30-minute science activity ideas', mode: 'plan' as QueryMode },
    { icon: TrendingUp, text: 'Student engagement techniques', mode: 'assist' as QueryMode },
    { icon: Star, text: 'Make learning fun for Class 5', mode: 'explain' as QueryMode },
]

export default function TeacherDashboard() {
    const { t, i18n } = useTranslation()
    const { mode, setMode, isLoading, setLoading, currentResponse, setResponse, setError } = useChatStore()
    const [inputText, setInputText] = useState('')
    const [showReflection, setShowReflection] = useState(false)
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
    const [showContext, setShowContext] = useState(true)
    const [dynamicQuickPrompts, setDynamicQuickPrompts] = useState<any[]>([])

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

    const activeQuickPrompts = dynamicQuickPrompts.length > 0
        ? dynamicQuickPrompts.map(p => ({
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || isLoading) return

        setLoading(true)
        setShowReflection(false)

        try {
            let response;
            if (mode === 'assist') {
                // Use specialized classroom help endpoint for assist mode
                const result = await teacherSupportApi.getClassroomHelp({
                    challenge: inputText,
                    grade,
                    subject,
                    topic,
                    students_level: studentsLevel
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
                    topic
                })
            }
            setResponse(response)
            setInputText('')
        } catch (err) {
            setError('Failed to get response. Please try again.')
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
                                {activeQuickPrompts.map((prompt: any, index: number) => (
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
                                    <AIResponse response={currentResponse!} mode={mode} />
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
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'assist' ? "Describe the classroom challenge..." : "Explain Newton's laws..."}
                                className="w-full min-h-[60px] max-h-[150px] p-4 pr-32 text-gray-800 dark:text-white bg-transparent border-0 resize-none focus:outline-none custom-scrollbar"
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e as any);
                                    }
                                }}
                            />
                            <div className="absolute right-2 bottom-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowVoiceAssistant(true)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputText.trim()}
                                    className="flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                    style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
        </div>
    )
}
