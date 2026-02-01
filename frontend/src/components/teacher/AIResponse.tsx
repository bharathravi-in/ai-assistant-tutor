import { useTranslation } from 'react-i18next'
import {
    Lightbulb,
    MessageSquare,
    Sparkles,
    HelpCircle,
    Zap,
    RotateCw,
    ArrowRight,
    Target,
    CheckCircle,
    BookOpen,
    Eye,
    TrendingUp,
    Shield,
    BrainCircuit,
    Palette,
    FileText,
    ShieldCheck,
    Paperclip
} from 'lucide-react'
import MarkdownRenderer from '../common/MarkdownRenderer'
import type { AIResponse as AIResponseType, QueryMode, AuditResult } from '../../types'
import NCERTBadge from './NCERTBadge'

interface AIResponseProps {
    response: AIResponseType
    mode: QueryMode
    onGenerateQuiz?: (topic: string, content: string) => void
    isQuizLoading?: boolean
    onGenerateTLM?: (topic: string, content: string) => void
    isTLMLoading?: boolean
    onAudit?: (topic: string, content: string) => void
    isAuditLoading?: boolean
    auditResult?: AuditResult
}

export default function AIResponse({
    response,
    mode,
    onGenerateQuiz,
    isQuizLoading,
    onGenerateTLM,
    isTLMLoading,
    onAudit,
    isAuditLoading,
    auditResult,
}: AIResponseProps) {
    useTranslation()

    const RenderValue = ({ value }: { value: any }) => {
        if (value === null || value === undefined) return null

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return <MarkdownRenderer content={value.toString()} />
        }

        if (Array.isArray(value)) {
            return (
                <ul className="space-y-2">
                    {value.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            <div className="flex-1"><RenderValue value={item} /></div>
                        </li>
                    ))}
                </ul>
            )
        }

        if (typeof value === 'object') {
            return (
                <div className="space-y-3">
                    {Object.entries(value).map(([key, val], i) => (
                        <div key={i} className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                            {key && !/^\d+$/.test(key) && (
                                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    {key.replace(/_/g, ' ')}
                                </span>
                            )}
                            <div className="text-gray-700 dark:text-gray-300 text-sm">
                                <RenderValue value={val} />
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        return null
    }

    const Section = ({ icon: Icon, title, content, colorClass, borderClass }: any) => (
        <div className={`p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 ${borderClass} shadow-md hover:shadow-lg transition-all animate-slide-up`}>
            <div className={`flex items-center gap-3 mb-3 ${colorClass}`}>
                <div className={`p-2 rounded-lg ${colorClass.replace('text-', 'bg-').replace('-600', '-50').replace('-400', '-900/20')}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-lg">{title}</h4>
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <RenderValue value={content} />
            </div>
        </div>
    )

    const renderExplainResponse = (structured: Record<string, any>) => (
        <div className="space-y-6">
            {structured.conceptual_briefing && (
                <Section
                    icon={BookOpen}
                    title="Conceptual Briefing"
                    content={structured.conceptual_briefing}
                    colorClass="text-indigo-600 dark:text-indigo-400"
                    borderClass="border-l-indigo-500"
                />
            )}

            {structured.simple_explanation && (
                <Section
                    icon={Lightbulb}
                    title="Simple Explanation"
                    content={structured.simple_explanation}
                    colorClass="text-blue-600 dark:text-blue-400"
                    borderClass="border-l-blue-500"
                />
            )}

            {structured.mnemonics_hooks && (
                <Section
                    icon={Zap}
                    title="Catchy Hooks & Mnemonics"
                    content={structured.mnemonics_hooks}
                    colorClass="text-amber-600 dark:text-amber-400"
                    borderClass="border-l-amber-500"
                />
            )}

            {structured.what_to_say && (
                <Section
                    icon={MessageSquare}
                    title="What to Say (Teacher Talk)"
                    content={structured.what_to_say}
                    colorClass="text-emerald-600 dark:text-emerald-400"
                    borderClass="border-l-emerald-500"
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structured.specific_examples && (
                    <Section
                        icon={Sparkles}
                        title="Local Examples"
                        content={structured.specific_examples}
                        colorClass="text-purple-600 dark:text-purple-400"
                        borderClass="border-l-purple-500"
                    />
                )}
                {structured.generic_examples && (
                    <Section
                        icon={Target}
                        title="Generic Examples"
                        content={structured.generic_examples}
                        colorClass="text-pink-600 dark:text-pink-400"
                        borderClass="border-l-pink-500"
                    />
                )}
            </div>

            {structured.visual_aid_idea && (
                <Section
                    icon={Eye}
                    title="Visual Aid / TLM Idea"
                    content={structured.visual_aid_idea}
                    colorClass="text-cyan-600 dark:text-cyan-400"
                    borderClass="border-l-cyan-500"
                />
            )}

            {structured.check_for_understanding && (
                <Section
                    icon={HelpCircle}
                    title="Check for Understanding"
                    content={structured.check_for_understanding}
                    colorClass="text-orange-600 dark:text-orange-400"
                    borderClass="border-l-orange-500"
                />
            )}
        </div>
    )

    const renderAssistResponse = (structured: Record<string, any>) => (
        <div className="space-y-6">
            {structured.understanding && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 italic text-primary-700 dark:text-primary-300">
                    "{structured.understanding}"
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structured.immediate_action && (
                    <Section
                        icon={Zap}
                        title="Immediate Action"
                        content={structured.immediate_action}
                        colorClass="text-red-600 dark:text-red-400"
                        borderClass="border-l-red-500"
                    />
                )}
                {structured.mnemonics_hooks && (
                    <Section
                        icon={Sparkles}
                        title="Quick Hook"
                        content={structured.mnemonics_hooks}
                        colorClass="text-amber-600 dark:text-amber-400"
                        borderClass="border-l-amber-500"
                    />
                )}
            </div>

            {structured.quick_activity && (
                <Section
                    icon={TrendingUp}
                    title="Quick Activity"
                    content={structured.quick_activity}
                    colorClass="text-green-600 dark:text-green-400"
                    borderClass="border-l-green-500"
                />
            )}

            {structured.bridge_the_gap && (
                <Section
                    icon={ArrowRight}
                    title="Bridge back to Lesson"
                    content={structured.bridge_the_gap}
                    colorClass="text-indigo-600 dark:text-indigo-400"
                    borderClass="border-l-indigo-500"
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structured.check_progress && (
                    <Section
                        icon={CheckCircle}
                        title="Check Progress"
                        content={structured.check_progress}
                        colorClass="text-blue-600 dark:text-blue-400"
                        borderClass="border-l-blue-500"
                    />
                )}
                {structured.for_later && (
                    <Section
                        icon={Shield}
                        title="Preventive Tip"
                        content={structured.for_later}
                        colorClass="text-slate-600 dark:text-slate-400"
                        borderClass="border-l-slate-500"
                    />
                )}
            </div>
        </div>
    )

    const renderPlanResponse = (structured: Record<string, any>) => (
        <div className="space-y-6">
            {structured.learning_objectives && (
                <Section
                    icon={Target}
                    title="Learning Objectives"
                    content={structured.learning_objectives}
                    colorClass="text-blue-600 dark:text-blue-400"
                    borderClass="border-l-blue-500"
                />
            )}

            {structured.activities && (
                <Section
                    icon={Sparkles}
                    title="Lesson Activities"
                    content={structured.activities}
                    colorClass="text-green-600 dark:text-green-400"
                    borderClass="border-l-green-500"
                />
            )}

            {structured.exit_questions && (
                <Section
                    icon={CheckCircle}
                    title="Exit Questions"
                    content={structured.exit_questions}
                    colorClass="text-purple-600 dark:text-purple-400"
                    borderClass="border-l-purple-500"
                />
            )}
        </div>
    )

    const renderContent = () => {
        const structured = response.structured
        if (!structured || Object.keys(structured).length === 0 || structured.raw_response) {
            return (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={response.content} />
                </div>
            )
        }

        switch (mode) {
            case 'explain': return renderExplainResponse(structured)
            case 'assist': return renderAssistResponse(structured)
            case 'plan': return renderPlanResponse(structured)
            default: return <MarkdownRenderer content={response.content} />
        }
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Analysis Complete</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{response.processing_time_ms}ms</span>
            </div>

            {/* NCERT Compliance Badge */}
            {auditResult && (
                <div className="flex justify-end pr-2 -mb-2 relative z-10">
                    <NCERTBadge audit={auditResult} isLoading={isAuditLoading} />
                </div>
            )}

            {/* Uploaded Reference Context */}
            {response.query?.media_path && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm animate-slide-up">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Paperclip className="w-4 h-4" />
                        <span>Reference Material Provided</span>
                    </div>
                    <div className="flex items-start gap-4">
                        {response.query.media_path.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                            <div className="relative group cursor-pointer" onClick={() => window.open(response.query!.media_path!, '_blank')}>
                                <img
                                    src={response.query.media_path}
                                    alt="Reference"
                                    className="w-24 h-24 object-cover rounded-xl border border-gray-100 dark:border-gray-700 group-hover:opacity-90 transition-opacity whitespace-pre-wrap"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        ) : (
                            <div
                                className="w-24 h-24 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => window.open(response.query!.media_path!, '_blank')}
                            >
                                <FileText className="w-8 h-8 text-gray-400" />
                                <span className="text-[10px] text-gray-500 font-medium">View PDF</span>
                            </div>
                        )}
                        <div className="flex-1 py-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                "The AI has analyzed this document to provide the context for the teaching tips below."
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {renderContent()}


            {response.suggestions && response.suggestions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Suggested Follow-ups</p>
                    <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                className="text-sm px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-primary-400 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm hover:shadow-md"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Agentic Power-up Cards */}
            {(mode === 'explain' || mode === 'plan') && (onGenerateQuiz || onGenerateTLM) && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                    {/* The Quiz Genie */}
                    {onGenerateQuiz && (
                        <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl shadow-xl shadow-purple-500/20 text-white flex flex-col justify-between gap-6 group hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <BrainCircuit className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">The Quiz Genie</h3>
                                    <p className="text-white/70 text-sm">Instantly turn this into a student assessment.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const topicName = response.query?.topic || 'Current Lesson'
                                    onGenerateQuiz(topicName, response.content)
                                }}
                                disabled={isQuizLoading}
                                className="w-full px-6 py-4 bg-white text-purple-700 rounded-2xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
                            >
                                {isQuizLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                Generate Quiz
                            </button>
                        </div>
                    )}

                    {/* The TLM Designer */}
                    {onGenerateTLM && (
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-3xl shadow-xl shadow-indigo-500/20 text-white flex flex-col justify-between gap-6 group hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Palette className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">The TLM Designer</h3>
                                    <p className="text-white/70 text-sm">Create visual kits and DIY physical aids.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const topicName = response.query?.topic || 'Current Lesson'
                                    onGenerateTLM(topicName, response.content)
                                }}
                                disabled={isTLMLoading}
                                className="w-full px-6 py-4 bg-white text-emerald-700 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
                            >
                                {isTLMLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
                                Design Aids
                            </button>
                        </div>
                    )}

                    {/* The NCERT Auditor */}
                    {onAudit && !auditResult && (
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-500/20 text-white flex flex-col justify-between gap-6 group hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">The NCERT Auditor</h3>
                                    <p className="text-white/70 text-sm">Verify compliance with national standards.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const topicName = response.query?.topic || 'Current Lesson'
                                    onAudit(topicName, response.content)
                                }}
                                disabled={isAuditLoading}
                                className="w-full px-6 py-4 bg-white text-indigo-700 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
                            >
                                {isAuditLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Audit Curriculum
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
