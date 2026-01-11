import { useTranslation } from 'react-i18next'
import { Lightbulb, MessageSquare, Sparkles, HelpCircle, Zap, RotateCw, ArrowRight, Target, Clock, CheckCircle } from 'lucide-react'
import type { AIResponse as AIResponseType, QueryMode } from '../../types'

interface AIResponseProps {
    response: AIResponseType
    mode: QueryMode
}

export default function AIResponse({ response, mode }: AIResponseProps) {
    const { t } = useTranslation()

    const renderExplainResponse = (structured: Record<string, unknown>) => (
        <div className="space-y-4">
            {structured.simple_explanation && (
                <div className="response-section border-l-blue-500">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                        <Lightbulb className="w-5 h-5" />
                        {t('response.simpleExplanation')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{structured.simple_explanation as string}</p>
                </div>
            )}

            {structured.what_to_say && (
                <div className="response-section border-l-green-500">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold mb-2">
                        <MessageSquare className="w-5 h-5" />
                        {t('response.whatToSay')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic">"{structured.what_to_say as string}"</p>
                </div>
            )}

            {structured.example_or_analogy && (
                <div className="response-section border-l-purple-500">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold mb-2">
                        <Sparkles className="w-5 h-5" />
                        {t('response.exampleAnalogy')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{structured.example_or_analogy as string}</p>
                </div>
            )}

            {structured.check_for_understanding && (
                <div className="response-section border-l-orange-500">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold mb-2">
                        <HelpCircle className="w-5 h-5" />
                        {t('response.checkUnderstanding')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{structured.check_for_understanding as string}</p>
                </div>
            )}
        </div>
    )

    const renderAssistResponse = (structured: Record<string, unknown>) => (
        <div className="space-y-4">
            {structured.immediate_action && (
                <div className="response-section border-l-danger-500 bg-danger-50 dark:bg-danger-500/10">
                    <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400 font-semibold mb-2">
                        <Zap className="w-5 h-5" />
                        {t('response.immediateAction')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{structured.immediate_action as string}</p>
                </div>
            )}

            {structured.management_strategy && (
                <div className="response-section border-l-blue-500">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                        <Target className="w-5 h-5" />
                        {t('response.managementStrategy')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{structured.management_strategy as string}</p>
                </div>
            )}

            {structured.teaching_pivot && (
                <div className="response-section border-l-green-500">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold mb-2">
                        <RotateCw className="w-5 h-5" />
                        {t('response.teachingPivot')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{structured.teaching_pivot as string}</p>
                </div>
            )}

            {structured.fallback_option && (
                <div className="response-section border-l-gray-500">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold mb-2">
                        <ArrowRight className="w-5 h-5" />
                        {t('response.fallbackOption')}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{structured.fallback_option as string}</p>
                </div>
            )}
        </div>
    )

    const renderPlanResponse = (structured: Record<string, unknown>) => (
        <div className="space-y-4">
            {structured.learning_objectives && (
                <div className="response-section border-l-blue-500">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                        <Target className="w-5 h-5" />
                        {t('response.learningObjectives')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {(structured.learning_objectives as string[]).map((obj, i) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                </div>
            )}

            {structured.duration_minutes && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {structured.duration_minutes as number} minutes</span>
                </div>
            )}

            {structured.activities && (
                <div className="response-section border-l-green-500">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold mb-3">
                        <Sparkles className="w-5 h-5" />
                        {t('response.activities')}
                    </div>
                    <div className="space-y-3">
                        {(structured.activities as Array<{ activity_name: string; duration_minutes: number; description: string }>).map((activity, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-800 dark:text-white">
                                        {i + 1}. {activity.activity_name}
                                    </span>
                                    <span className="text-sm text-gray-500">{activity.duration_minutes} min</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {structured.exit_questions && (
                <div className="response-section border-l-purple-500">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold mb-2">
                        <CheckCircle className="w-5 h-5" />
                        {t('response.exitQuestions')}
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {(structured.exit_questions as string[]).map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )

    const renderStructuredContent = () => {
        const structured = response.structured

        if (!structured || Object.keys(structured).length === 0 || 'raw_response' in structured) {
            return (
                <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{response.content}</p>
                </div>
            )
        }

        switch (mode) {
            case 'explain':
                return renderExplainResponse(structured)
            case 'assist':
                return renderAssistResponse(structured)
            case 'plan':
                return renderPlanResponse(structured)
            default:
                return <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{response.content}</p>
        }
    }

    return (
        <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    AI Response
                </h3>
                <span className="text-sm text-gray-500">
                    {response.processing_time_ms}ms
                </span>
            </div>

            {renderStructuredContent()}

            {/* Suggestions */}
            {response.suggestions && response.suggestions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 mb-3">
                        Follow-up suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                className="text-sm px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
