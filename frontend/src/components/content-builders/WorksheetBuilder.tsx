import { useState } from 'react'
import { Plus, Trash2, GripVertical, ArrowRight, PenLine, ListOrdered, Columns, HelpCircle } from 'lucide-react'

interface WorksheetSection {
    id: string
    type: 'fill_blank' | 'matching' | 'problems'
    title: string
    items: any[]
}

interface WorksheetBuilderProps {
    sections: WorksheetSection[]
    onChange: (sections: WorksheetSection[]) => void
    onGenerateMarkdown: (md: string) => void
}

const sectionTypes = [
    { value: 'fill_blank' as const, label: 'Fill in the Blanks', icon: PenLine },
    { value: 'matching' as const, label: 'Match the Columns', icon: Columns },
    { value: 'problems' as const, label: 'Practice Problems', icon: ListOrdered },
]

export default function WorksheetBuilder({ sections, onChange, onGenerateMarkdown }: WorksheetBuilderProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const generateId = () => Math.random().toString(36).substring(7)

    // Count blanks (___) in a sentence
    const countBlanks = (text: string) => (text.match(/___/g) || []).length

    const addSection = (type: WorksheetSection['type']) => {
        const newSection: WorksheetSection = {
            id: generateId(),
            type,
            title: sectionTypes.find(t => t.value === type)?.label || '',
            items: type === 'matching'
                ? [{ left: '', right: '' }]
                : type === 'fill_blank'
                    ? [{ content: '', answers: [''] }] // answers is now an array
                    : [{ content: '', answer: '' }],
        }
        onChange([...sections, newSection])
        setExpandedId(newSection.id)
    }

    const updateSection = (id: string, updates: Partial<WorksheetSection>) => {
        onChange(sections.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const deleteSection = (id: string) => {
        onChange(sections.filter(s => s.id !== id))
    }

    const addItem = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId)
        if (section) {
            const newItem = section.type === 'matching'
                ? { left: '', right: '' }
                : section.type === 'fill_blank'
                    ? { content: '', answers: [''] }
                    : { content: '', answer: '' }
            updateSection(sectionId, { items: [...section.items, newItem] })
        }
    }

    const updateItem = (sectionId: string, itemIndex: number, updates: any) => {
        const section = sections.find(s => s.id === sectionId)
        if (section) {
            const newItems = [...section.items]
            newItems[itemIndex] = { ...newItems[itemIndex], ...updates }
            updateSection(sectionId, { items: newItems })
        }
    }

    // Update the content and sync answers array based on blank count
    const updateFillBlankContent = (sectionId: string, itemIndex: number, content: string) => {
        const section = sections.find(s => s.id === sectionId)
        if (section) {
            const blankCount = countBlanks(content)
            const currentAnswers = section.items[itemIndex].answers || ['']

            // Adjust answers array to match blank count
            let newAnswers: string[] = []
            if (blankCount === 0) {
                newAnswers = [''] // Keep at least one for fallback
            } else {
                newAnswers = Array.from({ length: blankCount }, (_, i) => currentAnswers[i] || '')
            }

            updateItem(sectionId, itemIndex, { content, answers: newAnswers })
        }
    }

    // Update a specific answer for a blank
    const updateBlankAnswer = (sectionId: string, itemIndex: number, answerIndex: number, value: string) => {
        const section = sections.find(s => s.id === sectionId)
        if (section) {
            const currentAnswers = [...(section.items[itemIndex].answers || [])]
            currentAnswers[answerIndex] = value
            updateItem(sectionId, itemIndex, { answers: currentAnswers })
        }
    }

    const removeItem = (sectionId: string, itemIndex: number) => {
        const section = sections.find(s => s.id === sectionId)
        if (section && section.items.length > 1) {
            updateSection(sectionId, { items: section.items.filter((_, i) => i !== itemIndex) })
        }
    }

    const generateMarkdown = () => {
        let md = '# Worksheet\n\n'

        sections.forEach((section, sIndex) => {
            md += `## ${sIndex + 1}. ${section.title}\n\n`

            if (section.type === 'fill_blank') {
                section.items.forEach((item, i) => {
                    const sentence = item.content || ''
                    md += `${i + 1}. ${sentence}\n\n`
                })
                md += '\n'
            } else if (section.type === 'matching') {
                md += '| Column A | Column B |\n|----------|----------|\n'
                section.items.forEach((item) => {
                    md += `| ${item.left} | ${item.right} |\n`
                })
                md += '\n**Match Column A with Column B**\n\n'
            } else if (section.type === 'problems') {
                section.items.forEach((item, i) => {
                    md += `${i + 1}. ${item.content}\n\n`
                })
            }

            md += '---\n\n'
        })

        // Answer key
        md += '## Answer Key\n\n'
        sections.forEach((section, sIndex) => {
            md += `### ${sIndex + 1}. ${section.title}\n\n`
            section.items.forEach((item, i) => {
                if (section.type === 'matching') {
                    md += `${i + 1}. ${item.left} → ${item.right}\n`
                } else if (section.type === 'fill_blank') {
                    const answers = item.answers || [item.answer || 'N/A']
                    if (answers.length === 1) {
                        md += `${i + 1}. ${answers[0] || 'N/A'}\n`
                    } else {
                        const answerList = answers.map((a: string, idx: number) => `Blank ${idx + 1}: ${a || 'N/A'}`).join(', ')
                        md += `${i + 1}. ${answerList}\n`
                    }
                } else {
                    md += `${i + 1}. ${item.answer || 'N/A'}\n`
                }
            })
            md += '\n'
        })

        onGenerateMarkdown(md)
    }

    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)

    return (
        <div className="space-y-6">
            {/* Summary Bar */}
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Sections:</span>
                        <span className="ml-2 font-bold text-gray-900 dark:text-white">{sections.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Total Items:</span>
                        <span className="ml-2 font-bold text-purple-600 dark:text-purple-400">{totalItems}</span>
                    </div>
                </div>
                <button
                    onClick={generateMarkdown}
                    disabled={sections.length === 0}
                    className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Generate Worksheet
                </button>
            </div>

            {/* Sections List */}
            <div className="space-y-3">
                {sections.map((section, sIndex) => {
                    const TypeIcon = sectionTypes.find(t => t.value === section.type)?.icon || PenLine
                    const isExpanded = expandedId === section.id

                    return (
                        <div
                            key={section.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${isExpanded ? 'border-purple-200 dark:border-purple-700 shadow-md' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            {/* Section Header */}
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : section.id)}
                            >
                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                    <TypeIcon className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Section {sIndex + 1}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                            {section.items.length} items
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">
                                        {section.title || 'Untitled Section'}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteSection(section.id) }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expanded Form */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                                    {/* Section Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Section Title
                                        </label>
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                            placeholder="Enter section title..."
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Help text for fill in blanks */}
                                    {section.type === 'fill_blank' && (
                                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                Use <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">___</code> to mark blanks.
                                                For multiple blanks, use multiple <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">___</code> markers.
                                                <br />
                                                <span className="text-blue-600 dark:text-blue-400">Example: "The ___ is the capital of ___."</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className="space-y-3">
                                        {section.items.map((item, iIndex) => (
                                            <div key={iIndex} className="flex items-start gap-2">
                                                <span className="w-6 h-8 flex items-center justify-center text-sm text-gray-400">{iIndex + 1}.</span>

                                                {section.type === 'fill_blank' && (
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={item.content}
                                                            onChange={(e) => updateFillBlankContent(section.id, iIndex, e.target.value)}
                                                            placeholder="The ___ is the capital of ___."
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                                        />
                                                        {/* Answer fields based on blank count */}
                                                        {(item.answers || [item.answer || '']).map((ans: string, ansIndex: number) => (
                                                            <div key={ansIndex} className="flex items-center gap-2">
                                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium w-16 flex-shrink-0">
                                                                    {(item.answers?.length || 1) > 1 ? `Blank ${ansIndex + 1}:` : 'Answer:'}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={ans}
                                                                    onChange={(e) => updateBlankAnswer(section.id, iIndex, ansIndex, e.target.value)}
                                                                    placeholder={`Answer for blank ${ansIndex + 1}`}
                                                                    className="flex-1 px-3 py-2 border border-green-200 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 text-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {section.type === 'matching' && (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={item.left}
                                                            onChange={(e) => updateItem(section.id, iIndex, { left: e.target.value })}
                                                            placeholder="Column A item"
                                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                                        />
                                                        <ArrowRight className="w-4 h-4 text-gray-400 mt-2.5" />
                                                        <input
                                                            type="text"
                                                            value={item.right}
                                                            onChange={(e) => updateItem(section.id, iIndex, { right: e.target.value })}
                                                            placeholder="Column B item"
                                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                                        />
                                                    </>
                                                )}

                                                {section.type === 'problems' && (
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={item.content}
                                                            onChange={(e) => updateItem(section.id, iIndex, { content: e.target.value })}
                                                            placeholder="Solve: 25 × 4 = ?"
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.answer}
                                                            onChange={(e) => updateItem(section.id, iIndex, { answer: e.target.value })}
                                                            placeholder="Answer: 100"
                                                            className="w-full px-3 py-2 border border-green-200 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 text-sm"
                                                        />
                                                    </div>
                                                )}

                                                {section.items.length > 1 && (
                                                    <button
                                                        onClick={() => removeItem(section.id, iIndex)}
                                                        className="p-2 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => addItem(section.id)}
                                        className="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Item
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add Section Buttons */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2 py-2">Add Section:</span>
                {sectionTypes.map(type => {
                    const Icon = type.icon
                    return (
                        <button
                            key={type.value}
                            onClick={() => addSection(type.value)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
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
