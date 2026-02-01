import { useState } from 'react'
import {
    BookOpen,
    Lightbulb,
    Link2,
    MessageSquare,
    TreePine,
    Globe,
    Palette,
    HelpCircle,
    ChevronDown,
    Wrench,
    ListChecks,
    Sparkles,
    Loader2,
    ChevronRight,
    Calculator,
    CheckCircle2,
    AlertTriangle,
    Heart,
    Zap,
    Activity,
    ArrowRightCircle,
    BarChart2,
    CalendarClock,
    Target,
    Clock,
    PlayCircle,
    Users,
    Package,
    ClipboardCheck
} from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { aiApi } from '../../services/api'

// Helper function to safely convert any data type to string for MarkdownRenderer
function toSafeString(data: any): string {
    if (!data) return ''
    if (typeof data === 'string') return data
    if (Array.isArray(data)) {
        // Join array items as numbered list or bullet points
        return data.map((item, idx) => {
            if (typeof item === 'string') return `${idx + 1}. ${item}`
            if (typeof item === 'object') return `${idx + 1}. ${item.content || item.text || JSON.stringify(item)}`
            return `${idx + 1}. ${String(item)}`
        }).join('\n\n')
    }
    if (typeof data === 'object') {
        return Object.entries(data)
            .map(([key, val]) => `**${key}**: ${val}`)
            .join('\n\n')
    }
    return String(data)
}

interface Example {
    title: string
    description?: string
    problem?: string
    explanation?: string
}

interface VisualAidIdea {
    title?: string
    name?: string
    materials?: string
    description?: string
    instructions?: string
    usage?: string
}

interface CheckQuestion {
    level: number | string
    type?: string
    question: string
}

// Math Solution types
interface SolutionStep {
    step_number: number
    action: string
    working: string
    result: string
    explanation?: string
}

interface Activity {
    activity_name: string
    duration_minutes: number
    description: string
    materials_needed?: string[]
}

interface StructuredContent {
    // Regular explain response fields
    conceptual_briefing?: string
    simple_explanation?: string
    mnemonics_hooks?: (string | { type: string; content: string })[] | string
    what_to_say?: string
    specific_examples?: Example[]
    generic_examples?: Example[]
    visual_aid_idea?: VisualAidIdea
    check_for_understanding?: CheckQuestion[]
    // New Phase 6 fields
    common_misconceptions?: string | string[]
    oral_questions?: string | string[]
    // Math solution fields
    problem_statement?: string
    problem_type?: string
    given_information?: string
    solution_steps?: SolutionStep[]
    final_answer?: string
    verification?: string
    concept_explanation?: string
    common_mistakes?: string
    similar_practice?: string
    // Assist mode (Classroom Help) fields
    understanding?: string
    immediate_action?: string
    quick_activity?: string
    bridge_the_gap?: string
    check_progress?: string
    for_later?: string
    // Plan mode (Lesson Plan) fields
    learning_objectives?: string[]
    duration_minutes?: number
    activities?: Activity[]
    multi_grade_adaptations?: string
    low_tlm_alternatives?: string
    exit_questions?: string[]
}

interface StructuredAIResponseProps {
    content: string
    structured?: StructuredContent
    topic?: string
    grade?: number
    language?: string
}

// Section configuration with icons and colors
const sectionConfig = {
    conceptual_briefing: {
        icon: BookOpen,
        title: 'Conceptual Briefing',
        emoji: '📖',
        bgGradient: 'from-blue-50 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/30',
        iconBg: 'bg-blue-500',
        borderColor: 'border-blue-200 dark:border-blue-700'
    },
    simple_explanation: {
        icon: Lightbulb,
        title: 'Simple Explanation',
        emoji: '💡',
        bgGradient: 'from-amber-50 to-yellow-100/80 dark:from-amber-900/40 dark:to-yellow-800/30',
        iconBg: 'bg-amber-500',
        borderColor: 'border-amber-200 dark:border-amber-700'
    },
    mnemonics_hooks: {
        icon: Link2,
        title: 'Mnemonics & Hooks',
        emoji: '🔗',
        bgGradient: 'from-purple-50 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/30',
        iconBg: 'bg-purple-500',
        borderColor: 'border-purple-200 dark:border-purple-700'
    },
    what_to_say: {
        icon: MessageSquare,
        title: 'What to Say',
        emoji: '🗣️',
        bgGradient: 'from-green-50 to-green-100/80 dark:from-green-900/40 dark:to-green-800/30',
        iconBg: 'bg-green-500',
        borderColor: 'border-green-200 dark:border-green-700'
    },
    specific_examples: {
        icon: TreePine,
        title: 'Contextual Examples',
        emoji: '🌳',
        bgGradient: 'from-emerald-50 to-emerald-100/80 dark:from-emerald-900/40 dark:to-emerald-800/30',
        iconBg: 'bg-emerald-500',
        borderColor: 'border-emerald-200 dark:border-emerald-700'
    },
    generic_examples: {
        icon: Globe,
        title: 'Generic Examples',
        emoji: '🌐',
        bgGradient: 'from-cyan-50 to-cyan-100/80 dark:from-cyan-900/40 dark:to-cyan-800/30',
        iconBg: 'bg-cyan-500',
        borderColor: 'border-cyan-200 dark:border-cyan-700'
    },
    visual_aid_idea: {
        icon: Palette,
        title: 'Visual Aid / TLM Idea',
        emoji: '🎨',
        bgGradient: 'from-pink-50 to-pink-100/80 dark:from-pink-900/40 dark:to-pink-800/30',
        iconBg: 'bg-pink-500',
        borderColor: 'border-pink-200 dark:border-pink-700'
    },
    check_for_understanding: {
        icon: HelpCircle,
        title: 'Check for Understanding',
        emoji: '❓',
        bgGradient: 'from-indigo-50 to-indigo-100/80 dark:from-indigo-900/40 dark:to-indigo-800/30',
        iconBg: 'bg-indigo-500',
        borderColor: 'border-indigo-200 dark:border-indigo-700'
    },
    // Math solution sections
    problem_statement: {
        icon: Calculator,
        title: 'Problem Statement',
        emoji: '📋',
        bgGradient: 'from-slate-50 to-slate-100/80 dark:from-slate-900/40 dark:to-slate-800/30',
        iconBg: 'bg-slate-600',
        borderColor: 'border-slate-200 dark:border-slate-700'
    },
    solution_steps: {
        icon: ListChecks,
        title: 'Step-by-Step Solution',
        emoji: '📊',
        bgGradient: 'from-blue-50 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/30',
        iconBg: 'bg-blue-600',
        borderColor: 'border-blue-200 dark:border-blue-700'
    },
    final_answer: {
        icon: CheckCircle2,
        title: 'Final Answer',
        emoji: '✅',
        bgGradient: 'from-green-50 to-green-100/80 dark:from-green-900/40 dark:to-green-800/30',
        iconBg: 'bg-green-600',
        borderColor: 'border-green-200 dark:border-green-700'
    },
    verification: {
        icon: CheckCircle2,
        title: 'Verification',
        emoji: '🔍',
        bgGradient: 'from-teal-50 to-teal-100/80 dark:from-teal-900/40 dark:to-teal-800/30',
        iconBg: 'bg-teal-600',
        borderColor: 'border-teal-200 dark:border-teal-700'
    },
    concept_explanation: {
        icon: Lightbulb,
        title: 'Concept Explanation',
        emoji: '💡',
        bgGradient: 'from-amber-50 to-amber-100/80 dark:from-amber-900/40 dark:to-amber-800/30',
        iconBg: 'bg-amber-500',
        borderColor: 'border-amber-200 dark:border-amber-700'
    },
    common_mistakes: {
        icon: AlertTriangle,
        title: 'Common Mistakes to Avoid',
        emoji: '⚠️',
        bgGradient: 'from-orange-50 to-orange-100/80 dark:from-orange-900/40 dark:to-orange-800/30',
        iconBg: 'bg-orange-500',
        borderColor: 'border-orange-200 dark:border-orange-700'
    },
    similar_practice: {
        icon: HelpCircle,
        title: 'Practice Problem',
        emoji: '✏️',
        bgGradient: 'from-purple-50 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/30',
        iconBg: 'bg-purple-500',
        borderColor: 'border-purple-200 dark:border-purple-700'
    },
    common_misconceptions: {
        icon: AlertTriangle,
        title: 'Common Misconceptions',
        emoji: '⚠️',
        bgGradient: 'from-red-50 to-red-100/80 dark:from-red-900/40 dark:to-red-800/30',
        iconBg: 'bg-red-500',
        borderColor: 'border-red-200 dark:border-red-700'
    },
    oral_questions: {
        icon: MessageSquare,
        title: 'Ask Students These',
        emoji: '💬',
        bgGradient: 'from-blue-50 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/30',
        iconBg: 'bg-blue-500',
        borderColor: 'border-blue-200 dark:border-blue-700'
    },
    // Assist mode (Classroom Help) section configs
    understanding: {
        icon: Heart,
        title: 'Understanding Your Challenge',
        emoji: '🤝',
        bgGradient: 'from-pink-50 to-pink-100/80 dark:from-pink-900/40 dark:to-pink-800/30',
        iconBg: 'bg-pink-500',
        borderColor: 'border-pink-200 dark:border-pink-700'
    },
    immediate_action: {
        icon: Zap,
        title: 'Do This NOW',
        emoji: '⚡',
        bgGradient: 'from-yellow-50 to-yellow-100/80 dark:from-yellow-900/40 dark:to-yellow-800/30',
        iconBg: 'bg-yellow-500',
        borderColor: 'border-yellow-200 dark:border-yellow-700'
    },
    quick_activity: {
        icon: Activity,
        title: 'Quick Activity',
        emoji: '🏸',
        bgGradient: 'from-green-50 to-green-100/80 dark:from-green-900/40 dark:to-green-800/30',
        iconBg: 'bg-green-500',
        borderColor: 'border-green-200 dark:border-green-700'
    },
    bridge_the_gap: {
        icon: ArrowRightCircle,
        title: 'Bridge to Lesson',
        emoji: '🌉',
        bgGradient: 'from-indigo-50 to-indigo-100/80 dark:from-indigo-900/40 dark:to-indigo-800/30',
        iconBg: 'bg-indigo-500',
        borderColor: 'border-indigo-200 dark:border-indigo-700'
    },
    check_progress: {
        icon: BarChart2,
        title: 'Check Progress',
        emoji: '📈',
        bgGradient: 'from-cyan-50 to-cyan-100/80 dark:from-cyan-900/40 dark:to-cyan-800/30',
        iconBg: 'bg-cyan-500',
        borderColor: 'border-cyan-200 dark:border-cyan-700'
    },
    for_later: {
        icon: CalendarClock,
        title: 'For Tomorrow',
        emoji: '🛡️',
        bgGradient: 'from-violet-50 to-violet-100/80 dark:from-violet-900/40 dark:to-violet-800/30',
        iconBg: 'bg-violet-500',
        borderColor: 'border-violet-200 dark:border-violet-700'
    },
    // Plan mode (Lesson Plan) section configs
    learning_objectives: {
        icon: Target,
        title: 'Learning Objectives',
        emoji: '🎯',
        bgGradient: 'from-blue-50 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/30',
        iconBg: 'bg-blue-600',
        borderColor: 'border-blue-200 dark:border-blue-700'
    },
    duration_minutes: {
        icon: Clock,
        title: 'Duration',
        emoji: '⏱️',
        bgGradient: 'from-gray-50 to-gray-100/80 dark:from-gray-900/40 dark:to-gray-800/30',
        iconBg: 'bg-gray-600',
        borderColor: 'border-gray-200 dark:border-gray-700'
    },
    activities: {
        icon: PlayCircle,
        title: 'Activities',
        emoji: '📝',
        bgGradient: 'from-green-50 to-green-100/80 dark:from-green-900/40 dark:to-green-800/30',
        iconBg: 'bg-green-600',
        borderColor: 'border-green-200 dark:border-green-700'
    },
    multi_grade_adaptations: {
        icon: Users,
        title: 'Multigrade Adaptations',
        emoji: '🏫',
        bgGradient: 'from-purple-50 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/30',
        iconBg: 'bg-purple-600',
        borderColor: 'border-purple-200 dark:border-purple-700'
    },
    low_tlm_alternatives: {
        icon: Package,
        title: 'Low-TLM Alternatives',
        emoji: '📦',
        bgGradient: 'from-orange-50 to-orange-100/80 dark:from-orange-900/40 dark:to-orange-800/30',
        iconBg: 'bg-orange-600',
        borderColor: 'border-orange-200 dark:border-orange-700'
    },
    exit_questions: {
        icon: ClipboardCheck,
        title: 'Exit Questions',
        emoji: '✅',
        bgGradient: 'from-teal-50 to-teal-100/80 dark:from-teal-900/40 dark:to-teal-800/30',
        iconBg: 'bg-teal-600',
        borderColor: 'border-teal-200 dark:border-teal-700'
    }
}

// Collapsible Section Card Component
interface SectionCardProps {
    sectionKey: keyof typeof sectionConfig
    children: React.ReactNode
    defaultExpanded?: boolean
}

function SectionCard({ sectionKey, children, defaultExpanded = true }: SectionCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const config = sectionConfig[sectionKey]
    const Icon = config.icon

    return (
        <div className={`rounded-xl border overflow-hidden shadow-sm transition-all duration-200 ${config.borderColor}`}>
            {/* Header - compact */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${config.bgGradient} transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.iconBg} text-white shadow`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {config.title}
                    </h3>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 py-4 bg-white dark:bg-gray-800/50">
                    {children}
                </div>
            )}
        </div>
    )
}

// Render mnemonics and hooks - handles both string[] and object[] formats
function MnemonicsHooksContent({ items }: { items: (string | { type: string; content: string })[] }) {
    // Safety check - ensure items is an array
    const safeItems = Array.isArray(items) ? items : []

    if (safeItems.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 text-sm">No mnemonics or hooks available.</p>
    }

    return (
        <div className="space-y-3">
            {safeItems.map((item, idx) => {
                // Handle string format
                if (typeof item === 'string') {
                    return (
                        <div
                            key={idx}
                            className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500"
                        >
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {item}
                            </p>
                        </div>
                    )
                }
                // Handle object format
                return (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${item.type === 'Mnemonic'
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                            }`}
                    >
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${item.type === 'Mnemonic'
                            ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200'
                            : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                            }`}>
                            {item.type}
                        </span>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item.content}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}

// Parse string example format like "**Title:** Description" into title and description
function parseStringExample(str: string): { title: string; description: string } {
    // Try to match **Title:** pattern
    const boldTitleMatch = str.match(/^\*\*([^*]+)\*\*[:\s]*(.*)$/s)
    if (boldTitleMatch) {
        return {
            title: boldTitleMatch[1].trim(),
            description: boldTitleMatch[2].trim()
        }
    }
    
    // Try to match "Title: Description" pattern
    const colonMatch = str.match(/^([^:]+):\s*(.+)$/s)
    if (colonMatch && colonMatch[1].length < 100) {
        return {
            title: colonMatch[1].trim(),
            description: colonMatch[2].trim()
        }
    }
    
    // Fallback - use first sentence as title or generic title
    const firstSentence = str.split(/[.!?]/)[0]
    if (firstSentence && firstSentence.length < 80) {
        return {
            title: firstSentence.trim(),
            description: str.substring(firstSentence.length + 1).trim() || str
        }
    }
    
    return {
        title: `Example`,
        description: str
    }
}

// Render examples - handles string[], Example[], and mixed formats
function ExamplesContent({ items, color = 'emerald' }: { items: (string | Example)[], color?: string }) {
    const colorClasses = {
        emerald: 'bg-emerald-500',
        cyan: 'bg-cyan-500'
    }

    // Safety check - ensure items is an array
    const safeItems = Array.isArray(items) ? items : []

    if (safeItems.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 text-sm">No examples available.</p>
    }

    return (
        <div className="space-y-3">
            {safeItems.map((item, idx) => {
                // Normalize item to Example format
                let example: Example
                if (typeof item === 'string') {
                    example = parseStringExample(item)
                } else if (item && typeof item === 'object') {
                    example = item as Example
                } else {
                    example = { title: `Example ${idx + 1}`, description: String(item) }
                }

                return (
                    <div
                        key={idx}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                    >
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald} text-white flex items-center justify-center text-xs font-bold`}>
                                {idx + 1}
                            </span>
                            {example.title || `Example ${idx + 1}`}
                        </h4>
                        {/* Handle description format */}
                        {example.description && (
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownRenderer content={example.description} />
                            </div>
                        )}
                        {/* Handle problem/explanation format */}
                        {example.problem && (
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-semibold uppercase text-gray-500">Problem</span>
                                    <p className="text-gray-700 dark:text-gray-300">{example.problem}</p>
                                </div>
                                {example.explanation && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <span className="text-xs font-semibold uppercase text-green-600">Solution</span>
                                        <p className="text-gray-700 dark:text-gray-300">{example.explanation}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// Parse numbered instructions from a string
function parseInstructions(text: string): string[] {
    if (!text) return []

    // Match patterns like "1. ", "1) ", "Step 1: ", etc.
    const lines = text.split(/(?=(?:\d+[.)]\s)|(?:Step\s*\d+[:.]\s))/gi)
    const instructions = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)

    // If no numbered pattern found, try splitting by periods followed by numbers
    if (instructions.length <= 1) {
        const altLines = text.split(/\.\s*(?=\d+\.)/)
        if (altLines.length > 1) {
            return altLines.map(l => l.trim()).filter(l => l.length > 0)
        }
    }

    return instructions.length > 1 ? instructions : [text]
}

// Render visual aid idea - handles multiple field name formats
function VisualAidContent({ item }: { item: VisualAidIdea }) {
    const title = item.title || item.name || 'Visual Aid'
    const description = item.description || item.instructions || ''
    const usage = item.usage || ''

    // Parse instructions into numbered list
    const instructionsList = parseInstructions(description)

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-pink-500" />
                {title}
            </h4>

            {/* Only show Materials Needed if materials data exists */}
            {item.materials && (
                <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700">
                    <h5 className="font-medium text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-1 text-sm">
                        <ListChecks className="w-4 h-4" /> Materials Needed
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{item.materials}</p>
                </div>
            )}

            {instructionsList.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2 text-sm">📝 Instructions</h5>
                    <ol className="space-y-2">
                        {instructionsList.map((instruction, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={instruction.replace(/^\d+[.)]\s*/, '')} />
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {usage && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <h5 className="font-medium text-green-700 dark:text-green-300 mb-1 text-sm">🎯 How to Use</h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{usage}</p>
                </div>
            )}
        </div>
    )
}

// Single question card with Get Answer button
function QuestionCard({
    item,
    index,
    topic,
    grade,
    language
}: {
    item: CheckQuestion
    index: number
    topic?: string
    grade?: number
    language?: string
}) {
    const [answer, setAnswer] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)

    const getLevelLabel = (level: number | string, type?: string) => {
        if (type) return type
        if (typeof level === 'number') {
            const labels = ['Basic Recall', 'Application', 'Critical Thinking']
            return labels[level - 1] || `Level ${level}`
        }
        return String(level)
    }

    const handleGetAnswer = async () => {
        if (answer) {
            setShowAnswer(!showAnswer)
            return
        }

        setLoading(true)
        try {
            const result = await aiApi.getQuestionAnswer({
                question: item.question,
                topic,
                grade,
                language
            })
            setAnswer(result.answer)
            setShowAnswer(true)
        } catch (error) {
            console.error('Failed to get answer:', error)
            setAnswer('Failed to load answer. Please try again.')
            setShowAnswer(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    Q{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                        {getLevelLabel(item.level, item.type)}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{item.question}</p>

                    {/* Get Answer Button */}
                    <button
                        onClick={handleGetAnswer}
                        disabled={loading}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Getting Answer...
                            </>
                        ) : answer ? (
                            <>
                                <ChevronRight className={`w-4 h-4 transition-transform ${showAnswer ? 'rotate-90' : ''}`} />
                                {showAnswer ? 'Hide Answer' : 'Show Answer'}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Get Answer
                            </>
                        )}
                    </button>

                    {/* Answer Display */}
                    {showAnswer && answer && (
                        <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">AI Answer</span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                <MarkdownRenderer content={answer} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Parse string question format and extract level/type if present
function parseStringQuestion(str: string, index: number): CheckQuestion {
    // Try to match patterns like "[Basic]", "(Application)", "Level 1:", etc.
    const levelPatterns = [
        /^\[([^\]]+)\]\s*(.*)$/s,
        /^\(([^)]+)\)\s*(.*)$/s,
        /^(Basic|Application|Critical Thinking|Level \d+)[:\s]+(.*)$/i,
        /^\*\*([^*]+)\*\*[:\s]*(.*)$/s
    ]
    
    for (const pattern of levelPatterns) {
        const match = str.match(pattern)
        if (match) {
            return {
                level: match[1].trim(),
                question: match[2].trim() || str
            }
        }
    }
    
    // Default - assign levels based on index (1=Basic, 2=Application, 3=Critical Thinking)
    const defaultLevels = ['Basic Recall', 'Application', 'Critical Thinking']
    return {
        level: defaultLevels[index % 3] || 'Question',
        question: str
    }
}

// Render check for understanding questions - handles string[], CheckQuestion[], and mixed formats
function CheckUnderstandingContent({ items, topic, grade, language }: { items: (string | CheckQuestion)[], topic?: string, grade?: number, language?: string }) {
    // Safety check - ensure items is an array
    const safeItems = Array.isArray(items) ? items : []

    if (safeItems.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 text-sm">No questions available.</p>
    }

    // Normalize items to CheckQuestion format
    const normalizedItems: CheckQuestion[] = safeItems.map((item, idx) => {
        if (typeof item === 'string') {
            return parseStringQuestion(item, idx)
        } else if (item && typeof item === 'object') {
            // Ensure question property exists
            return {
                level: item.level || 'Question',
                question: item.question || String(item),
                type: item.type
            }
        } else {
            return {
                level: 'Question',
                question: String(item)
            }
        }
    })

    return (
        <div className="space-y-3">
            {normalizedItems.map((item, idx) => (
                <QuestionCard
                    key={idx}
                    item={item}
                    index={idx}
                    topic={topic}
                    grade={grade}
                    language={language}
                />
            ))}
        </div>
    )
}

// Render step-by-step math solution
function MathSolutionStepsContent({ steps }: { steps: SolutionStep[] }) {
    return (
        <div className="space-y-4">
            {steps.map((step, idx) => (
                <div
                    key={idx}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-900/20 border border-blue-200 dark:border-blue-700"
                >
                    <div className="flex items-start gap-4">
                        {/* Step number badge */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                            {step.step_number || idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Action/What we're doing */}
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                {step.action}
                            </h4>

                            {/* Mathematical working */}
                            <div className="font-mono text-lg bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-2 overflow-x-auto">
                                <code className="text-gray-800 dark:text-gray-200">{step.working}</code>
                            </div>

                            {/* Result */}
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                                <span className="text-sm uppercase tracking-wide opacity-70">Result:</span>
                                <span className="font-mono text-lg">{step.result}</span>
                            </div>

                            {/* Explanation if available */}
                            {step.explanation && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                    💡 {step.explanation}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function StructuredAIResponse({ content, structured, topic, grade, language }: StructuredAIResponseProps) {
    // If no structured data, fall back to markdown rendering
    if (!structured) {
        return <MarkdownRenderer content={content} />
    }

    // Detect if this is a math solution (has solution_steps or final_answer)
    const isMathSolution = structured.solution_steps || structured.final_answer || structured.problem_statement

    // Detect if this is an assist mode response (Classroom Help)
    const isAssistMode = structured.understanding || structured.immediate_action || structured.quick_activity

    // Detect if this is a plan mode response (Lesson Plan)
    const isPlanMode = structured.learning_objectives || structured.activities || structured.exit_questions

    // Order of sections to display - different for math, assist, plan, and regular explain modes
    const sectionOrder: (keyof StructuredContent)[] = isMathSolution
        ? [
            'problem_statement',
            'solution_steps',
            'final_answer',
            'verification',
            'concept_explanation',
            'common_mistakes',
            'similar_practice'
        ]
        : isAssistMode
            ? [
                'understanding',
                'immediate_action',
                'mnemonics_hooks',
                'quick_activity',
                'bridge_the_gap',
                'check_progress',
                'for_later'
            ]
            : isPlanMode
                ? [
                    'learning_objectives',
                    'duration_minutes',
                    'activities',
                    'multi_grade_adaptations',
                    'low_tlm_alternatives',
                    'exit_questions'
                ]
                : [
                    'conceptual_briefing',
                    'simple_explanation',
                    'mnemonics_hooks',
                    'what_to_say',
                    'specific_examples',
                    'generic_examples',
                    'visual_aid_idea',
                    'check_for_understanding',
                    'common_misconceptions',
                    'oral_questions'
                ]

    return (
        <div className="space-y-3">
            {/* Show problem type badge for math solutions */}
            {isMathSolution && structured.problem_type && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
                        📊 {structured.problem_type}
                    </span>
                    {structured.given_information && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Given: {structured.given_information}
                        </span>
                    )}
                </div>
            )}

            {sectionOrder.map((key) => {
                const data = structured[key]
                if (!data) return null

                // Skip empty arrays
                if (Array.isArray(data) && data.length === 0) return null

                switch (key) {
                    // Regular explain sections
                    case 'conceptual_briefing':
                    case 'simple_explanation':
                    case 'what_to_say':
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={key === 'conceptual_briefing' || key === 'simple_explanation'}>
                                <MarkdownRenderer content={data as string} />
                            </SectionCard>
                        )

                    case 'mnemonics_hooks':
                        // Handle both array (explain mode) and string (assist mode) formats
                        if (typeof data === 'string') {
                            return (
                                <SectionCard key={key} sectionKey={key} defaultExpanded={true}>
                                    <MarkdownRenderer content={data} />
                                </SectionCard>
                            )
                        }
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={true}>
                                <MnemonicsHooksContent items={data as any[]} />
                            </SectionCard>
                        )

                    case 'specific_examples':
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={false}>
                                <ExamplesContent items={data as Example[]} color="emerald" />
                            </SectionCard>
                        )

                    case 'generic_examples':
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={false}>
                                <ExamplesContent items={data as Example[]} color="cyan" />
                            </SectionCard>
                        )

                    case 'visual_aid_idea':
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={false}>
                                <VisualAidContent item={data as VisualAidIdea} />
                            </SectionCard>
                        )

                    case 'check_for_understanding':
                        return (
                            <SectionCard key={key} sectionKey={key} defaultExpanded={false}>
                                <CheckUnderstandingContent items={data as CheckQuestion[]} topic={topic} grade={grade} language={language} />
                            </SectionCard>
                        )

                    // Math solution sections
                    case 'problem_statement':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <MarkdownRenderer content={toSafeString(data)} />
                            </SectionCard>
                        )

                    case 'solution_steps':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <MathSolutionStepsContent steps={data as SolutionStep[]} />
                            </SectionCard>
                        )

                    case 'final_answer':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30 border-2 border-green-500">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        <div className="font-mono text-2xl font-bold text-green-800 dark:text-green-300">
                                            {data as string}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        )

                    case 'verification':
                    case 'concept_explanation':
                    case 'common_mistakes':
                    case 'similar_practice':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={key === 'verification'}>
                                <MarkdownRenderer content={toSafeString(data)} />
                            </SectionCard>
                        )

                    case 'common_misconceptions': {
                        const misconceptions = Array.isArray(data) ? data : [data]
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="space-y-3">
                                    {misconceptions.map((item: any, idx: number) => {
                                        // Handle both string and object format, ensuring we always get strings
                                        let misconception: string
                                        let correction: string | null = null

                                        if (typeof item === 'string') {
                                            misconception = item
                                        } else if (typeof item === 'object' && item !== null) {
                                            misconception = String(item.misconception || item.mistake || JSON.stringify(item))
                                            correction = item.correction || item.fix ? String(item.correction || item.fix) : null
                                        } else {
                                            misconception = String(item)
                                        }

                                        return (
                                            <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-gray-700 dark:text-gray-300 font-medium">{misconception}</p>
                                                        {correction && (
                                                            <p className="text-green-600 dark:text-green-400 text-sm mt-1">✓ {correction}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </SectionCard>
                        )
                    }

                    case 'oral_questions': {
                        const questions = Array.isArray(data) ? data : [data]
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {questions.map((item: any, idx: number) => {
                                        // Handle both string and object format, ensuring we always get strings
                                        let question: string
                                        if (typeof item === 'string') {
                                            question = item
                                        } else if (typeof item === 'object' && item !== null) {
                                            question = String(item.question || item.text || JSON.stringify(item))
                                        } else {
                                            question = String(item)
                                        }
                                        return (
                                            <div key={idx} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="text-gray-700 dark:text-gray-300 pt-1">"{question}"</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </SectionCard>
                        )
                    }

                    // Assist mode (Classroom Help) sections
                    case 'understanding':
                    case 'immediate_action':
                    case 'quick_activity':
                    case 'bridge_the_gap':
                    case 'check_progress':
                    case 'for_later':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={key === 'understanding' || key === 'immediate_action'}>
                                <MarkdownRenderer content={data as string} />
                            </SectionCard>
                        )

                    // Plan mode (Lesson Plan) sections
                    case 'learning_objectives': {
                        const objectives = Array.isArray(data) ? data : [data]
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="space-y-2">
                                    {objectives.map((obj: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <p className="text-gray-700 dark:text-gray-300 pt-0.5">{String(obj)}</p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )
                    }

                    case 'duration_minutes':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{String(data)}</span>
                                    <span className="text-gray-500">minutes</span>
                                </div>
                            </SectionCard>
                        )

                    case 'activities': {
                        const activitiesList = Array.isArray(data) ? data : [data]
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="space-y-4">
                                    {activitiesList.map((activity: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {activity.activity_name || activity.name || `Activity ${idx + 1}`}
                                                    </h4>
                                                    {activity.duration_minutes && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            ⏱️ {activity.duration_minutes} min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {activity.description && (
                                                <div className="ml-11">
                                                    <MarkdownRenderer content={String(activity.description)} />
                                                </div>
                                            )}
                                            {activity.materials_needed && activity.materials_needed.length > 0 && (
                                                <div className="ml-11 mt-2 flex flex-wrap gap-2">
                                                    {activity.materials_needed.map((material: string, mIdx: number) => (
                                                        <span key={mIdx} className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300">
                                                            📦 {material}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )
                    }

                    case 'multi_grade_adaptations':
                    case 'low_tlm_alternatives':
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={false}>
                                <MarkdownRenderer content={String(data)} />
                            </SectionCard>
                        )

                    case 'exit_questions': {
                        const exitQs = Array.isArray(data) ? data : [data]
                        return (
                            <SectionCard key={key} sectionKey={key as any} defaultExpanded={true}>
                                <div className="space-y-3">
                                    {exitQs.map((q: any, idx: number) => (
                                        <div key={idx} className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500">
                                            <div className="flex items-start gap-3">
                                                <span className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-gray-700 dark:text-gray-300 pt-1">{String(q)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )
                    }

                    default:
                        return null
                }
            })}
        </div>
    )
}
