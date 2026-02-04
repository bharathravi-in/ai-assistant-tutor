import { useState } from 'react'
import { Plus, Trash2, Clock, Target, Beaker, BookOpen, PenTool, CheckSquare } from 'lucide-react'

interface LessonPlanSection {
    id: string
    phase: 'engage' | 'explore' | 'explain' | 'elaborate' | 'evaluate'
    duration: number
    content: string
}

interface LessonPlanBuilderProps {
    objectives: string[]
    materials: string[]
    duration: number
    sections: LessonPlanSection[]
    onObjectivesChange: (objectives: string[]) => void
    onMaterialsChange: (materials: string[]) => void
    onDurationChange: (duration: number) => void
    onSectionsChange: (sections: LessonPlanSection[]) => void
    onGenerateMarkdown: (md: string) => void
}

const phases = [
    { id: 'engage' as const, label: 'Engage', icon: Target, color: 'blue', description: 'Capture student interest and curiosity' },
    { id: 'explore' as const, label: 'Explore', icon: Beaker, color: 'green', description: 'Hands-on exploration of concepts' },
    { id: 'explain' as const, label: 'Explain', icon: BookOpen, color: 'purple', description: 'Formal concept instruction' },
    { id: 'elaborate' as const, label: 'Elaborate', icon: PenTool, color: 'orange', description: 'Apply learning in new contexts' },
    { id: 'evaluate' as const, label: 'Evaluate', icon: CheckSquare, color: 'red', description: 'Assess student understanding' },
]

export default function LessonPlanBuilder({
    objectives, materials, duration, sections,
    onObjectivesChange, onMaterialsChange, onDurationChange, onSectionsChange,
    onGenerateMarkdown
}: LessonPlanBuilderProps) {
    const [expandedPhase, setExpandedPhase] = useState<string | null>('engage')

    const generateId = () => Math.random().toString(36).substring(7)

    const addObjective = () => onObjectivesChange([...objectives, ''])
    const updateObjective = (index: number, value: string) => {
        const newObj = [...objectives]
        newObj[index] = value
        onObjectivesChange(newObj)
    }
    const removeObjective = (index: number) => {
        onObjectivesChange(objectives.filter((_, i) => i !== index))
    }

    const addMaterial = () => onMaterialsChange([...materials, ''])
    const updateMaterial = (index: number, value: string) => {
        const newMat = [...materials]
        newMat[index] = value
        onMaterialsChange(newMat)
    }
    const removeMaterial = (index: number) => {
        onMaterialsChange(materials.filter((_, i) => i !== index))
    }

    const getPhaseSection = (phase: typeof phases[0]['id']) => {
        return sections.find(s => s.phase === phase) || { id: '', phase, duration: 10, content: '' }
    }

    const updatePhaseSection = (phase: typeof phases[0]['id'], updates: Partial<LessonPlanSection>) => {
        const existing = sections.find(s => s.phase === phase)
        if (existing) {
            onSectionsChange(sections.map(s => s.phase === phase ? { ...s, ...updates } : s))
        } else {
            onSectionsChange([...sections, { id: generateId(), phase, duration: 10, content: '', ...updates }])
        }
    }

    const totalPhaseDuration = sections.reduce((sum, s) => sum + s.duration, 0)

    const generateMarkdown = () => {
        let md = '# Lesson Plan\n\n'
        md += `**Duration:** ${duration} minutes\n\n`

        if (objectives.length > 0) {
            md += '## Learning Objectives\n\n'
            md += 'By the end of this lesson, students will be able to:\n\n'
            objectives.forEach(obj => {
                if (obj) md += `- ${obj}\n`
            })
            md += '\n'
        }

        if (materials.length > 0) {
            md += '## Materials Needed\n\n'
            materials.forEach(mat => {
                if (mat) md += `- ${mat}\n`
            })
            md += '\n'
        }

        md += '---\n\n## 5E Model Lesson Flow\n\n'

        phases.forEach(phase => {
            const section = getPhaseSection(phase.id)
            md += `### ${phase.label} (${section.duration} minutes)\n\n`
            md += `*${phase.description}*\n\n`
            if (section.content) {
                md += `${section.content}\n\n`
            } else {
                md += 'No content added.\n\n'
            }
            md += '---\n\n'
        })

        onGenerateMarkdown(md)
    }

    return (
        <div className="space-y-6">
            {/* Duration & Summary */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Duration:</span>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => onDurationChange(parseInt(e.target.value) || 40)}
                            className="w-16 px-2 py-1 border border-emerald-200 dark:border-emerald-600 rounded bg-white dark:bg-gray-800 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-sm text-gray-500">min</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Phases: <span className="font-semibold">{totalPhaseDuration}</span> min used
                    </div>
                </div>
                <button
                    onClick={generateMarkdown}
                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    Generate Lesson Plan
                </button>
            </div>

            {/* Objectives */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        Learning Objectives
                    </h3>
                    <button onClick={addObjective} className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
                <div className="space-y-2">
                    {objectives.map((obj, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 w-4">{i + 1}.</span>
                            <input
                                type="text"
                                value={obj}
                                onChange={(e) => updateObjective(i, e.target.value)}
                                placeholder="Students will be able to..."
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
                            />
                            <button onClick={() => removeObjective(i)} className="p-1 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {objectives.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No objectives added yet</p>
                    )}
                </div>
            </div>

            {/* Materials */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Beaker className="w-4 h-4 text-green-500" />
                        Materials Needed
                    </h3>
                    <button onClick={addMaterial} className="text-sm text-green-500 hover:text-green-600 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {materials.map((mat, i) => (
                        <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <input
                                type="text"
                                value={mat}
                                onChange={(e) => updateMaterial(i, e.target.value)}
                                placeholder="Material..."
                                className="bg-transparent text-sm w-32 focus:outline-none"
                            />
                            <button onClick={() => removeMaterial(i)} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {materials.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No materials added yet</p>
                    )}
                </div>
            </div>

            {/* 5E Phases */}
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">5E Model Phases</h3>
                {phases.map((phase) => {
                    const section = getPhaseSection(phase.id)
                    const Icon = phase.icon
                    const isExpanded = expandedPhase === phase.id

                    return (
                        <div
                            key={phase.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${isExpanded ? `border-${phase.color}-200 dark:border-${phase.color}-700 shadow-md` : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer"
                                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-${phase.color}-50 dark:bg-${phase.color}-900/30 flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 text-${phase.color}-500`} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{phase.label}</div>
                                    <div className="text-xs text-gray-500">{phase.description}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={section.duration}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updatePhaseSection(phase.id, { duration: parseInt(e.target.value) || 5 })}
                                        className="w-14 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-center"
                                    />
                                    <span className="text-xs text-gray-400">min</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <textarea
                                        value={section.content}
                                        onChange={(e) => updatePhaseSection(phase.id, { content: e.target.value })}
                                        placeholder={`Describe the ${phase.label.toLowerCase()} phase activities...`}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
