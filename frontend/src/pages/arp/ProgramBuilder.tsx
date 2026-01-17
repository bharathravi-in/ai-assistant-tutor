import { useState, useEffect } from 'react'
import {
    Library,
    Plus,
    Loader2,
    X,
    BookOpen,
    GripVertical,
    Search,
    Globe
} from 'lucide-react'
import { programApi, resourcesApi } from '../../services/api'

interface Program {
    id: number
    name: string
    description: string | null
    grade: number | null
    subject: string | null
    status: string
    is_public: boolean
    resource_count: number
    created_at: string
}

interface Resource {
    id: number
    title: string
    resource_type: string
    grade: number | null
    subject: string | null
}

interface ProgramResource {
    id: number
    resource_id: number
    resource_title: string | null
    resource_type: string | null
    section_name: string | null
    order: number
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'EVS']

export default function ProgramBuilder() {
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
    const [programResources, setProgramResources] = useState<ProgramResource[]>([])
    const [availableResources, setAvailableResources] = useState<Resource[]>([])
    const [showAddResource, setShowAddResource] = useState(false)
    const [resourceSearchQuery, setResourceSearchQuery] = useState('')
    const [addingResource, setAddingResource] = useState(false)
    const [publishing, setPublishing] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        grade: null as number | null,
        subject: ''
    })

    useEffect(() => {
        loadPrograms()
    }, [])

    const loadPrograms = async () => {
        setLoading(true)
        try {
            const data = await programApi.list()
            setPrograms(data.programs || [])
        } catch (err) {
            console.error('Failed to load programs:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadProgramResources = async (programId: number) => {
        try {
            const data = await programApi.getResources(programId)
            setProgramResources(data.resources || [])
        } catch (err) {
            console.error('Failed to load program resources:', err)
        }
    }

    const loadAvailableResources = async () => {
        try {
            const data = await resourcesApi.getResources({})
            setAvailableResources(data.resources || [])
        } catch (err) {
            console.error('Failed to load resources:', err)
        }
    }

    const handleSelectProgram = async (program: Program) => {
        setSelectedProgram(program)
        await loadProgramResources(program.id)
        await loadAvailableResources()
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            await programApi.create({
                name: formData.name,
                description: formData.description || undefined,
                grade: formData.grade || undefined,
                subject: formData.subject || undefined
            })
            setShowCreateModal(false)
            setFormData({ name: '', description: '', grade: null, subject: '' })
            loadPrograms()
        } catch (err) {
            console.error('Failed to create program:', err)
        } finally {
            setCreating(false)
        }
    }

    const handleAddResource = async (resourceId: number) => {
        if (!selectedProgram) return
        setAddingResource(true)

        try {
            await programApi.addResource(selectedProgram.id, {
                resource_id: resourceId,
                order: programResources.length
            })
            await loadProgramResources(selectedProgram.id)
            setShowAddResource(false)
        } catch (err) {
            console.error('Failed to add resource:', err)
        } finally {
            setAddingResource(false)
        }
    }

    const handlePublish = async () => {
        if (!selectedProgram) return
        setPublishing(true)

        try {
            await programApi.publish(selectedProgram.id)
            loadPrograms()
            setSelectedProgram({ ...selectedProgram, status: 'published', is_public: true })
        } catch (err) {
            console.error('Failed to publish:', err)
        } finally {
            setPublishing(false)
        }
    }

    const filteredResources = availableResources.filter(r =>
        r.title?.toLowerCase().includes(resourceSearchQuery.toLowerCase()) &&
        !programResources.some(pr => pr.resource_id === r.id)
    )

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Program Builder
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Organize resources into training programs
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Program
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Programs List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-800 dark:text-white">Programs</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="p-8 text-center">
                            <Library className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No programs yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                            {programs.map(program => (
                                <div
                                    key={program.id}
                                    onClick={() => handleSelectProgram(program)}
                                    className={`p-4 cursor-pointer transition-colors ${selectedProgram?.id === program.id
                                        ? 'bg-purple-50 dark:bg-purple-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {program.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                {program.grade && <span>Grade {program.grade}</span>}
                                                {program.subject && <span>• {program.subject}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${program.status === 'published'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {program.status}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {program.resource_count} resources
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Program Details */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {selectedProgram ? (
                        <>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-800 dark:text-white">
                                        {selectedProgram.name}
                                    </h2>
                                    <p className="text-sm text-gray-500">{selectedProgram.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAddResource(true)}
                                        className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-medium text-sm flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Resource
                                    </button>
                                    {selectedProgram.status !== 'published' && (
                                        <button
                                            onClick={handlePublish}
                                            disabled={publishing}
                                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-sm flex items-center gap-1"
                                        >
                                            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                            Publish
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-4">
                                {programResources.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No resources added yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Click "Add Resource" to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {programResources.map((pr, index) => (
                                            <div
                                                key={pr.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {pr.resource_title || 'Untitled'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{pr.resource_type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Select a program to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Program Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl">
                        <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Create Program</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Program Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    placeholder="e.g., Math Fundamentals"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 resize-none"
                                    rows={3}
                                    placeholder="Describe this program..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Grade
                                    </label>
                                    <select
                                        value={formData.grade || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value ? parseInt(e.target.value) : null }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    >
                                        <option value="">Select</option>
                                        {GRADES.map(g => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Subject
                                    </label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                    >
                                        <option value="">Select</option>
                                        {SUBJECTS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.name}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Resource Modal */}
            {showAddResource && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg max-h-[80vh] rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Add Resource</h3>
                            <button
                                onClick={() => setShowAddResource(false)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={resourceSearchQuery}
                                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                                    placeholder="Search resources..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredResources.map(resource => (
                                <div
                                    key={resource.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{resource.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {resource.resource_type} • Grade {resource.grade} • {resource.subject}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAddResource(resource.id)}
                                        disabled={addingResource}
                                        className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm font-medium"
                                    >
                                        {addingResource ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                    </button>
                                </div>
                            ))}
                            {filteredResources.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No resources found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
