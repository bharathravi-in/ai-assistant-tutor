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
    AlertTriangle
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
    materials: string
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

interface StructuredContent {
    // Regular explain response fields
    conceptual_briefing?: string
    simple_explanation?: string
    mnemonics_hooks?: (string | { type: string; content: string })[]
    what_to_say?: string
    specific_examples?: Example[]
    generic_examples?: Example[]
    visual_aid_idea?: VisualAidIdea
    check_for_understanding?: CheckQuestion[]
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
    return (
        <div className="space-y-3">
            {items.map((item, idx) => {
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

// Render examples - handles both description and problem/explanation formats
function ExamplesContent({ items, color = 'emerald' }: { items: Example[], color?: string }) {
    const colorClasses = {
        emerald: 'bg-emerald-500',
        cyan: 'bg-cyan-500'
    }

    return (
        <div className="space-y-3">
            {items.map((example, idx) => (
                <div
                    key={idx}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald} text-white flex items-center justify-center text-xs font-bold`}>
                            {idx + 1}
                        </span>
                        {example.title}
                    </h4>
                    {/* Handle description format */}
                    {example.description && (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {example.description}
                        </p>
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
            ))}
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

            <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700">
                <h5 className="font-medium text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-1 text-sm">
                    <ListChecks className="w-4 h-4" /> Materials Needed
                </h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{item.materials}</p>
            </div>

            {instructionsList.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2 text-sm">📝 Instructions</h5>
                    <ol className="space-y-2">
                        {instructionsList.map((instruction, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <span>{instruction.replace(/^\d+[.)]\s*/, '')}</span>
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

// Render check for understanding questions - handles level as number or string
function CheckUnderstandingContent({ items, topic, grade, language }: { items: CheckQuestion[], topic?: string, grade?: number, language?: string }) {
    return (
        <div className="space-y-3">
            {items.map((item, idx) => (
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

    // Order of sections to display - different for math vs regular
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
        : [
            'conceptual_briefing',
            'simple_explanation',
            'mnemonics_hooks',
            'what_to_say',
            'specific_examples',
            'generic_examples',
            'visual_aid_idea',
            'check_for_understanding'
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

                    default:
                        return null
                }
            })}
        </div>
    )
}
