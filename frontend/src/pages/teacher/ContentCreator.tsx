import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Save,
    Send,
    ArrowLeft,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    Loader2,
    Plus,
    X,
    Sparkles
} from 'lucide-react'
import { contentApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'

// Content type options
const contentTypes = [
    { value: 'lesson_plan', label: 'Lesson Plan', icon: FileText, color: 'blue' },
    { value: 'activity', label: 'Activity', icon: Activity, color: 'green' },
    { value: 'tlm', label: 'TLM', icon: Palette, color: 'pink' },
    { value: 'assessment', label: 'Assessment', icon: ClipboardCheck, color: 'purple' },
    { value: 'worksheet', label: 'Worksheet', icon: FileSpreadsheet, color: 'orange' },
]

export default function ContentCreator() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)

    const { grades, subjects } = useMasterData()

    // Form state
    const [title, setTitle] = useState('')
    const [contentType, setContentType] = useState('lesson_plan')
    const [description, setDescription] = useState('')
    const [grade, setGrade] = useState<number | null>(null)
    const [subject, setSubject] = useState('')
    const [topic, setTopic] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [contentJson, setContentJson] = useState<any>({})

    // UI state
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Load existing content if editing
    useEffect(() => {
        if (isEditing && id) {
            loadContent(parseInt(id))
        }
    }, [id, isEditing])

    const loadContent = async (contentId: number) => {
        setLoading(true)
        try {
            const data = await contentApi.getById(contentId)
            setTitle(data.title)
            setContentType(data.content_type)
            setDescription(data.description)
            setGrade(data.grade)
            setSubject(data.subject || '')
            setTopic(data.topic || '')
            setTags(data.tags || [])
            setContentJson(data.content_json || {})
        } catch (err) {
            setError('Failed to load content')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            setError('Title and description are required')
            return
        }

        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const data = {
                title: title.trim(),
                content_type: contentType,
                description: description.trim(),
                content_json: contentJson,
                grade: grade || undefined,
                subject: subject || undefined,
                topic: topic || undefined,
                tags: tags.length > 0 ? tags : undefined
            }

            if (isEditing && id) {
                await contentApi.update(parseInt(id), data)
                setSuccess('Content saved successfully!')
            } else {
                const result = await contentApi.create(data)
                setSuccess('Content created successfully!')
                // Navigate to edit page with new ID
                navigate(`/teacher/content/edit/${result.id}`, { replace: true })
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save content')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            setError('Title and description are required before submitting')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            // Save first if new
            let contentId = id
            if (!isEditing) {
                const data = {
                    title: title.trim(),
                    content_type: contentType,
                    description: description.trim(),
                    content_json: contentJson,
                    grade: grade || undefined,
                    subject: subject || undefined,
                    topic: topic || undefined,
                    tags: tags.length > 0 ? tags : undefined
                }
                const result = await contentApi.create(data)
                contentId = result.id
            }

            // Submit for review
            await contentApi.submit(parseInt(contentId as string))
            setSuccess('Content submitted for review!')
            setTimeout(() => {
                navigate('/teacher/my-content')
            }, 1500)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit content')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditing ? 'Edit Content' : 'Create New Content'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Share your teaching materials with other educators
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit for Review
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
                    {success}
                </div>
            )}

            {/* Content Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Type</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {contentTypes.map((type) => {
                        const Icon = type.icon
                        const isSelected = contentType === type.value
                        return (
                            <button
                                key={type.value}
                                onClick={() => setContentType(type.value)}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected
                                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? `text-${type.color}-500` : 'text-gray-400'}`} />
                                <span className={`text-sm font-medium ${isSelected ? `text-${type.color}-700 dark:text-${type.color}-300` : 'text-gray-600 dark:text-gray-300'}`}>
                                    {type.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Photosynthesis - 5E Lesson Plan for Class 6"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Grade
                        </label>
                        <select
                            value={grade || ''}
                            onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Select Grade</option>
                            {grades.map((g: any) => (
                                <option key={g.id} value={g.grade_number}>Class {g.grade_number}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject
                        </label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map((s: any) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Topic
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Photosynthesis"
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description / Content *
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your content in detail. Include objectives, materials needed, step-by-step instructions, and any other relevant information..."
                        rows={10}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    />
                    <p className="mt-1 text-xs text-gray-500">You can use markdown formatting</p>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                            >
                                {tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-blue-900 dark:hover:text-blue-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="Add a tag and press Enter"
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Enhancement Suggestion */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Need help creating content?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Use the <strong>Ask AI</strong> feature to generate lesson plans, activities, and TLMs, then copy them here to share with other teachers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
