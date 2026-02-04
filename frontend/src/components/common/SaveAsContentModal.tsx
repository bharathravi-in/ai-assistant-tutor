import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BookPlus,
    Loader2,
    CheckCircle,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    Send,
    X,
    FileDown,
    Search,
    BookOpen,
    Lightbulb,
    Download,
    Share2,
    Bot
} from 'lucide-react'
import { contentApi } from '../../services/api'

interface SaveAsContentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void  // Callback when content is saved successfully
    aiResponse: {
        content: string
        structured?: any
        mode?: string
    }
    originalQuery: string
    grade?: number
    subject?: string
    topic?: string
}

const contentTypeOptions = [
    {
        value: 'lesson_plan',
        label: 'Lesson Plan',
        icon: FileText,
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        description: 'Complete lesson with objectives, activities & assessments'
    },
    {
        value: 'explanation',
        label: 'Topic Explanation',
        icon: BookOpen,
        color: 'emerald',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        description: 'Detailed concept explanation with examples'
    },
    {
        value: 'activity',
        label: 'Classroom Activity',
        icon: Activity,
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        description: 'Interactive classroom or group activity'
    },
    {
        value: 'tlm',
        label: 'Teaching Aid (TLM)',
        icon: Palette,
        color: 'pink',
        bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        textColor: 'text-pink-600 dark:text-pink-400',
        description: 'Visual or DIY teaching material instructions'
    },
    {
        value: 'quick_reference',
        label: 'Quick Reference',
        icon: Lightbulb,
        color: 'amber',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-600 dark:text-amber-400',
        description: 'Summary card for quick classroom reference'
    },
    {
        value: 'assessment',
        label: 'Assessment',
        icon: ClipboardCheck,
        color: 'purple',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        description: 'Quiz, test, or evaluation questions'
    },
    {
        value: 'worksheet',
        label: 'Worksheet',
        icon: FileSpreadsheet,
        color: 'orange',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-600 dark:text-orange-400',
        description: 'Practice worksheet for students'
    },
    {
        value: 'study_guide',
        label: 'Study Guide',
        icon: BookPlus,
        color: 'indigo',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        description: 'Comprehensive study material for students'
    },
]

export default function SaveAsContentModal({
    isOpen,
    onClose,
    onSuccess,
    aiResponse,
    originalQuery,
    grade,
    subject,
    topic
}: SaveAsContentModalProps) {
    const navigate = useNavigate()
    const [step, setStep] = useState<'type' | 'details' | 'processing' | 'success'>('type')
    const [selectedType, setSelectedType] = useState<string>('')
    const [title, setTitle] = useState(originalQuery || '')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [submitForReview, setSubmitForReview] = useState(true)
    const [generatePdf, setGeneratePdf] = useState(true)
    const [enableSearch, setEnableSearch] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [savedContentId, setSavedContentId] = useState<number | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    if (!isOpen) return null

    const handleTypeSelect = (type: string) => {
        setSelectedType(type)

        // Auto-generate title based on mode and type
        const typeLabel = contentTypeOptions.find(t => t.value === type)?.label || type
        const autoTitle = `${originalQuery} - ${typeLabel}`
        setTitle(autoTitle.substring(0, 100))

        // Auto-generate description based on AI response
        let autoDescription = ''
        if (aiResponse.structured) {
            autoDescription = aiResponse.structured.simple_explanation ||
                aiResponse.structured.conceptual_briefing ||
                aiResponse.structured.understanding ||
                aiResponse.structured.description || ''
        }
        if (!autoDescription && aiResponse.content) {
            // Take first 500 chars of content
            autoDescription = aiResponse.content.substring(0, 500)
        }
        if (!autoDescription) {
            autoDescription = `AI-generated ${typeLabel.toLowerCase()} for: ${originalQuery}`
        }
        setDescription(autoDescription.substring(0, 500))

        // Auto-suggest tags based on context
        const suggestedTags = []
        if (grade) suggestedTags.push(`Class ${grade}`)
        if (subject) suggestedTags.push(subject)
        if (aiResponse.mode) {
            const modeMap: { [key: string]: string } = {
                'explain': 'Explanation',
                'assist': 'Classroom Help',
                'plan': 'Lesson Plan'
            }
            suggestedTags.push(modeMap[aiResponse.mode] || aiResponse.mode)
        }
        suggestedTags.push('AI-Generated')
        suggestedTags.push(typeLabel)
        setTags(suggestedTags)

        setStep('details')
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Please provide a title')
            return
        }

        setSaving(true)
        setError('')
        setStep('processing')

        try {
            // Prepare content JSON from AI response
            const contentJson = {
                original_query: originalQuery,
                ai_response: aiResponse.content,
                structured_data: aiResponse.structured,
                generation_mode: aiResponse.mode,
                generated_at: new Date().toISOString()
            }

            // Create the content with PDF generation and vectorization
            // Ensure description is never empty (backend requires min_length=1)
            const finalDescription = description.trim() || `AI-generated ${contentTypeOptions.find(t => t.value === selectedType)?.label || 'content'} for: ${originalQuery}`

            const result = await contentApi.create({
                title: title.trim(),
                content_type: selectedType,
                description: finalDescription,
                content_json: contentJson,
                grade: grade,
                subject: subject,
                topic: topic || originalQuery,
                tags: tags,
                generate_pdf: generatePdf,
                vectorize: enableSearch
            })

            setSavedContentId(result.id)

            // If user wants to submit for review immediately
            if (submitForReview) {
                await contentApi.submit(result.id)
            }

            // Wait a moment for PDF generation to complete
            if (generatePdf) {
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Try to get PDF URL
                try {
                    const pdfResult = await contentApi.getPdf(result.id)
                    if (pdfResult?.pdf_url) {
                        setPdfUrl(pdfResult.pdf_url)
                    }
                } catch {
                    // PDF might still be processing
                    console.log('PDF still processing...')
                }
            }

            setStep('success')
            // Notify parent that content was saved successfully
            if (onSuccess) {
                onSuccess()
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save content. Please try again.')
            setStep('details')
        } finally {
            setSaving(false)
        }
    }

    const handleViewContent = () => {
        if (savedContentId) {
            navigate(`/teacher/content/edit/${savedContentId}`)
        }
        onClose()
    }

    const handleDownloadPdf = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank')
        } else if (savedContentId) {
            // Trigger PDF download
            contentApi.getPdf(savedContentId).then(result => {
                if (result?.pdf_url) {
                    window.open(result.pdf_url, '_blank')
                }
            })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <BookPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Save as Content</h3>
                            <p className="text-xs text-gray-500">Create a shareable resource from AI response</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'type' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                What type of content would you like to create? Select the most appropriate format.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {contentTypeOptions.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeSelect(type.value)}
                                        className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${type.bgColor} flex items-center justify-center ${type.textColor} flex-shrink-0`}>
                                            <type.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{type.label}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{type.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'details' && (
                        <div className="space-y-4">
                            {/* Selected Type Badge */}
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                {(() => {
                                    const selectedTypeObj = contentTypeOptions.find(t => t.value === selectedType)
                                    const Icon = selectedTypeObj?.icon || FileText
                                    return (
                                        <>
                                            <div className={`w-8 h-8 rounded-lg ${selectedTypeObj?.bgColor} flex items-center justify-center ${selectedTypeObj?.textColor}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                Creating: {selectedTypeObj?.label}
                                            </span>
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a descriptive title"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of this content"
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-blue-900"
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
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        placeholder="Add a tag"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Options */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-amber-500" />
                                    Enhanced Features
                                </h4>

                                {/* Generate PDF Option */}
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="generatePdf"
                                        checked={generatePdf}
                                        onChange={(e) => setGeneratePdf(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                                    />
                                    <label htmlFor="generatePdf" className="flex-1 cursor-pointer">
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                            <FileDown className="w-4 h-4 text-green-600" />
                                            Generate Downloadable PDF
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Create a professional PDF document stored in cloud
                                        </span>
                                    </label>
                                </div>

                                {/* Enable Search Option */}
                                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="enableSearch"
                                        checked={enableSearch}
                                        onChange={(e) => setEnableSearch(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                                    />
                                    <label htmlFor="enableSearch" className="flex-1 cursor-pointer">
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                            <Search className="w-4 h-4 text-purple-600" />
                                            Enable AI-Powered Search
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Index content for semantic search in Content Library
                                        </span>
                                    </label>
                                </div>

                                {/* Submit for Review Option */}
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="submitForReview"
                                        checked={submitForReview}
                                        onChange={(e) => setSubmitForReview(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                    />
                                    <label htmlFor="submitForReview" className="flex-1 cursor-pointer">
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                            <Send className="w-4 h-4 text-yellow-600" />
                                            Submit for CRP/ARP Approval
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Content will be reviewed before publishing to library
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                Creating Your Content...
                            </h4>
                            <div className="space-y-2 text-sm text-gray-500">
                                <p>📝 Saving content to database...</p>
                                {generatePdf && <p>📄 Generating professional PDF...</p>}
                                {enableSearch && <p>🔍 Indexing for AI-powered search...</p>}
                                {submitForReview && <p>📤 Submitting for review...</p>}
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Content Created Successfully!
                            </h4>
                            <p className="text-gray-500 mb-6">
                                {submitForReview
                                    ? 'Your content has been submitted for review. You will be notified once approved.'
                                    : 'Your content has been saved as a draft.'}
                            </p>

                            {/* Features Summary */}
                            <div className="flex justify-center gap-4 mb-6">
                                {generatePdf && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                                        <FileDown className="w-4 h-4" />
                                        PDF Ready
                                    </div>
                                )}
                                {enableSearch && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                        <Search className="w-4 h-4" />
                                        Searchable
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-center flex-wrap">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Close
                                </button>
                                {generatePdf && (
                                    <button
                                        onClick={handleDownloadPdf}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </button>
                                )}
                                <button
                                    onClick={handleViewContent}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
                                >
                                    <Share2 className="w-4 h-4" />
                                    View & Share
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'details' && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between flex-shrink-0">
                        <button
                            onClick={() => setStep('type')}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !title.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Bot className="w-4 h-4" />
                                    Create Content
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
