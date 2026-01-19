import { useState, useEffect } from 'react'
import {
    ClipboardList,
    Loader2,
    CheckCircle,
    Plus,
    Trash2,
    Sparkles,
    Send,
    ChevronRight,
    ChevronLeft,
    BarChart3,
    Users,
    Check,
    FileText,
    ArrowRight
} from 'lucide-react'
import { surveyApi, crpApi, arpApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

interface Teacher {
    id: number
    name: string
    phone: string
    school_name?: string
}

interface Question {
    question: string
    type: 'text' | 'rating' | 'single_choice' | 'multi_choice'
    options?: string[]
    required: boolean
}

interface Survey {
    id: number
    title: string
    description: string | null
    status: string
    is_ai_generated: boolean
    created_at: string
    response_count: number
}

export default function SurveyBuilder() {
    const { user } = useAuthStore()
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<'create' | 'surveys'>('create')

    // Stepper
    const [currentStep, setCurrentStep] = useState(1)
    const steps = [
        { id: 1, title: 'Generate', icon: Sparkles },
        { id: 2, title: 'Questions', icon: FileText },
        { id: 3, title: 'Assign', icon: Users }
    ]

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_role: 'teacher',
        context: ''
    })

    const [questions, setQuestions] = useState<Question[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeachers, setSelectedTeachers] = useState<number[]>([])

    useEffect(() => {
        loadSurveys()
        loadTeachers()
    }, [user?.role])

    const loadTeachers = async () => {
        try {
            let data: any
            // Use role-appropriate API for loading teachers
            if (user?.role === 'arp') {
                // ARP can see all teachers in their district
                data = await arpApi.getUsers({ role: 'teacher', page_size: 100 })
                setTeachers(Array.isArray(data) ? data : (data.items || []))
            } else {
                // CRP gets their assigned teachers
                data = await crpApi.getTeachers()
                setTeachers(Array.isArray(data) ? data : (data.items || []))
            }
        } catch (err) {
            console.error('Failed to load teachers:', err)
            setTeachers([])
        }
    }


    const loadSurveys = async () => {
        try {
            const data = await surveyApi.getMySurveys()
            setSurveys(Array.isArray(data) ? data : (data.items || []))
        } catch (err) {
            console.error('Failed to load surveys:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateWithAI = async () => {
        if (!formData.context) return
        setGenerating(true)

        try {
            const result = await surveyApi.generate({
                context: formData.context,
                num_questions: 5
            })
            if (result && result.questions && Array.isArray(result.questions)) {
                setQuestions(result.questions.map((q: any) => ({
                    question: q.question || q.text || '',
                    type: q.type || 'text',
                    options: q.options || undefined,
                    required: q.required !== false
                })))
                setFormData(prev => ({
                    ...prev,
                    title: result.title || `Survey - ${formData.context.slice(0, 30)}`,
                    description: result.description || `Survey about ${formData.context}`
                }))
                setCurrentStep(2) // Move to questions step
            }
        } catch (err) {
            console.error('Failed to generate survey:', err)
        } finally {
            setGenerating(false)
        }
    }

    const addQuestion = () => {
        setQuestions([...questions, { question: '', type: 'text', required: true }])
    }

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        setQuestions(questions.map((q, i) => i === index ? { ...q, ...updates } : q))
    }

    const handleSubmit = async () => {
        if (!formData.title || questions.length === 0) return

        setSubmitting(true)
        setSuccess(false)

        try {
            const survey = await surveyApi.create({
                title: formData.title,
                description: formData.description || undefined,
                target_role: formData.target_role,
                questions: questions,
                target_user_ids: selectedTeachers.length > 0 ? selectedTeachers : undefined
            })

            await surveyApi.publish(survey.id)

            setSuccess(true)
            setFormData({ title: '', description: '', target_role: 'teacher', context: '' })
            setQuestions([])
            setSelectedTeachers([])
            setCurrentStep(1)
            loadSurveys()
            setActiveTab('surveys')
        } catch (err) {
            console.error('Failed to create survey:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const toggleTeacher = (teacherId: number) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        )
    }

    const selectAllTeachers = () => {
        if (selectedTeachers.length === teachers.length) {
            setSelectedTeachers([])
        } else {
            setSelectedTeachers(teachers.map(t => t.id))
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1: return formData.title && (questions.length > 0 || formData.context)
            case 2: return questions.length > 0 && questions.every(q => q.question)
            case 3: return true // Teachers optional
            default: return false
        }
    }

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Survey Builder</h1>
                            <p className="text-white/70 text-sm">Create and send surveys to teachers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'create'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Survey
                </button>
                <button
                    onClick={() => setActiveTab('surveys')}
                    className={`px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === 'surveys'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    My Surveys ({surveys.length})
                </button>
            </div>

            {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Survey created and published successfully!</span>
                </div>
            )}

            {activeTab === 'create' && (
                <div className="space-y-6">
                    {/* Stepper */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            {steps.map((step, idx) => (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className={`flex items-center gap-3 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                            }`}>
                                            {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${currentStep >= step.id ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-4 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 1: Generate */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* AI Generate */}
                            <div className="bg-gradient-to-r from-[var(--color-primary-light)]/20 to-blue-50 dark:from-[var(--color-primary)]/20 dark:to-blue-900/20 rounded-2xl p-6 border border-[var(--color-primary)]/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-brand" />
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Generate with AI</h2>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Describe what you want to learn from teachers and AI will generate relevant questions.
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={formData.context}
                                        onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                                        placeholder="e.g., Understanding challenges with multigrade classrooms"
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                    <button
                                        onClick={handleGenerateWithAI}
                                        disabled={generating || !formData.context}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Manual Entry */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Survey Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                                            placeholder="Survey title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 resize-none"
                                            placeholder="Brief description..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {questions.length === 0 && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={addQuestion}
                                        className="px-6 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-500 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Add question manually
                                    </button>
                                </div>
                            )}

                            {(formData.title || questions.length > 0) && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                        className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                    >
                                        Next: Review Questions <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Questions */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        Questions ({questions.length})
                                    </h2>
                                    <button
                                        onClick={addQuestion}
                                        className="px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-brand text-sm font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Question
                                    </button>
                                </div>

                                {questions.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No questions yet</p>
                                        <button onClick={addQuestion} className="mt-3 text-primary-500 font-medium">Add your first question</button>
                                    </div>
                                ) : (
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
                                                            value={question.question}
                                                            onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            placeholder="Enter your question..."
                                                        />
                                                        <div className="flex items-center gap-4">
                                                            <select
                                                                value={question.type}
                                                                onChange={(e) => updateQuestion(index, { type: e.target.value as Question['type'] })}
                                                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                                            >
                                                                <option value="text">Text Answer</option>
                                                                <option value="rating">Rating (1-5)</option>
                                                                <option value="single_choice">Single Choice</option>
                                                                <option value="multi_choice">Multiple Choice</option>
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
                                                        {(question.type === 'single_choice' || question.type === 'multi_choice') && (
                                                            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-2">
                                                                <p className="text-xs font-medium text-gray-500">Options:</p>
                                                                {(question.options || []).map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(question.options || [])]
                                                                                newOptions[optIdx] = e.target.value
                                                                                updateQuestion(index, { options: newOptions })
                                                                            }}
                                                                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                                            placeholder={`Option ${optIdx + 1}`}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newOptions = (question.options || []).filter((_, i) => i !== optIdx)
                                                                                updateQuestion(index, { options: newOptions })
                                                                            }}
                                                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const newOptions = [...(question.options || []), '']
                                                                        updateQuestion(index, { options: newOptions })
                                                                    }}
                                                                    className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add option
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceed()}
                                    className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                >
                                    Next: Select Teachers <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Teacher Selection */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary-500" />
                                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                            Select Teachers to Assign
                                        </h2>
                                        {selectedTeachers.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                                {selectedTeachers.length} selected
                                            </span>
                                        )}
                                    </div>
                                    {teachers.length > 0 && (
                                        <button
                                            onClick={selectAllTeachers}
                                            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                                        >
                                            {selectedTeachers.length === teachers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                {teachers.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No teachers available</p>
                                        <p className="text-sm text-gray-400 mt-1">Survey will be published without specific assignments</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                        {teachers.map((teacher) => (
                                            <label
                                                key={teacher.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTeachers.includes(teacher.id)
                                                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedTeachers.includes(teacher.id)
                                                    ? 'bg-primary-500 border-primary-500'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {selectedTeachers.includes(teacher.id) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedTeachers.includes(teacher.id)}
                                                    onChange={() => toggleTeacher(teacher.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                                        {teacher.name}
                                                    </p>
                                                    {teacher.school_name && (
                                                        <p className="text-xs text-gray-500 truncate">{teacher.school_name}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Survey Summary</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-blue-600 dark:text-blue-400">Title</p>
                                        <p className="font-medium text-blue-800 dark:text-blue-200 truncate">{formData.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600 dark:text-blue-400">Questions</p>
                                        <p className="font-medium text-blue-800 dark:text-blue-200">{questions.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600 dark:text-blue-400">Teachers</p>
                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                            {selectedTeachers.length > 0 ? selectedTeachers.length : 'All'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Create & Publish Survey
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'surveys' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        </div>
                    ) : surveys.length === 0 ? (
                        <div className="p-12 text-center">
                            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No surveys created yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {surveys.map((survey) => (
                                <div key={survey.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${survey.is_ai_generated
                                                ? 'bg-primary-100 dark:bg-primary-900/30'
                                                : 'bg-gray-100 dark:bg-gray-700'
                                                }`}>
                                                {survey.is_ai_generated ? (
                                                    <Sparkles className="w-5 h-5 text-brand" />
                                                ) : (
                                                    <ClipboardList className="w-5 h-5 text-gray-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">{survey.title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(survey.created_at).toLocaleDateString('en-IN')}
                                                    {survey.description && ` • ${survey.description.slice(0, 50)}...`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">{survey.response_count}</p>
                                                <p className="text-xs text-gray-500">responses</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${survey.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {survey.status}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
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
