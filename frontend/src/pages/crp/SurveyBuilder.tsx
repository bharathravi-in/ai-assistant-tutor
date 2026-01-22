import { useState, useEffect } from 'react'
import {
    ClipboardList,
    Loader2,
    CheckCircle,
    Plus,
    Trash2,
    Sparkles,
    Send,
    ChevronLeft,
    Check,
    FileText,
    ArrowRight,
    ArrowLeft,
    Download,
    BarChart3,
    Users,
    MoreVertical,
    Eye,
    Edit,
    UserPlus
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
    questions?: any[]
}

export default function SurveyBuilder() {
    const { user } = useAuthStore()
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<'create' | 'surveys' | 'responses'>('create')
    const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null)

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
    const [deleting, setDeleting] = useState(false)
    const [editingSurveyId, setEditingSurveyId] = useState<number | null>(null)
    const [generatedSurveyId, setGeneratedSurveyId] = useState<number | null>(null)

    // Survey actions state
    const [actionMenuSurvey, setActionMenuSurvey] = useState<number | null>(null)
    const [viewingSurvey, setViewingSurvey] = useState<Survey | null>(null)
    const [surveyResponses, setSurveyResponses] = useState<any[]>([])
    const [loadingResponses, setLoadingResponses] = useState(false)

    useEffect(() => {
        loadSurveys()
        loadTeachers()
    }, [user?.role])

    const loadTeachers = async () => {
        try {
            let data: any
            // Use role-appropriate API for loading teachers
            if (user?.role === 'arp') {
                // ARP can see all teachers and CRPs in their district
                const [teachersData, crpsData] = await Promise.all([
                    arpApi.getUsers({ role: 'teacher', page_size: 100 }),
                    arpApi.getUsers({ role: 'crp', page_size: 100 })
                ])

                const combined = [
                    ...(Array.isArray(teachersData) ? teachersData : (teachersData.items || [])),
                    ...(Array.isArray(crpsData) ? crpsData : (crpsData.items || []))
                ]
                setTeachers(combined)
            } else {
                // CRP gets their assigned teachers
                data = await crpApi.getTeachers()
                setTeachers(Array.isArray(data) ? (data as any) : (data.teachers || data.items || []))
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
                context: formData.context
            })
            if (result && result.questions && Array.isArray(result.questions)) {
                setGeneratedSurveyId(result.id)
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
            let surveyId = editingSurveyId || generatedSurveyId

            if (surveyId) {
                // Update existing survey (Manual Edit or AI Draft)
                await surveyApi.update(surveyId, {
                    title: formData.title,
                    description: formData.description || undefined,
                    target_role: formData.target_role,
                    questions: questions,
                    target_user_ids: selectedTeachers.length > 0 ? selectedTeachers : undefined
                })
            } else {
                // Create new survey
                const survey = await surveyApi.create({
                    title: formData.title,
                    description: formData.description || undefined,
                    target_role: formData.target_role,
                    questions: questions,
                    target_user_ids: selectedTeachers.length > 0 ? selectedTeachers : undefined
                })
                surveyId = survey.id
            }

            // Publish to make it active and send assignments
            if (surveyId) {
                await surveyApi.publish(surveyId)
            }

            setSuccess(true)
            setFormData({ title: '', description: '', target_role: 'teacher', context: '' })
            setQuestions([])
            setSelectedTeachers([])
            setEditingSurveyId(null)
            setGeneratedSurveyId(null)
            setCurrentStep(1)
            loadSurveys()
            setActiveTab('surveys')
        } catch (err) {
            console.error('Failed to submit survey:', err)
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

    const handleDeleteSurvey = async (surveyId: number) => {
        if (!confirm('Are you sure you want to delete this survey?')) return
        setDeleting(true)
        setActionMenuSurvey(null)
        try {
            await surveyApi.delete(surveyId)
            loadSurveys()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Cannot delete survey with responses')
        } finally {
            setDeleting(false)
        }
    }

    const handleViewResponses = async (survey: Survey) => {
        setViewingSurvey(survey)
        setLoadingResponses(true)
        setActionMenuSurvey(null)
        setActiveTab('responses')
        setSelectedResponseId(null)
        try {
            const responses = await surveyApi.getResponses(survey.id)
            setSurveyResponses(Array.isArray(responses) ? responses : [])
        } catch (err) {
            console.error('Failed to load responses:', err)
            setSurveyResponses([])
        } finally {
            setLoadingResponses(false)
        }
    }

    const calculateAnalytics = () => {
        if (!viewingSurvey || !surveyResponses || surveyResponses.length === 0) return null;

        const totalResponses = surveyResponses.length;
        const ratingQuestions = viewingSurvey.questions?.filter((q: any) => q.type === 'rating') || [];

        const ratingStats = ratingQuestions.map((q: any) => {
            const scores = surveyResponses.map(r => {
                const ans = r.answers.find((a: any) => a.question_index === viewingSurvey.questions?.indexOf(q));
                return ans ? parseInt(ans.answer) : null;
            }).filter(s => s !== null && !isNaN(s as number)) as number[];

            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
            return { question: q.question, average: avg };
        });

        return {
            total: totalResponses,
            ratingStats
        };
    }

    const printStyles = `
        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .print-full-width { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .print-shadow-none { shadow: none !important; border: none !important; }
            .print-bg-white { background: white !important; }
            @page { margin: 15mm; }
            body { background: white !important; }
            .grid { display: block !important; }
            .sticky { position: static !important; }
            .max-h-[calc(100vh-140px)] { max-height: none !important; overflow: visible !important; }
            
            /* Specific tweaks for Survey Response Report */
            .report-header { 
                border-bottom: 2px solid #1E40AF;
                margin-bottom: 20px;
                padding-bottom: 10px;
                display: block !important;
            }
        }
    `;

    const closeViewingSurvey = () => {
        setActiveTab('surveys')
        setViewingSurvey(null)
        setSurveyResponses([])
        setSelectedResponseId(null)
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
        <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in mb-20">
            <style>{printStyles}</style>

            {/* Header - Minimalist */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 no-print">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#007AFF] text-white shadow-sm">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-medium tracking-tight text-[#1C1C1E] dark:text-white">
                            Survey Builder
                        </h1>
                        <p className="text-[#8E8E93] text-lg">
                            Create and manage feedback surveys for teachers
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation - Apple Segmented Control Style */}
            <div className="flex justify-center mb-10 no-print">
                <div className="inline-flex p-1 bg-[#E5E5EA] dark:bg-white/5 rounded-[12px]">
                    <button
                        onClick={() => {
                            setActiveTab('create');
                            setSuccess(false);
                        }}
                        className={`
                            px-8 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 flex items-center gap-2
                            ${activeTab === 'create'
                                ? 'bg-white text-[#007AFF] shadow-sm dark:bg-white/10 dark:text-white'
                                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }
                        `}
                    >
                        <Plus className="w-4 h-4" />
                        Create
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('surveys');
                            setSuccess(false);
                        }}
                        className={`
                            px-8 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 flex items-center gap-2
                            ${activeTab === 'surveys'
                                ? 'bg-white text-[#007AFF] shadow-sm dark:bg-white/10 dark:text-white'
                                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }
                        `}
                    >
                        <BarChart3 className="w-4 h-4" />
                        My Surveys ({surveys.length})
                    </button>
                    {activeTab === 'responses' && (
                        <button
                            className="px-8 py-2.5 rounded-[10px] bg-white text-[#007AFF] shadow-sm dark:bg-white/10 dark:text-white text-sm font-medium flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Responses
                        </button>
                    )}
                </div>
            </div>

            {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Survey created and published successfully!</span>
                </div>
            )}

            {activeTab === 'create' && (
                <div className="space-y-6">
                    {/* Stepper - Minimalist */}
                    <div className="flex items-center justify-between mb-12 relative px-4 no-print">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-[#D1D1D6] dark:bg-white/10 -z-10" />
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex flex-col items-center gap-3 transition-all duration-300`}
                            >
                                <div
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                        ${currentStep === step.id
                                            ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20 scale-110'
                                            : currentStep > step.id
                                                ? 'bg-[#34C759] text-white shadow-md'
                                                : 'bg-[#F2F2F7] text-[#8E8E93] dark:bg-white/5'
                                        }
                                    `}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${currentStep === step.id ? 'text-[#1C1C1E] dark:text-white' : 'text-[#8E8E93]'}`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Generate */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
                            {/* AI Generate - Glassy look */}
                            <div className="bg-[#007AFF]/5 dark:bg-[#007AFF]/10 rounded-[20px] p-8 border border-[#007AFF]/20 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-6 h-6 text-[#007AFF]" />
                                    <h2 className="text-xl font-medium text-[#1C1C1E] dark:text-white">AI Assistant</h2>
                                </div>
                                <p className="text-[#8E8E93] mb-6">
                                    Describe your objective, and our AI will curate professional questions for your survey.
                                </p>
                                <div className="space-y-4">
                                    <textarea
                                        value={formData.context}
                                        onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                                        placeholder="e.g., Evaluating the impact of digital tools on student participation in rural schools..."
                                        className="input h-32 focus:bg-white"
                                    />
                                    <button
                                        onClick={handleGenerateWithAI}
                                        disabled={generating || !formData.context}
                                        className="w-full py-4 rounded-[12px] bg-[#007AFF] text-white font-medium shadow-lg shadow-[#007AFF]/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {generating ? 'Curating Questions...' : 'Generate Questions'}
                                    </button>
                                </div>
                            </div>

                            {/* Manual Entry Form */}
                            <div className="card p-8">
                                <h2 className="text-xl font-medium text-[#1C1C1E] dark:text-white mb-6">Survey Details</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[#8E8E93] mb-2 uppercase tracking-wide">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Monthly Pedagogy Review"
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#8E8E93] mb-2 uppercase tracking-wide">Description</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Optional description of the survey goal..."
                                            className="input h-24"
                                        />
                                    </div>
                                </div>
                            </div>

                            {questions.length === 0 && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={addQuestion}
                                        className="px-6 py-3 rounded-xl border-2 border-dashed border-[#D1D1D6] text-[#8E8E93] hover:border-[#007AFF] hover:text-[#007AFF] transition-colors flex items-center gap-2"
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
                                        className="btn-primary px-6 py-3 flex items-center gap-2"
                                    >
                                        Next: Review Questions <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Questions */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-medium text-[#1C1C1E] dark:text-white">
                                        Questions ({questions.length})
                                    </h2>
                                    <button
                                        onClick={addQuestion}
                                        className="btn bg-[#007AFF] text-white hover:opacity-90 px-4 py-2 text-sm flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Question
                                    </button>
                                </div>

                                {questions.length === 0 ? (
                                    <div className="p-12 text-center border-2 border-dashed border-[#E5E5EA] dark:border-white/5 rounded-[20px]">
                                        <ClipboardList className="w-12 h-12 text-[#AEAEB2] mx-auto mb-4" />
                                        <p className="text-[#8E8E93] text-lg mb-6">No questions added yet</p>
                                        <button onClick={addQuestion} className="text-[#007AFF] font-medium hover:underline">Start by adding your first question</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {questions.map((question, index) => (
                                            <div key={index} className="p-6 bg-[#F2F2F7] dark:bg-white/5 rounded-[16px] border border-transparent hover:border-[#D1D1D6] transition-all">
                                                <div className="flex items-start gap-4">
                                                    <span className="w-8 h-8 rounded-full bg-[#007AFF] text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1 space-y-4">
                                                        <input
                                                            type="text"
                                                            value={question.question}
                                                            onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                                            className="input bg-white dark:bg-[#1C1C1E]"
                                                            placeholder="Question Label"
                                                        />
                                                        <div className="flex flex-wrap items-center gap-6">
                                                            <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] rounded-[10px] px-3 py-1.5 border border-[#E5E5EA] dark:border-white/10">
                                                                <span className="text-xs text-[#8E8E93] uppercase font-bold">Type</span>
                                                                <select
                                                                    value={question.type}
                                                                    onChange={(e) => updateQuestion(index, { type: e.target.value as Question['type'] })}
                                                                    className="bg-transparent text-sm focus:outline-none"
                                                                >
                                                                    <option value="text">Text Response</option>
                                                                    <option value="rating">Rating (1-5)</option>
                                                                    <option value="single_choice">Single Choice</option>
                                                                    <option value="multi_choice">Multiple Choice</option>
                                                                </select>
                                                            </div>
                                                            <label className="flex items-center gap-3 text-sm font-medium text-[#1C1C1E] dark:text-white cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={question.required}
                                                                    onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                                                                    className="w-5 h-5 rounded-[6px] border-[#D1D1D6] text-[#007AFF] focus:ring-[#007AFF]/20"
                                                                />
                                                                Required
                                                            </label>
                                                        </div>
                                                        {(question.type === 'single_choice' || question.type === 'multi_choice') && (
                                                            <div className="pl-6 border-l-2 border-[#D1D1D6] dark:border-white/10 space-y-3 mt-4">
                                                                <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Options</p>
                                                                {(question.options || []).map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex items-center gap-3 group/opt">
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(question.options || [])]
                                                                                newOptions[optIdx] = e.target.value
                                                                                updateQuestion(index, { options: newOptions })
                                                                            }}
                                                                            className="flex-1 px-4 py-2 text-sm rounded-[10px] border border-[#E5E5EA] dark:border-white/10 bg-white dark:bg-[#1C1C1E] focus:border-[#007AFF] outline-none"
                                                                            placeholder={`Option ${optIdx + 1}`}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newOptions = (question.options || []).filter((_, i) => i !== optIdx)
                                                                                updateQuestion(index, { options: newOptions })
                                                                            }}
                                                                            className="p-1.5 text-[#FF3B30] opacity-0 group-hover/opt:opacity-100 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const newOptions = [...(question.options || []), '']
                                                                        updateQuestion(index, { options: newOptions })
                                                                    }}
                                                                    className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-2 pt-2"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" /> Add another option
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        className="p-2 text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
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
                                    className="btn px-6 py-3 flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceed()}
                                    className="btn-primary px-6 py-3 flex items-center gap-2"
                                >
                                    Next: Select Teachers <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Teacher Selection */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fade-in shadow-xl rounded-[24px]">
                            <div className="card p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#007AFF]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-medium text-[#1C1C1E] dark:text-white">
                                                Assign Teachers
                                            </h2>
                                            {selectedTeachers.length > 0 && (
                                                <p className="text-sm font-semibold text-[#007AFF]">
                                                    {selectedTeachers.length} selected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {teachers.length > 0 && (
                                        <button
                                            onClick={selectAllTeachers}
                                            className="text-sm font-semibold text-[#007AFF] hover:underline"
                                        >
                                            {selectedTeachers.length === teachers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                {teachers.length === 0 ? (
                                    <div className="p-12 text-center border-2 border-dashed border-[#E5E5EA] dark:border-white/5 rounded-[20px]">
                                        <Users className="w-12 h-12 text-[#AEAEB2] mx-auto mb-4" />
                                        <p className="text-[#8E8E93]">No teachers available to assign</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {teachers.map((teacher) => (
                                            <label
                                                key={teacher.id}
                                                className={`flex items-center gap-4 p-4 rounded-[16px] border-2 cursor-pointer transition-all ${selectedTeachers.includes(teacher.id)
                                                    ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#007AFF]/10 shadow-sm'
                                                    : 'border-transparent bg-[#F2F2F7] dark:bg-white/5 hover:border-[#D1D1D6]'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-[6px] border-2 flex items-center justify-center transition-all ${selectedTeachers.includes(teacher.id)
                                                    ? 'bg-[#007AFF] border-[#007AFF]'
                                                    : 'border-[#D1D1D6] dark:border-white/10'
                                                    }`}>
                                                    {selectedTeachers.includes(teacher.id) && (
                                                        <Check className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedTeachers.includes(teacher.id)}
                                                    onChange={() => toggleTeacher(teacher.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[#1C1C1E] dark:text-white truncate">
                                                        {teacher.name}
                                                    </p>
                                                    {teacher.school_name && (
                                                        <p className="text-xs text-[#8E8E93] truncate uppercase tracking-wider font-medium">{teacher.school_name}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary - High-end Card */}
                            <div className="bg-[#1C1C1E] dark:bg-white/5 text-white rounded-[24px] p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/20 blur-3xl rounded-full -mr-10 -mt-10" />
                                <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#007AFF]" />
                                    Final Summary
                                </h3>
                                <div className="grid grid-cols-3 gap-8">
                                    <div>
                                        <p className="text-[#8E8E93] text-[11px] uppercase tracking-widest font-bold mb-1">Title</p>
                                        <p className="font-medium truncate">{formData.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-[#8E8E93] text-[11px] uppercase tracking-widest font-bold mb-1">Questions</p>
                                        <p className="font-medium">{questions.length} Items</p>
                                    </div>
                                    <div>
                                        <p className="text-[#8E8E93] text-[11px] uppercase tracking-widest font-bold mb-1">Recipients</p>
                                        <p className="font-medium">
                                            {selectedTeachers.length > 0 ? `${selectedTeachers.length} Teachers` : 'Broadcast'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={prevStep}
                                    className="btn px-6 py-3 flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="btn-primary px-8 py-4 flex items-center gap-2"
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
                <div className="card-highlight overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin" />
                        </div>
                    ) : surveys.length === 0 ? (
                        <div className="p-20 text-center">
                            <ClipboardList className="w-16 h-16 text-[#AEAEB2] mx-auto mb-4" />
                            <p className="text-[#8E8E93] text-lg font-medium">No surveys created yet</p>
                            <button onClick={() => setActiveTab('create')} className="mt-4 text-[#007AFF] font-semibold hover:underline">Create your first survey</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                            {surveys.map((survey) => (
                                <div key={survey.id} className="p-5 hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm ${survey.is_ai_generated
                                                ? 'bg-[#007AFF] text-white'
                                                : 'bg-[#F2F2F7] dark:bg-white/10 text-[#8E8E93]'
                                                }`}>
                                                {survey.is_ai_generated ? (
                                                    <Sparkles className="w-6 h-6" />
                                                ) : (
                                                    <ClipboardList className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[#1C1C1E] dark:text-white mb-1 group-hover:text-[#007AFF] transition-colors">{survey.title}</h3>
                                                <div className="flex items-center gap-2 text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                                                    <span>{new Date(survey.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    {survey.description && (
                                                        <>
                                                            <span className="opacity-30">•</span>
                                                            <span className="truncate max-w-[200px]">{survey.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:block text-right">
                                                <p className="text-xl font-bold text-[#1C1C1E] dark:text-white leading-none mb-1">{survey.response_count}</p>
                                                <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">Responses</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${survey.status === 'active'
                                                    ? 'bg-[#34C759]/10 text-[#34C759]'
                                                    : 'bg-[#AEAEB2]/10 text-[#AEAEB2]'
                                                    }`}>
                                                    {survey.status}
                                                </span>

                                                {/* Action Menu - SwiftUI style dot button */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionMenuSurvey(actionMenuSurvey === survey.id ? null : survey.id);
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-[#8E8E93]" />
                                                    </button>

                                                    {actionMenuSurvey === survey.id && (
                                                        <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[16px] shadow-2xl border border-gray-100 dark:border-white/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={() => handleViewResponses(survey)}
                                                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-[#007AFF] hover:text-white flex items-center gap-3 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Analyze Feedback
                                                            </button>

                                                            {survey.response_count === 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingSurveyId(survey.id);
                                                                        setFormData({
                                                                            title: survey.title,
                                                                            description: survey.description || '',
                                                                            target_role: 'teacher',
                                                                            context: ''
                                                                        });
                                                                        if (survey.questions) {
                                                                            setQuestions(survey.questions);
                                                                        }
                                                                        setActiveTab('create');
                                                                        setCurrentStep(2);
                                                                        setActionMenuSurvey(null);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Edit className="w-4 h-4 text-[#007AFF]" />
                                                                    Modify Survey
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    setEditingSurveyId(survey.id);
                                                                    setFormData({
                                                                        title: survey.title,
                                                                        description: survey.description || '',
                                                                        target_role: 'teacher',
                                                                        context: ''
                                                                    });
                                                                    if (survey.questions) {
                                                                        setQuestions(survey.questions);
                                                                    }
                                                                    setActiveTab('create');
                                                                    setCurrentStep(3);
                                                                    setActionMenuSurvey(null);
                                                                }}
                                                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <UserPlus className="w-4 h-4 text-[#5856D6]" />
                                                                Update Assignees
                                                            </button>

                                                            {survey.response_count === 0 && (
                                                                <button
                                                                    onClick={() => handleDeleteSurvey(survey.id)}
                                                                    disabled={deleting}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-[#FF3B30] hover:text-white flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-white/5"
                                                                >
                                                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-[#FF3B30] group-hover:text-white" />}
                                                                    Retire Survey
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'responses' && viewingSurvey && (
                <div className="space-y-8 animate-fade-in">
                    {/* Responses Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
                        <button
                            onClick={closeViewingSurvey}
                            className="w-fit flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2F2F7] dark:bg-white/5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-all font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Repository
                        </button>
                        <h2 className="text-2xl font-semibold text-[#1C1C1E] dark:text-white truncate">
                            {viewingSurvey.title}
                        </h2>
                    </div>

                    {loadingResponses ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-20 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-brand animate-spin" />
                            <p className="text-gray-500 animate-pulse">Fetching latest responses...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Summary and List */}
                            <div className="lg:col-span-2 space-y-6 no-print">
                                {/* Analytics Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="card p-6 border-l-4 border-l-[#007AFF]">
                                        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Total Responses</p>
                                        <h4 className="text-3xl font-semibold text-[#1C1C1E] dark:text-white">{surveyResponses.length}</h4>
                                    </div>
                                    {calculateAnalytics()?.ratingStats.map((stat, idx) => (
                                        <div key={idx} className="card p-6 border-l-4 border-l-[#34C759]">
                                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1 truncate" title={stat.question}>
                                                Performance: {stat.question}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <h4 className="text-3xl font-semibold text-[#1C1C1E] dark:text-white">{stat.average}</h4>
                                                <span className="text-[#8E8E93] text-sm font-medium">/ 5.0</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Responders Table */}
                                <div className="card-highlight overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-white/5">
                                        <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider">Stakeholder feedback</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#F2F2F7] dark:bg-white/5 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Respondent</th>
                                                    <th className="px-6 py-4">Timeline</th>
                                                    <th className="px-6 py-4 text-right">View</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                                                {surveyResponses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center text-[#8E8E93] font-medium">
                                                            Awaiting first response...
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    surveyResponses.map((response) => (
                                                        <tr
                                                            key={response.id}
                                                            className={`hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-colors cursor-pointer group ${selectedResponseId === response.id ? 'bg-[#007AFF]/5 dark:bg-[#007AFF]/10' : ''}`}
                                                            onClick={() => setSelectedResponseId(response.id)}
                                                        >
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-bold">
                                                                        {response.user_name?.charAt(0) || 'A'}
                                                                    </div>
                                                                    <span className="font-semibold text-[#1C1C1E] dark:text-white">
                                                                        {response.user_name || 'Anonymous'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-sm font-medium text-[#8E8E93]">
                                                                {new Date(response.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${selectedResponseId === response.id
                                                                    ? 'bg-[#007AFF] text-white'
                                                                    : 'bg-[#F2F2F7] dark:bg-white/10 text-[#8E8E93] group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF]'}`}>
                                                                    <Eye className="w-4 h-4" />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Individual Detail View */}
                            <div className="lg:col-span-1 print-full-width">
                                <div className="card-highlight flex flex-col sticky top-6 max-h-[calc(100vh-140px)] print:shadow-none print:bg-white overflow-hidden">
                                    <div className="p-6 border-b border-[#E5E5EA] dark:border-white/5 bg-[#F2F2F7] dark:bg-white/5">
                                        <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider">Analysis Inspector</h3>
                                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase mt-1">Deep dive into specific feedback</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                        {!selectedResponseId ? (
                                            <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#8E8E93] flex items-center justify-center mb-4">
                                                    <FileText className="w-10 h-10 text-[#8E8E93]" />
                                                </div>
                                                <p className="text-sm text-[#8E8E93] font-medium text-center">Select a respondent to <br />inspect their input</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                {/* Print-Only Header */}
                                                <div className="hidden print:block mb-10 border-b-2 border-[#007AFF] pb-6">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h2 className="text-3xl font-bold text-[#007AFF]">Report Analysis</h2>
                                                            <p className="text-[#8E8E93] font-medium">{viewingSurvey.title}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Generated On</p>
                                                            <p className="font-semibold text-[#1C1C1E]">{new Date().toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 p-5 rounded-[20px] bg-[#007AFF]/5 dark:bg-[#007AFF]/10 border border-[#007AFF]/10 print:bg-white print:border-gray-200">
                                                    <div className="w-12 h-12 rounded-[14px] bg-[#007AFF] text-white flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#1C1C1E] dark:text-white">
                                                            {surveyResponses.find(r => r.id === selectedResponseId)?.user_name || 'Anonymous'}
                                                        </h4>
                                                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">
                                                            {new Date(surveyResponses.find(r => r.id === selectedResponseId)?.submitted_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    {surveyResponses.find(r => r.id === selectedResponseId)?.answers.map((answer: any, aIdx: number) => (
                                                        <div key={aIdx} className="space-y-3">
                                                            <div className="flex items-center justify-between px-1">
                                                                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                                                                    Query {answer.question_index + 1}
                                                                </span>
                                                                {viewingSurvey.questions?.[answer.question_index]?.type === 'rating' && (
                                                                    <div className="flex gap-1">
                                                                        {[1, 2, 3, 4, 5].map(star => (
                                                                            <div key={star} className={`w-1.5 h-1.5 rounded-full ${star <= parseInt(answer.answer) ? 'bg-[#34C759]' : 'bg-[#E5E5EA] dark:bg-white/10'}`} />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-5 rounded-[18px] bg-[#F2F2F7] dark:bg-white/5 border border-transparent dark:border-white/5 group hover:border-[#007AFF]/30 transition-all">
                                                                <p className="text-[11px] font-semibold text-[#8E8E93] mb-3 leading-snug">
                                                                    {viewingSurvey.questions?.[answer.question_index]?.question || `Question ${answer.question_index + 1}`}
                                                                </p>
                                                                <p className="text-[#1C1C1E] dark:text-white text-sm font-medium leading-relaxed">
                                                                    {answer.answer || 'No response provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {selectedResponseId && (
                                        <div className="p-6 bg-[#F2F2F7] dark:bg-white/5 border-t border-[#E5E5EA] dark:border-white/5 no-print">
                                            <button
                                                onClick={() => window.print()}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/10 text-[#1C1C1E] dark:text-white font-bold text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                <Download className="w-5 h-5 text-[#007AFF]" />
                                                Generate PDF Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
