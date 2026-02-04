import { useState } from 'react'
import { Plus, Trash2, GripVertical, Check, Circle, HelpCircle, AlignLeft, Type, ListChecks } from 'lucide-react'

interface Question {
    id: string
    type: 'mcq' | 'short' | 'long' | 'true_false'
    question: string
    options?: string[]
    correctOption?: number
    correctAnswer?: string
    marks: number
}

interface AssessmentBuilderProps {
    questions: Question[]
    onChange: (questions: Question[]) => void
    onGenerateMarkdown: (md: string) => void
}

const questionTypes = [
    { value: 'mcq' as const, label: 'Multiple Choice', icon: ListChecks },
    { value: 'true_false' as const, label: 'True/False', icon: Check },
    { value: 'short' as const, label: 'Short Answer', icon: Type },
    { value: 'long' as const, label: 'Long Answer', icon: AlignLeft },
]

export default function AssessmentBuilder({ questions, onChange, onGenerateMarkdown }: AssessmentBuilderProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const generateId = () => Math.random().toString(36).substring(7)

    const addQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: generateId(),
            type,
            question: '',
            marks: type === 'long' ? 5 : type === 'short' ? 2 : 1,
            ...(type === 'mcq' ? { options: ['', '', '', ''], correctOption: 0 } : {}),
            ...(type === 'true_false' ? { options: ['True', 'False'], correctOption: 0 } : {}),
        }
        onChange([...questions, newQuestion])
        setExpandedId(newQuestion.id)
    }

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q))
    }

    const deleteQuestion = (id: string) => {
        onChange(questions.filter(q => q.id !== id))
    }

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        const question = questions.find(q => q.id === questionId)
        if (question && question.options) {
            const newOptions = [...question.options]
            newOptions[optionIndex] = value
            updateQuestion(questionId, { options: newOptions })
        }
    }

    const addOption = (questionId: string) => {
        const question = questions.find(q => q.id === questionId)
        if (question && question.options) {
            updateQuestion(questionId, { options: [...question.options, ''] })
        }
    }

    const removeOption = (questionId: string, optionIndex: number) => {
        const question = questions.find(q => q.id === questionId)
        if (question && question.options && question.options.length > 2) {
            const newOptions = question.options.filter((_, i) => i !== optionIndex)
            const newCorrect = question.correctOption === optionIndex ? 0 :
                question.correctOption !== undefined && question.correctOption > optionIndex ?
                    question.correctOption - 1 : question.correctOption
            updateQuestion(questionId, { options: newOptions, correctOption: newCorrect })
        }
    }

    const generateMarkdown = () => {
        let md = '# Assessment\n\n'
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
        md += `**Total Marks:** ${totalMarks}\n\n---\n\n`

        questions.forEach((q, index) => {
            md += `## Question ${index + 1} (${q.marks} ${q.marks === 1 ? 'mark' : 'marks'})\n\n`
            md += `${q.question}\n\n`

            if (q.type === 'mcq' && q.options) {
                q.options.forEach((opt, i) => {
                    const optLabel = String.fromCharCode(65 + i) // A, B, C, D
                    md += `- **${optLabel})** ${opt}\n`
                })
                md += '\n'
            } else if (q.type === 'true_false') {
                md += '- True\n- False\n\n'
            } else if (q.type === 'short') {
                md += '_Answer in 1-2 sentences._\n\n'
            } else if (q.type === 'long') {
                md += '_Answer in a paragraph (100-150 words)._\n\n'
            }

            md += '---\n\n'
        })

        // Answer key
        md += '## Answer Key\n\n'
        questions.forEach((q, index) => {
            if (q.type === 'mcq' && q.correctOption !== undefined && q.options) {
                const optLabel = String.fromCharCode(65 + q.correctOption)
                md += `**Q${index + 1}:** ${optLabel}) ${q.options[q.correctOption]}\n\n`
            } else if (q.type === 'true_false' && q.correctOption !== undefined) {
                md += `**Q${index + 1}:** ${q.correctOption === 0 ? 'True' : 'False'}\n\n`
            } else if (q.correctAnswer) {
                md += `**Q${index + 1}:** ${q.correctAnswer}\n\n`
            }
        })

        onGenerateMarkdown(md)
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

    return (
        <div className="space-y-6">
            {/* Summary Bar */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Questions:</span>
                        <span className="ml-2 font-bold text-gray-900 dark:text-white">{questions.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Total Marks:</span>
                        <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{totalMarks}</span>
                    </div>
                </div>
                <button
                    onClick={generateMarkdown}
                    disabled={questions.length === 0}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Generate Assessment
                </button>
            </div>

            {/* Question List */}
            <div className="space-y-3">
                {questions.map((question, index) => {
                    const TypeIcon = questionTypes.find(t => t.value === question.type)?.icon || HelpCircle
                    const isExpanded = expandedId === question.id

                    return (
                        <div
                            key={question.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${isExpanded ? 'border-blue-200 dark:border-blue-700 shadow-md' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            {/* Question Header */}
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : question.id)}
                            >
                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <TypeIcon className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Q{index + 1}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                            {questionTypes.find(t => t.value === question.type)?.label}
                                        </span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400">{question.marks} marks</span>
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-white truncate mt-0.5">
                                        {question.question || <span className="italic text-gray-400">No question text</span>}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id) }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expanded Form */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                                    {/* Question Text */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Question Text
                                        </label>
                                        <textarea
                                            value={question.question}
                                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                            placeholder="Enter your question..."
                                            rows={2}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    {/* MCQ Options */}
                                    {(question.type === 'mcq') && question.options && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Options (select correct answer)
                                            </label>
                                            <div className="space-y-2">
                                                {question.options.map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuestion(question.id, { correctOption: i })}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${question.correctOption === i ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-green-50'}`}
                                                        >
                                                            {question.correctOption === i ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => updateOption(question.id, i, e.target.value)}
                                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        {question.options && question.options.length > 2 && (
                                                            <button
                                                                onClick={() => removeOption(question.id, i)}
                                                                className="p-2 text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => addOption(question.id)}
                                                className="mt-2 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" /> Add Option
                                            </button>
                                        </div>
                                    )}

                                    {/* True/False */}
                                    {question.type === 'true_false' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Correct Answer
                                            </label>
                                            <div className="flex gap-4">
                                                {['True', 'False'].map((option, i) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => updateQuestion(question.id, { correctOption: i })}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${question.correctOption === i ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                                                    >
                                                        {question.correctOption === i ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expected Answer for Short/Long */}
                                    {(question.type === 'short' || question.type === 'long') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Expected Answer (for answer key)
                                            </label>
                                            <textarea
                                                value={question.correctAnswer || ''}
                                                onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                                                placeholder="Enter the expected answer..."
                                                rows={question.type === 'long' ? 4 : 2}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Marks */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Marks
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={question.marks}
                                            onChange={(e) => updateQuestion(question.id, { marks: parseInt(e.target.value) || 1 })}
                                            className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add Question Buttons */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2 py-2">Add:</span>
                {questionTypes.map(type => {
                    const Icon = type.icon
                    return (
                        <button
                            key={type.value}
                            onClick={() => addQuestion(type.value)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                        >
                            <Icon className="w-4 h-4" />
                            {type.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
