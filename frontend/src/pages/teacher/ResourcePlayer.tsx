import { useState, useEffect, useRef } from 'react'
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
    Download,
    Share2,
    Send,
    Sparkles,
    MessageSquare,
    Loader2,
    User,
    ChevronDown,
    ExternalLink,
    Play
} from 'lucide-react'
import { resourcesApi, storageApi } from '../../services/api'
import SparkleAssistant from '../../components/common/SparkleAssistant'
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
    thumbnail_url: string | null
    is_bookmarked: boolean
    is_completed: boolean
    progress_percent: number
}

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

// Helper to extract GCS path from URL
const extractGcsPath = (url: string): string | null => {
    const match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/)
    return match ? match[1] : null
}

// Helper to get file extension
const getFileExtension = (url: string): string => {
    const path = url.split('?')[0]
    const ext = path.split('.').pop()?.toLowerCase() || ''
    return ext
}

// Parse duration string like "15 min" to seconds
const parseDuration = (duration: string | null): number => {
    if (!duration) return 600 // Default 10 minutes
    const match = duration.match(/(\d+)\s*(min|m|sec|s|hr|h)?/i)
    if (!match) return 600
    const value = parseInt(match[1])
    const unit = (match[2] || 'min').toLowerCase()
    if (unit.startsWith('h')) return value * 3600
    if (unit.startsWith('s')) return value
    return value * 60 // minutes
}

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function ResourcePlayer() {
    const location = useLocation()
    const navigate = useNavigate()
    const resource = location.state?.resource as Resource | undefined
    const chatEndRef = useRef<HTMLDivElement>(null)
    const progressSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null)

    const [isBookmarked, setIsBookmarked] = useState(resource?.is_bookmarked || false)
    const [isCompleted, setIsCompleted] = useState(resource?.is_completed || false)
    const [showAbout, setShowAbout] = useState(true)
    const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary')

    // Signed URL State
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [loadingSignedUrl, setLoadingSignedUrl] = useState(false)

    // Progress Tracking State
    const [viewedSeconds, setViewedSeconds] = useState(0)
    const [progress, setProgress] = useState(resource?.progress_percent || 0)
    const estimatedDuration = parseDuration(resource?.duration || null)

    // AI Summary State
    const [aiSummary, setAiSummary] = useState<string | null>(null)
    const [loadingSummary, setLoadingSummary] = useState(false)

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [loadingChat, setLoadingChat] = useState(false)

    // Sparkle Assistant State
    const [showSparkleAssistant, setShowSparkleAssistant] = useState(false)

    // Initialize on mount
    useEffect(() => {
        if (!resource) {
            navigate('/teacher/resources')
            return
        }

        // Initialize viewed seconds from existing progress
        const initialSeconds = Math.floor((resource.progress_percent / 100) * estimatedDuration)
        setViewedSeconds(initialSeconds)

        fetchSignedUrl()
        generateAISummary()

        return () => {
            // Cleanup timer on unmount
            if (progressSaveTimer.current) {
                clearInterval(progressSaveTimer.current)
            }
        }
    }, [resource, navigate])

    // Auto progress tracking - increment every second
    useEffect(() => {
        if (!resource || isCompleted) return

        const timer = setInterval(() => {
            setViewedSeconds(prev => {
                const newSeconds = prev + 1
                const newProgress = Math.min(100, Math.round((newSeconds / estimatedDuration) * 100))
                setProgress(newProgress)

                // Auto-complete when reaching 100%
                if (newProgress >= 100 && !isCompleted) {
                    markComplete()
                }

                return newSeconds
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [resource, isCompleted, estimatedDuration])

    // Save progress to backend every 30 seconds
    useEffect(() => {
        if (!resource) return

        progressSaveTimer.current = setInterval(() => {
            if (progress > 0 && !isCompleted) {
                resourcesApi.updateProgress(resource.id, { progress_percent: progress }).catch(console.error)
            }
        }, 30000)

        return () => {
            if (progressSaveTimer.current) {
                clearInterval(progressSaveTimer.current)
            }
        }
    }, [resource, progress, isCompleted])

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    const fetchSignedUrl = async () => {
        if (!resource?.content_url) return

        const contentUrl = resource.content_url
        const isGcsUrl = contentUrl.includes('storage.googleapis.com')

        if (!isGcsUrl) {
            setSignedUrl(contentUrl)
            return
        }

        const gcsPath = extractGcsPath(contentUrl)
        if (!gcsPath) {
            setSignedUrl(contentUrl)
            return
        }

        setLoadingSignedUrl(true)
        try {
            const response = await storageApi.getSignedUrl(gcsPath, 60)
            setSignedUrl(response.url)
        } catch (err) {
            console.error('Failed to get signed URL:', err)
            setSignedUrl(contentUrl)
        } finally {
            setLoadingSignedUrl(false)
        }
    }

    const generateAISummary = async () => {
        if (!resource) return

        // Always show a good fallback first
        const fallbackSummary = generateFallbackSummary()
        setAiSummary(fallbackSummary)

        // Then try to get AI-generated summary via resource analyzer
        setLoadingSummary(true)
        try {
            const response = await resourcesApi.analyzeResource(resource.id)
            if (response.success && response.summary) {
                setAiSummary(response.summary)
            }
        } catch (err) {
            // Keep fallback summary
            console.error('AI summary failed:', err)
        } finally {
            setLoadingSummary(false)
        }
    }

    const generateFallbackSummary = (): string => {
        if (!resource) return ''
        return `**${resource.title}**

• **Category:** ${resource.category.charAt(0).toUpperCase() + resource.category.slice(1)} - practical guidance for classroom implementation

• **Target Audience:** ${resource.grade || 'All grades'} ${resource.subject ? `- ${resource.subject}` : ''}

• **Format:** ${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} resource (${resource.duration || '~15 min'})

• **Key Focus:** Developing teaching skills and improving classroom practices`
    }

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || !resource || loadingChat) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoadingChat(true)

        try {
            const response = await resourcesApi.askAboutResource(resource.id, userMessage)
            setChatMessages(prev => [...prev, { role: 'assistant', content: response.answer }])
        } catch (err) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `I'd be happy to help with your question about "${resource.title}". However, I'm having trouble connecting right now. Please try again.`
            }])
        } finally {
            setLoadingChat(false)
        }
    }

    // Handle Sparkle Assistant messages
    const handleSparkleMessage = async (message: string): Promise<string> => {
        if (!resource) return "I couldn't find the resource. Please try again."
        
        try {
            const response = await resourcesApi.askAboutResource(resource.id, message)
            return response.answer
        } catch (err) {
            return `I'd be happy to help explain "${resource.title}". However, I'm having trouble connecting right now. Please try again in a moment.`
        }
    }

    if (!resource) {
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
        try {
            await resourcesApi.updateProgress(resource.id, { is_completed: true, progress_percent: 100 })
            setIsCompleted(true)
            setProgress(100)
        } catch (err) {
            console.error('Failed to mark complete:', err)
        }
    }

    const renderContentPlayer = () => {
        if (loadingSignedUrl) {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-[450px] flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading content...</p>
                    </div>
                </div>
            )
        }

        const displayUrl = signedUrl || resource.content_url

        if (resource.type === 'video') {
            return (
                <div className="bg-black rounded-xl aspect-video relative overflow-hidden">
                    {displayUrl ? (
                        <video
                            src={displayUrl}
                            className="w-full h-full object-contain"
                            controls
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="text-center">
                                <div className={`w-16 h-16 rounded-full ${getTypeColor(resource.type)} flex items-center justify-center mx-auto mb-3`}>
                                    <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                                <p className="text-white font-medium">{resource.title}</p>
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        if (displayUrl) {
            const fileExt = getFileExtension(displayUrl)
            const isPdf = fileExt === 'pdf'
            const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)

            let viewerUrl = displayUrl
            if (isPdf) {
                viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`
            } else if (isOfficeDoc) {
                viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(displayUrl)}`
            }

            return (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className={`h-10 ${getTypeColor(resource.type)} flex items-center justify-between px-4`}>
                        <div className="flex items-center gap-2 text-white">
                            <TypeIcon className="w-4 h-4" />
                            <span className="font-medium text-sm">{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
                            {isPdf && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">PDF</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white flex items-center gap-1 text-xs">
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                            </a>
                            <a href={displayUrl} download className="text-white/80 hover:text-white flex items-center gap-1 text-xs">
                                <Download className="w-3.5 h-3.5" /> Download
                            </a>
                        </div>
                    </div>
                    <div className="h-[440px]">
                        <iframe src={viewerUrl} className="w-full h-full border-0" title={resource.title} allow="fullscreen" />
                    </div>
                </div>
            )
        }

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center h-[450px] flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-full ${getTypeColor(resource.type)} flex items-center justify-center mx-auto mb-4`}>
                    <TypeIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
                <p className="text-gray-500 text-sm">Content preview not available</p>
            </div>
        )
    }

    const timeRemaining = Math.max(0, estimatedDuration - viewedSeconds)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            {/* Header with Progress */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/teacher/resources')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className={`w-8 h-8 rounded-lg ${getTypeColor(resource.type)} flex items-center justify-center`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{resource.title}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{resource.grade || 'All Grades'}</span>
                                <span>•</span>
                                <span>{resource.subject || 'General'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Time & Progress Display */}
                        <div className="hidden sm:flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(timeRemaining)} left</span>
                            </div>
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-primary-600 font-medium">{progress}%</span>
                        </div>

                        <button onClick={toggleBookmark} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-warning-500" /> : <Bookmark className="w-5 h-5 text-gray-400" />}
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Share2 className="w-5 h-5 text-gray-400" />
                        </button>

                        {isCompleted ? (
                            <div className="px-3 py-1.5 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 rounded-lg text-sm font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Completed
                            </div>
                        ) : (
                            <button
                                onClick={markComplete}
                                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-1"
                            >
                                <CheckCircle className="w-4 h-4" /> Complete
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Progress Bar */}
                <div className="sm:hidden h-1 bg-gray-100 dark:bg-gray-700">
                    <div className="h-1 bg-primary-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column - Player & About */}
                    <div className="lg:col-span-2 space-y-3">
                        {renderContentPlayer()}

                        {/* About Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setShowAbout(!showAbout)}
                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary-500" />
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">About this Resource</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAbout ? 'rotate-180' : ''}`} />
                            </button>
                            {showAbout && (
                                <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                        {resource.description || `This ${resource.type} provides guidance on ${resource.category} concepts.`}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                                            <Clock className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{resource.duration || '15 min'}</p>
                                            <p className="text-[9px] text-gray-500">Duration</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                                            <GraduationCap className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{resource.grade || 'All'}</p>
                                            <p className="text-[9px] text-gray-500">Grade</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                                            <BookOpen className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                            <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{resource.category}</p>
                                            <p className="text-[9px] text-gray-500">Category</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                                            <CheckCircle className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                            <p className="text-xs font-bold text-primary-600">{progress}%</p>
                                            <p className="text-[9px] text-gray-500">Progress</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Summary/Chat Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[580px]">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'summary'
                                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" /> Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat'
                                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4" /> Ask AI
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {activeTab === 'summary' ? (
                                <div className="p-4 overflow-y-auto flex-1">
                                    {loadingSummary && !aiSummary ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                                                {aiSummary}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {chatMessages.length === 0 && (
                                            <div className="text-center py-6">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                                <p className="text-sm text-gray-500 mb-3">Ask anything about this resource</p>
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => setChatInput('How can I use this in my classroom?')}
                                                        className="text-xs text-primary-500 hover:underline block mx-auto"
                                                    >
                                                        "How can I use this in my classroom?"
                                                    </button>
                                                    <button
                                                        onClick={() => setChatInput('What are the key takeaways?')}
                                                        className="text-xs text-primary-500 hover:underline block mx-auto"
                                                    >
                                                        "What are the key takeaways?"
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {chatMessages.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                                                        <Sparkles className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user'
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                {msg.role === 'user' && (
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {loadingChat && (
                                            <div className="flex gap-2 justify-start">
                                                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-3 h-3 text-white" />
                                                </div>
                                                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl">
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Ask a question..."
                                                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!chatInput.trim() || loadingChat}
                                                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Sparkle AI Button */}
            <button
                onClick={() => setShowSparkleAssistant(true)}
                className="fixed bottom-6 right-6 z-40 group"
                title="Ask Sparkle AI to explain this resource"
            >
                <div className="relative">
                    {/* Animated glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
                    
                    {/* Button */}
                    <div className="relative w-14 h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-xl transform transition-all group-hover:scale-110">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Sparkle particles */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                        ✨ Ask Sparkle to explain
                    </div>
                </div>
            </button>

            {/* Sparkle Assistant Panel */}
            <SparkleAssistant
                isOpen={showSparkleAssistant}
                onClose={() => setShowSparkleAssistant(false)}
                resourceTitle={resource.title}
                onAsk={handleSparkleMessage}
            />
        </div>
    )
}
