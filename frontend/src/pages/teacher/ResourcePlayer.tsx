import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Video,
    FileText,
    BookOpen,
    GraduationCap,
    Clock,
    CheckCircle,
    Bookmark,
    BookmarkCheck,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Download,
    Share2,
    ThumbsUp,
    Loader2
} from 'lucide-react'
import { resourcesApi } from '../../services/api'

interface Resource {
    id: number
    title: string
    description: string | null
    type: string
    category: string
    grade: string | null
    subject: string | null
    duration: string | null
    content_url: string | null
    is_bookmarked: boolean
    is_completed: boolean
    progress_percent: number
}

// Mock content for different resource types
const getResourceContent = (resource: Resource) => {
    const baseContent = {
        introduction: `Welcome to this resource on ${resource.title}. This comprehensive guide will help you understand and implement effective strategies in your classroom.`,
        sections: [
            {
                title: 'Introduction',
                content: `Understanding ${resource.title.toLowerCase()} is essential for effective teaching. This section covers the fundamental concepts and why they matter in today's classroom environment.`
            },
            {
                title: 'Key Concepts',
                content: `Let's explore the core principles:\n\n• Active Engagement: Keep students involved through questioning and discussion\n• Differentiated Instruction: Adapt your approach to meet diverse learning needs\n• Formative Assessment: Regularly check for understanding\n• Collaborative Learning: Foster peer-to-peer interaction`
            },
            {
                title: 'Implementation Guide',
                content: `Follow these steps to implement in your classroom:\n\n1. Start with a clear learning objective\n2. Prepare materials and resources in advance\n3. Create an engaging hook activity\n4. Deliver content in manageable chunks\n5. Include practice activities\n6. Provide feedback and assessment`
            },
            {
                title: 'Practical Examples',
                content: `Here are some real-world examples:\n\nExample 1: A Class 5 science teacher uses hands-on experiments to teach about plant growth\n\nExample 2: A mathematics teacher uses manipulatives to explain fractions\n\nExample 3: An English teacher incorporates storytelling to improve vocabulary`
            },
            {
                title: 'Tips for Success',
                content: `Remember these key tips:\n\n• Always connect new learning to prior knowledge\n• Use visual aids and concrete examples\n• Allow time for student questions\n• Celebrate small victories\n• Reflect on what works and adjust accordingly`
            }
        ],
        summary: `You've completed learning about ${resource.title}. Apply these concepts in your next class and reflect on the outcomes.`
    }
    return baseContent
}

export default function ResourcePlayer() {
    const location = useLocation()
    const navigate = useNavigate()
    const resource = location.state?.resource as Resource | undefined

    const [currentSection, setCurrentSection] = useState(0)
    const [isBookmarked, setIsBookmarked] = useState(resource?.is_bookmarked || false)
    const [isCompleted, setIsCompleted] = useState(resource?.is_completed || false)
    const [progress, setProgress] = useState(resource?.progress_percent || 0)
    const [loading, setLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const content = resource ? getResourceContent(resource) : null
    const totalSections = content?.sections.length || 0

    useEffect(() => {
        if (!resource) {
            navigate('/teacher/resources')
            return
        }

        // Update progress based on section
        const newProgress = Math.round(((currentSection + 1) / (totalSections + 2)) * 100) // +2 for intro and summary
        setProgress(newProgress)

        // Track progress in backend
        resourcesApi.updateProgress(resource.id, { progress_percent: newProgress }).catch(console.error)
    }, [currentSection, resource, navigate, totalSections])

    if (!resource || !content) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return Video
            case 'document': return FileText
            case 'guide': return BookOpen
            case 'activity': return GraduationCap
            default: return FileText
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'video': return 'bg-red-500'
            case 'document': return 'bg-blue-500'
            case 'guide': return 'bg-green-500'
            case 'activity': return 'bg-purple-500'
            default: return 'bg-gray-500'
        }
    }

    const TypeIcon = getTypeIcon(resource.type)

    const toggleBookmark = async () => {
        try {
            if (isBookmarked) {
                await resourcesApi.removeBookmark(resource.id)
            } else {
                await resourcesApi.bookmarkResource(resource.id)
            }
            setIsBookmarked(!isBookmarked)
        } catch (err) {
            console.error('Failed to toggle bookmark:', err)
        }
    }

    const markComplete = async () => {
        setLoading(true)
        try {
            await resourcesApi.updateProgress(resource.id, { is_completed: true })
            setIsCompleted(true)
            setProgress(100)
        } catch (err) {
            console.error('Failed to mark complete:', err)
        } finally {
            setLoading(false)
        }
    }

    const goToNextSection = () => {
        if (currentSection < totalSections + 1) { // +1 for summary
            setCurrentSection(currentSection + 1)
        }
    }

    const goToPrevSection = () => {
        if (currentSection > 0) {
            setCurrentSection(currentSection - 1)
        }
    }

    const renderVideoPlayer = () => (
        <div className="bg-black rounded-xl aspect-video relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                    <div className={`w-20 h-20 rounded-full ${getTypeColor(resource.type)} flex items-center justify-center mx-auto mb-4`}>
                        <Video className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-white font-medium">{resource.title}</p>
                    <p className="text-gray-400 text-sm mt-1">Video Content</p>
                </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 text-gray-900" /> : <Play className="w-5 h-5 text-gray-900 ml-1" />}
                    </button>

                    <div className="flex-1 bg-white/30 rounded-full h-1">
                        <div className="bg-white h-1 rounded-full" style={{ width: `${progress}%` }} />
                    </div>

                    <span className="text-white text-sm">{resource.duration || '15:00'}</span>

                    <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-gray-300">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <button className="text-white hover:text-gray-300">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )

    const renderDocumentViewer = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className={`h-16 ${getTypeColor(resource.type)} flex items-center justify-between px-6`}>
                <div className="flex items-center gap-3 text-white">
                    <FileText className="w-6 h-6" />
                    <span className="font-medium">Document Viewer</span>
                </div>
                <button className="text-white/80 hover:text-white flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    Download
                </button>
            </div>
            <div className="p-6 min-h-[400px]">
                <div className="prose dark:prose-invert max-w-none">
                    {currentSection === 0 && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
                            <p className="text-gray-600 dark:text-gray-400">{content.introduction}</p>
                        </>
                    )}
                    {currentSection > 0 && currentSection <= totalSections && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {content.sections[currentSection - 1].title}
                            </h2>
                            <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {content.sections[currentSection - 1].content}
                            </div>
                        </>
                    )}
                    {currentSection === totalSections + 1 && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Summary</h2>
                            <p className="text-gray-600 dark:text-gray-400">{content.summary}</p>
                            <div className="mt-6 p-4 bg-secondary-50 dark:bg-secondary-900/30 rounded-xl">
                                <div className="flex items-center gap-2 text-secondary-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Congratulations! You've completed this resource.</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    const renderActivityView = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className={`h-16 ${getTypeColor(resource.type)} flex items-center justify-between px-6`}>
                <div className="flex items-center gap-3 text-white">
                    <GraduationCap className="w-6 h-6" />
                    <span className="font-medium">Interactive Activity</span>
                </div>
            </div>
            <div className="p-6">
                {renderDocumentViewer()}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/teacher/resources')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${getTypeColor(resource.type)} flex items-center justify-center`}>
                                <TypeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{resource.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{resource.grade || 'All Grades'}</span>
                                    <span>•</span>
                                    <span>{resource.subject || 'General'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleBookmark}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isBookmarked ? (
                                <BookmarkCheck className="w-5 h-5 text-warning-500" />
                            ) : (
                                <Bookmark className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Share2 className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-700">
                    <div
                        className="h-1 bg-primary-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Resource Type Specific Player */}
                <div className="mb-6">
                    {resource.type === 'video' && renderVideoPlayer()}
                    {resource.type === 'document' && renderDocumentViewer()}
                    {resource.type === 'guide' && renderDocumentViewer()}
                    {resource.type === 'activity' && renderActivityView()}
                </div>

                {/* Section Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goToPrevSection}
                            disabled={currentSection === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-2">
                            {[-1, ...content.sections.map((_, i) => i), totalSections].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSection(idx + 1)}
                                    className={`w-3 h-3 rounded-full transition-colors ${currentSection === idx + 1
                                            ? 'bg-primary-500'
                                            : currentSection > idx + 1
                                                ? 'bg-secondary-500'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={goToNextSection}
                            disabled={currentSection === totalSections + 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {currentSection === totalSections + 1 ? 'Completed' : 'Next'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Completion Card */}
                {currentSection === totalSections + 1 && !isCompleted && (
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                        <h3 className="text-xl font-bold mb-2">Ready to Complete?</h3>
                        <p className="text-white/80 mb-4">Mark this resource as completed to track your progress</p>
                        <button
                            onClick={markComplete}
                            disabled={loading}
                            className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                            ) : (
                                <><ThumbsUp className="w-5 h-5" /> Mark as Completed</>
                            )}
                        </button>
                    </div>
                )}

                {/* Already Completed */}
                {isCompleted && (
                    <div className="bg-secondary-50 dark:bg-secondary-900/30 rounded-xl p-6 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-secondary-500" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Resource Completed!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Great job! You've completed this learning resource.</p>
                        <button
                            onClick={() => navigate('/teacher/resources')}
                            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                        >
                            Explore More Resources
                        </button>
                    </div>
                )}

                {/* Learning Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{resource.duration || '15 min'}</p>
                        <p className="text-xs text-gray-500">Duration</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                        <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{currentSection + 1}/{totalSections + 2}</p>
                        <p className="text-xs text-gray-500">Sections</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{progress}%</p>
                        <p className="text-xs text-gray-500">Progress</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
