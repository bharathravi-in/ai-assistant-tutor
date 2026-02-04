import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Clock,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    BookOpen,
    Zap,
    BookMarked,
    Loader2,
    User,
    Calendar,
    Tag,
    GraduationCap,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Play,
    CheckCircle,
    Bot
} from 'lucide-react'
import { contentApi } from '../../services/api'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

// Content type icons
const contentTypeIcons: Record<string, any> = {
    lesson_plan: FileText,
    explanation: BookOpen,
    activity: Activity,
    tlm: Palette,
    quick_reference: Zap,
    assessment: ClipboardCheck,
    worksheet: FileSpreadsheet,
    study_guide: BookMarked,
}

const contentTypeLabels: Record<string, string> = {
    lesson_plan: 'Lesson Plan',
    explanation: 'Topic Explanation',
    activity: 'Activity',
    tlm: 'TLM',
    quick_reference: 'Quick Reference',
    assessment: 'Assessment',
    worksheet: 'Worksheet',
    study_guide: 'Study Guide',
}

// Section type styling
const sectionTypeStyles: Record<string, { bg: string; text: string; border: string }> = {
    'objective': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
    'engage': { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
    'explore': { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
    'explain': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
    'elaborate': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
    'evaluate': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
    'activity': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
    'materials': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
    'assessment': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
    'default': { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' },
}

interface ContentSection {
    id: string
    title: string
    content: string
    type: string
}

export default function ContentPreview() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [sections, setSections] = useState<ContentSection[]>([])
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['section-0']))

    useEffect(() => {
        if (id) {
            loadContent(parseInt(id))
        }
    }, [id])

    // Parse markdown into sections
    const parseContentToSections = (markdown: string): ContentSection[] => {
        if (!markdown) return []

        const lines = markdown.split('\n')
        const parsedSections: ContentSection[] = []
        let currentSection: ContentSection | null = null
        let contentLines: string[] = []

        const determineSectionType = (title: string): string => {
            const lowerTitle = title.toLowerCase()
            if (lowerTitle.includes('objective') || lowerTitle.includes('learning')) return 'objective'
            if (lowerTitle.includes('engage') || lowerTitle.includes('hook')) return 'engage'
            if (lowerTitle.includes('explore') || lowerTitle.includes('investigate')) return 'explore'
            if (lowerTitle.includes('explain') || lowerTitle.includes('concept')) return 'explain'
            if (lowerTitle.includes('elaborate') || lowerTitle.includes('extend')) return 'elaborate'
            if (lowerTitle.includes('evaluate') || lowerTitle.includes('assess')) return 'evaluate'
            if (lowerTitle.includes('activity') || lowerTitle.includes('exercise')) return 'activity'
            if (lowerTitle.includes('material') || lowerTitle.includes('resource')) return 'materials'
            if (lowerTitle.includes('assessment') || lowerTitle.includes('quiz')) return 'assessment'
            return 'default'
        }

        lines.forEach((line, index) => {
            // Check for heading (## or #)
            const h2Match = line.match(/^##\s+(.+)/)
            const h1Match = line.match(/^#\s+(.+)/)

            if (h2Match || h1Match) {
                // Save previous section if exists
                if (currentSection) {
                    currentSection.content = contentLines.join('\n').trim()
                    if (currentSection.content) {
                        parsedSections.push(currentSection)
                    }
                }

                const title = (h2Match?.[1] || h1Match?.[1] || '').trim()
                currentSection = {
                    id: `section-${parsedSections.length}`,
                    title,
                    content: '',
                    type: determineSectionType(title)
                }
                contentLines = []
            } else {
                contentLines.push(line)
            }
        })

        // Save last section
        if (currentSection) {
            currentSection.content = contentLines.join('\n').trim()
            if (currentSection.content) {
                parsedSections.push(currentSection)
            }
        }

        // If no sections found, create one with full content
        if (parsedSections.length === 0 && markdown.trim()) {
            parsedSections.push({
                id: 'section-0',
                title: 'Content',
                content: markdown,
                type: 'default'
            })
        }

        return parsedSections
    }

    const loadContent = async (contentId: number) => {
        try {
            const data = await contentApi.getById(contentId)
            setContent(data)
            const parsedSections = parseContentToSections(data.description)
            setSections(parsedSections)
            // Expand first section by default
            if (parsedSections.length > 0) {
                setExpandedSections(new Set([parsedSections[0].id]))
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load content')
        } finally {
            setLoading(false)
        }
    }

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId)
            } else {
                newSet.add(sectionId)
            }
            return newSet
        })
    }

    const expandAll = () => {
        setExpandedSections(new Set(sections.map(s => s.id)))
    }

    const collapseAll = () => {
        setExpandedSections(new Set())
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error || !content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Content</h2>
                <p className="text-gray-500 mb-6">{error || 'Content not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Go Back
                </button>
            </div>
        )
    }

    const TypeIcon = contentTypeIcons[content.content_type] || FileText

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Content Preview
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Read-only view of your submitted content
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                Pending Review
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <TypeIcon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        {contentTypeLabels[content.content_type] || content.content_type}
                                    </span>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {content.title}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Section Controls */}
                        {sections.length > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {sections.length} sections
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={expandAll}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Expand All
                                    </button>
                                    <button
                                        onClick={collapseAll}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Collapse All
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Accordion Sections */}
                        <div className="space-y-3">
                            {sections.map((section, index) => {
                                const isExpanded = expandedSections.has(section.id)
                                const styles = sectionTypeStyles[section.type] || sectionTypeStyles.default

                                return (
                                    <div
                                        key={section.id}
                                        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 ${isExpanded
                                                ? 'border-blue-200 dark:border-blue-700 shadow-md'
                                                : 'border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        {/* Section Header */}
                                        <button
                                            onClick={() => toggleSection(section.id)}
                                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-xl ${styles.bg} ${styles.border} border flex items-center justify-center flex-shrink-0`}>
                                                <span className={`text-sm font-bold ${styles.text}`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} ${styles.border} border`}>
                                                        {section.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                    {section.title}
                                                </h3>
                                            </div>
                                            <div className={`p-2 rounded-lg transition-colors ${isExpanded
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                }`}>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Section Content */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                                                <div className="pt-4 prose prose-sm dark:prose-invert max-w-none">
                                                    <MarkdownRenderer content={section.content} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* PDF Preview (if available) */}
                        {content.pdf_url && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-red-500" />
                                        PDF Document
                                    </h3>
                                </div>
                                <iframe
                                    src={`${content.pdf_url}#toolbar=0&navpanes=0`}
                                    className="w-full h-[600px] border-none"
                                    title="PDF Preview"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Metadata */}
                    <div className="space-y-6">
                        {/* Metadata Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Details</h3>

                            {content.grade && (
                                <div className="flex items-center gap-3 text-sm">
                                    <GraduationCap className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">Class {content.grade}</span>
                                </div>
                            )}

                            {content.subject && (
                                <div className="flex items-center gap-3 text-sm">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{content.subject}</span>
                                </div>
                            )}

                            {content.topic && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Tag className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Topic:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{content.topic}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400">Author:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{content.author_name || 'You'}</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{formatDate(content.created_at)}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {content.tags && content.tags.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {content.tags.map((tag: string) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progress Indicator */}
                        {sections.length > 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sections</h3>
                                <div className="space-y-2">
                                    {sections.map((section, index) => {
                                        const isExpanded = expandedSections.has(section.id)
                                        const styles = sectionTypeStyles[section.type] || sectionTypeStyles.default

                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => {
                                                    setExpandedSections(new Set([section.id]))
                                                    // Scroll to section
                                                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${isExpanded
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                    }`}
                                            >
                                                <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${styles.bg} ${styles.text}`}>
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm truncate">{section.title}</span>
                                                {isExpanded && <CheckCircle className="w-4 h-4 ml-auto text-blue-500" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Status Info */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                                        Under Review
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                        Your content is being reviewed by CRP/ARP. You will be notified once it's approved or if changes are needed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
