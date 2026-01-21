import { useState, useEffect, useCallback } from 'react'
import {
    X,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Maximize2,
    Minimize2,
    Eye,
    EyeOff
} from 'lucide-react'

interface TeachNowModeProps {
    topic: string
    structured: any
    grade?: number
    onClose: () => void
}

interface Slide {
    title: string
    content: string
    type: 'intro' | 'concept' | 'example' | 'question' | 'activity'
    notes?: string
}

export default function TeachNowMode({ topic, structured, grade, onClose }: TeachNowModeProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const autoAdvanceTime = 15 // seconds

    // Generate slides from structured content
    const generateSlides = (): Slide[] => {
        const slides: Slide[] = []

        // Extract a cleaner topic name from complex queries
        const cleanTopic = (() => {
            // Remove common prefixes like "Create 5 MCQs for:", "Explain...", etc.
            let cleaned = topic
                .replace(/^(Create \d+ (multiple choice questions|MCQs|questions).*?(for|about|on):?\s*)/i, '')
                .replace(/^(Explain|Describe|Define|What is|Give|Convert|Make)\s+/i, '')
                .replace(/\.\s*Format.*$/i, '') // Remove trailing format instructions
                .replace(/\s+with.*options.*$/i, '')
                .trim()

            // If still too long (> 60 chars), truncate nicely
            if (cleaned.length > 60) {
                cleaned = cleaned.substring(0, 57) + '...'
            }

            // Capitalize first letter
            return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        })()

        // Intro slide
        slides.push({
            title: cleanTopic || 'Teaching Guide',
            content: grade ? `Class ${grade}` : '',
            type: 'intro',
            notes: 'Begin by capturing attention. Ask: "Has anyone heard about this before?"'
        })

        // === EXPLAIN MODE FIELDS ===

        // Conceptual Briefing
        if (structured?.conceptual_briefing) {
            slides.push({
                title: '📖 The Big Picture',
                content: structured.conceptual_briefing,
                type: 'concept',
                notes: 'This is for YOUR understanding. Internalize it before explaining to students.'
            })
        }

        // Simple Explanation
        if (structured?.simple_explanation) {
            slides.push({
                title: '💡 Simple Explanation',
                content: structured.simple_explanation,
                type: 'concept',
                notes: 'Use simple language. Pause after each point to check understanding.'
            })
        }

        // What to Say
        if (structured?.what_to_say) {
            slides.push({
                title: '🗣️ Teacher Script',
                content: structured.what_to_say,
                type: 'concept',
                notes: 'Read this naturally. Make eye contact with students.'
            })
        }

        // Mnemonics & Hooks (shared between explain and assist)
        if (structured?.mnemonics_hooks) {
            const hooks = Array.isArray(structured.mnemonics_hooks)
                ? structured.mnemonics_hooks.map((h: any) => typeof h === 'object' ? h.content : h).join('\n\n')
                : String(structured.mnemonics_hooks)
            slides.push({
                title: '🔗 Memory Hooks',
                content: hooks,
                type: 'activity',
                notes: 'Make this interactive! Have students repeat after you.'
            })
        }

        // Examples - one slide each
        if (structured?.specific_examples && Array.isArray(structured.specific_examples)) {
            structured.specific_examples.slice(0, 3).forEach((ex: any, i: number) => {
                slides.push({
                    title: `🌳 Example ${i + 1}`,
                    content: typeof ex === 'object' ? ex.description || ex.title : ex,
                    type: 'example',
                    notes: 'Connect this to students\' daily life experiences.'
                })
            })
        }

        // Visual Aid
        if (structured?.visual_aid_idea) {
            const aid = typeof structured.visual_aid_idea === 'object'
                ? structured.visual_aid_idea.description || structured.visual_aid_idea.title
                : structured.visual_aid_idea
            slides.push({
                title: '🎨 Visual Aid',
                content: aid,
                type: 'activity',
                notes: 'Draw this on the board step by step. Have students copy.'
            })
        }

        // Check for Understanding
        if (structured?.check_for_understanding && Array.isArray(structured.check_for_understanding)) {
            structured.check_for_understanding.forEach((q: any, i: number) => {
                slides.push({
                    title: `❓ Question ${i + 1}`,
                    content: typeof q === 'object' ? q.question : q,
                    type: 'question',
                    notes: 'Wait 5-10 seconds for hands to rise. Encourage wrong answers positively.'
                })
            })
        }

        // Oral Questions
        if (structured?.oral_questions && Array.isArray(structured.oral_questions)) {
            const questions = structured.oral_questions.map((q: any) => typeof q === 'object' ? q.question || q.text : String(q))
            slides.push({
                title: '💬 Discussion Questions',
                content: questions.join('\n\n'),
                type: 'question',
                notes: 'Ask these to spark classroom discussion.'
            })
        }

        // Misconceptions
        if (structured?.common_misconceptions) {
            const misconceptions = Array.isArray(structured.common_misconceptions)
                ? structured.common_misconceptions.map((m: any) => typeof m === 'object' ? m.misconception : String(m)).join('\n\n')
                : String(structured.common_misconceptions)
            slides.push({
                title: '⚠️ Common Misconceptions',
                content: misconceptions,
                type: 'concept',
                notes: 'Address these proactively. Students often make these mistakes.'
            })
        }

        // === ASSIST MODE (Classroom Help) FIELDS ===

        if (structured?.understanding) {
            slides.push({
                title: '🤝 Understanding Your Challenge',
                content: structured.understanding,
                type: 'concept',
                notes: 'This acknowledges the challenge you\'re facing.'
            })
        }

        if (structured?.immediate_action) {
            slides.push({
                title: '⚡ Do This NOW',
                content: structured.immediate_action,
                type: 'activity',
                notes: 'Start with this immediately to get students\' attention.'
            })
        }

        if (structured?.quick_activity) {
            slides.push({
                title: '🏸 Quick Activity',
                content: structured.quick_activity,
                type: 'activity',
                notes: 'This is a quick engaging activity. Get everyone involved!'
            })
        }

        if (structured?.bridge_the_gap) {
            slides.push({
                title: '🌉 Bridge to Lesson',
                content: structured.bridge_the_gap,
                type: 'concept',
                notes: 'Use this to connect the activity to your main lesson.'
            })
        }

        if (structured?.check_progress) {
            slides.push({
                title: '📈 Check Progress',
                content: structured.check_progress,
                type: 'question',
                notes: 'Quick check to see if students are following.'
            })
        }

        if (structured?.for_later) {
            slides.push({
                title: '🛡️ For Tomorrow',
                content: structured.for_later,
                type: 'concept',
                notes: 'Prepare this for the next class.'
            })
        }

        // === PLAN MODE (Lesson Plan) FIELDS ===

        if (structured?.learning_objectives && Array.isArray(structured.learning_objectives)) {
            slides.push({
                title: '🎯 Learning Objectives',
                content: structured.learning_objectives.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n\n'),
                type: 'concept',
                notes: 'Share these objectives with students at the start of class.'
            })
        }

        if (structured?.duration_minutes) {
            slides.push({
                title: '⏱️ Lesson Duration',
                content: `This lesson is designed for ${structured.duration_minutes} minutes.`,
                type: 'intro',
                notes: 'Plan your timing accordingly. Adjust activities if running short on time.'
            })
        }

        if (structured?.activities && Array.isArray(structured.activities)) {
            structured.activities.forEach((activity: any, i: number) => {
                const activityName = activity.activity_name || activity.name || `Activity ${i + 1}`
                const duration = activity.duration_minutes ? `(${activity.duration_minutes} min)` : ''
                const materials = activity.materials_needed?.length ? `\n\nMaterials: ${activity.materials_needed.join(', ')}` : ''
                slides.push({
                    title: `📝 ${activityName} ${duration}`,
                    content: `${activity.description || ''}${materials}`,
                    type: 'activity',
                    notes: `Activity ${i + 1} of ${structured.activities.length}. Keep students engaged!`
                })
            })
        }

        if (structured?.multi_grade_adaptations) {
            slides.push({
                title: '🏫 Multigrade Adaptations',
                content: structured.multi_grade_adaptations,
                type: 'concept',
                notes: 'Adapt the lesson based on your class composition.'
            })
        }

        if (structured?.low_tlm_alternatives) {
            slides.push({
                title: '📦 Low-TLM Alternatives',
                content: structured.low_tlm_alternatives,
                type: 'activity',
                notes: 'Use these if you don\'t have the standard materials.'
            })
        }

        if (structured?.exit_questions && Array.isArray(structured.exit_questions)) {
            structured.exit_questions.forEach((q: string, i: number) => {
                slides.push({
                    title: `✅ Exit Question ${i + 1}`,
                    content: q,
                    type: 'question',
                    notes: 'Use this to check understanding before students leave.'
                })
            })
        }

        // End slide
        slides.push({
            title: '✅ Lesson Complete!',
            content: 'Great job teaching today!',
            type: 'intro',
            notes: 'Summarize key points. Give a quick exit ticket question.'
        })

        return slides
    }

    const slides = generateSlides()

    // Auto-advance functionality
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>
        if (isPlaying && currentSlide < slides.length - 1) {
            interval = setInterval(() => {
                setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))
            }, autoAdvanceTime * 1000)
        }
        return () => clearInterval(interval)
    }, [isPlaying, currentSlide, autoAdvanceTime, slides.length])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))
        } else if (e.key === 'ArrowLeft') {
            setCurrentSlide(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Escape') {
            onClose()
        } else if (e.key === 'n') {
            setShowNotes(prev => !prev)
        }
    }, [slides.length, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Toggle fullscreen
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullScreen(true)
        } else {
            document.exitFullscreen()
            setIsFullScreen(false)
        }
    }

    const currentSlideData = slides[currentSlide]
    const progress = ((currentSlide + 1) / slides.length) * 100

    // Slide type colors
    const typeColors: Record<string, string> = {
        intro: 'from-blue-600 to-indigo-700',
        concept: 'from-emerald-500 to-teal-600',
        example: 'from-amber-500 to-orange-600',
        question: 'from-purple-500 to-violet-600',
        activity: 'from-pink-500 to-rose-600'
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-800">
                <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex items-center justify-center p-8 md:p-12 bg-gradient-to-br ${typeColors[currentSlideData.type]} overflow-hidden`}>
                <div className="max-w-5xl w-full text-center text-white flex flex-col items-center">
                    {/* Title with improved typography */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-10 leading-tight tracking-tight"
                        style={{
                            textShadow: '0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.1)',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        {currentSlideData.title}
                    </h1>

                    {/* Content with scrolling for long text */}
                    <div
                        className="text-xl sm:text-2xl md:text-3xl leading-relaxed max-h-[50vh] overflow-y-auto px-4 scrollbar-hide"
                        style={{
                            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            WebkitFontSmoothing: 'antialiased',
                            wordSpacing: '0.05em',
                            lineHeight: '1.7'
                        }}
                    >
                        <div className="whitespace-pre-wrap text-left md:text-center opacity-95">
                            {currentSlideData.content}
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher Notes Panel (Hidden from projection) */}
            {showNotes && currentSlideData.notes && (
                <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 p-4 rounded-xl shadow-2xl">
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                        <Eye className="w-4 h-4" />
                        Teacher Notes (only you see this)
                    </div>
                    <p className="text-sm">{currentSlideData.notes}</p>
                </div>
            )}

            {/* Controls */}
            <div className="bg-black/80 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Exit (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <span className="text-white/70 text-sm">
                            {currentSlide + 1} / {slides.length}
                        </span>
                    </div>

                    {/* Center Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                            disabled={currentSlide === 0}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsPlaying(prev => !prev)}
                            className={`p-4 rounded-xl text-white transition-colors ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))}
                            disabled={currentSlide === slides.length - 1}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNotes(prev => !prev)}
                            className={`p-2 rounded-xl transition-colors ${showNotes ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            title="Toggle Notes (N)"
                        >
                            {showNotes ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Fullscreen"
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Keyboard hint */}
                <div className="text-center text-white/40 text-xs mt-2">
                    Use ← → arrows to navigate • Space to advance • N for notes • Esc to exit
                </div>
            </div>
        </div>
    )
}
