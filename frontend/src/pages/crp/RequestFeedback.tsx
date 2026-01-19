import { useState, useEffect } from 'react'
import {
    MessageSquarePlus,
    Loader2,
    CheckCircle,
    Plus,
    Trash2,
    Send,
    Clock
} from 'lucide-react'
import { feedbackApi, crpApi } from '../../services/api'

interface Teacher {
    id: number
    name: string
    school: string
}

interface Question {
    text: string
    type: 'text' | 'rating' | 'choice'
    options?: string[]
    required: boolean
}

interface FeedbackRequest {
    id: number
    title: string
    status: string
    target_user_id: number
    created_at: string
    due_date: string | null
}

export default function RequestFeedback() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [sentRequests, setSentRequests] = useState<FeedbackRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<'create' | 'sent'>('create')

    const [formData, setFormData] = useState({
        target_user_id: 0,
        title: '',
        description: '',
        due_date: ''
    })

    const [questions, setQuestions] = useState<Question[]>([
        { text: '', type: 'text', required: true }
    ])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [teacherData, sentData] = await Promise.all([
                crpApi.getTeachers(),
                feedbackApi.getSent()
            ])
            setTeachers(teacherData.teachers || [])
            setSentRequests(sentData.items || [])
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const addQuestion = () => {
        setQuestions([...questions, { text: '', type: 'text', required: true }])
    }

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index))
        }
    }

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        setQuestions(questions.map((q, i) => i === index ? { ...q, ...updates } : q))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.target_user_id || !formData.title || questions.some(q => !q.text)) {
            return
        }

        setSubmitting(true)
        setSuccess(false)

        try {
            await feedbackApi.createRequest({
                target_user_id: formData.target_user_id,
                title: formData.title,
                description: formData.description || undefined,
                questions: questions.map(q => ({
                    text: q.text,
                    type: q.type,
                    options: q.options,
                    required: q.required
                })),
                due_date: formData.due_date || undefined
            })
            setSuccess(true)
            setFormData({ target_user_id: 0, title: '', description: '', due_date: '' })
            setQuestions([{ text: '', type: 'text', required: true }])
            loadData()
        } catch (err) {
            console.error('Failed to create feedback request:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const isValid = formData.target_user_id > 0 && formData.title && questions.every(q => q.text)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Dashboard Header */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden animate-fade-in p-8 lg:p-10 mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <MessageSquarePlus className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Teacher Guidance
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">
                            Initiate structured feedback collection and support requests
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'create'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Plus className="w-4 h-4 inline mr-2" />
                    New Request
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'sent'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Send className="w-4 h-4 inline mr-2" />
                    Sent Requests ({sentRequests.length})
                </button>
            </div>

            {activeTab === 'create' && (
                <>
                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="font-medium text-green-800 dark:text-green-300">
                                Feedback request sent successfully!
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                        {/* Basic Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Request Details
                            </h2>

                            <div className="space-y-4">
                                {/* Select Teacher */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select Teacher <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.target_user_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, target_user_id: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value={0}>Choose a teacher...</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name} - {teacher.school}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Monthly Classroom Reflection"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 resize-none"
                                        placeholder="Brief description of what you're collecting feedback about..."
                                        rows={2}
                                    />
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Questions ({questions.length})
                                </h2>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-sm font-medium hover:bg-primary-200 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-1">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 space-y-3">
                                                <input
                                                    type="text"
                                                    value={question.text}
                                                    onChange={(e) => updateQuestion(index, { text: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Enter your question..."
                                                    required
                                                />
                                                <div className="flex items-center gap-4">
                                                    <select
                                                        value={question.type}
                                                        onChange={(e) => updateQuestion(index, { type: e.target.value as Question['type'] })}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                                    >
                                                        <option value="text">Text Answer</option>
                                                        <option value="rating">Rating (1-5)</option>
                                                        <option value="choice">Multiple Choice</option>
                                                    </select>
                                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <input
                                                            type="checkbox"
                                                            checked={question.required}
                                                            onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                                                            className="rounded"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </div>
                                            {questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Feedback Request
                                </>
                            )}
                        </button>
                    </form>
                </>
            )}

            {activeTab === 'sent' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {sentRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No feedback requests sent yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {sentRequests.map((request) => (
                                <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {request.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(request.created_at).toLocaleDateString('en-IN')}
                                                </span>
                                                {request.due_date && (
                                                    <span>Due: {new Date(request.due_date).toLocaleDateString('en-IN')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
