import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    ArrowLeft,
    Bot,
    Mic,
    MicOff,
    FileText,
    BookOpen,
    Lightbulb,
    Save,
    Send,
    Loader2,
    ChevronRight,
    Play,
    CheckCircle2,
    Wand2,
    RefreshCw,
    Eye,
    Pencil,
    GraduationCap,
    Volume2,
} from 'lucide-react'
import { contentApi, aiApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

// Simplified content creation modes - more intuitive for teachers
const creationModes = [
    {
        id: 'quick',
        title: 'Quick Create',
        titleHi: 'त्वरित बनाएं',
        description: 'Just tell me what you want to teach',
        descriptionHi: 'बस बताएं कि आप क्या पढ़ाना चाहते हैं',
        icon: Bot,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
        id: 'voice',
        title: 'Voice Create',
        titleHi: 'आवाज़ से बनाएं',
        description: 'Speak and I\'ll create content for you',
        descriptionHi: 'बोलें और मैं आपके लिए सामग्री बनाऊंगा',
        icon: Mic,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
        id: 'guided',
        title: 'Step by Step',
        titleHi: 'कदम दर कदम',
        description: 'I\'ll guide you through creating content',
        descriptionHi: 'मैं आपको सामग्री बनाने में मदद करूंगा',
        icon: BookOpen,
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
        id: 'template',
        title: 'Use Template',
        titleHi: 'टेम्पलेट उपयोग करें',
        description: 'Start from ready-made templates',
        descriptionHi: 'तैयार टेम्पलेट से शुरू करें',
        icon: FileText,
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
]

// Simplified content types - only 4 main categories
const simpleContentTypes = [
    {
        id: 'teach',
        title: 'Teach a Topic',
        titleHi: 'कोई विषय पढ़ाएं',
        description: 'Lesson plan, explanation, or teaching guide',
        descriptionHi: 'पाठ योजना, व्याख्या, या शिक्षण गाइड',
        icon: GraduationCap,
        color: 'blue',
        outputs: ['lesson_plan', 'explanation', 'study_guide']
    },
    {
        id: 'activity',
        title: 'Create Activity',
        titleHi: 'गतिविधि बनाएं',
        description: 'Classroom activity or hands-on exercise',
        descriptionHi: 'कक्षा गतिविधि या हैंड्स-ऑन अभ्यास',
        icon: Play,
        color: 'green',
        outputs: ['activity', 'tlm']
    },
    {
        id: 'assess',
        title: 'Test Students',
        titleHi: 'छात्रों की परीक्षा',
        description: 'Quiz, worksheet, or assessment',
        descriptionHi: 'क्विज़, वर्कशीट, या मूल्यांकन',
        icon: CheckCircle2,
        color: 'purple',
        outputs: ['assessment', 'worksheet']
    },
    {
        id: 'quick_ref',
        title: 'Quick Reference',
        titleHi: 'त्वरित संदर्भ',
        description: 'Summary cards, tips, or reference sheet',
        descriptionHi: 'सारांश कार्ड, टिप्स, या संदर्भ शीट',
        icon: Lightbulb,
        color: 'amber',
        outputs: ['quick_reference']
    }
]

// Ready-made templates for quick start
const quickTemplates = [
    {
        id: 'daily_lesson',
        title: '📚 Daily Lesson Plan',
        titleHi: '📚 दैनिक पाठ योजना',
        contentType: 'lesson_plan',
        prompt: 'Create a 40-minute lesson plan'
    },
    {
        id: 'concept_explain',
        title: '💡 Explain a Concept',
        titleHi: '💡 अवधारणा समझाएं',
        contentType: 'explanation',
        prompt: 'Explain this concept in simple terms with examples'
    },
    {
        id: 'class_activity',
        title: '🎯 5-Minute Activity',
        titleHi: '🎯 5 मिनट की गतिविधि',
        contentType: 'activity',
        prompt: 'Create a quick 5-minute classroom activity'
    },
    {
        id: 'quiz_10',
        title: '✅ 10 Question Quiz',
        titleHi: '✅ 10 प्रश्न क्विज़',
        contentType: 'assessment',
        prompt: 'Create a 10 question quiz with answers'
    },
    {
        id: 'homework',
        title: '📝 Homework Worksheet',
        titleHi: '📝 होमवर्क वर्कशीट',
        contentType: 'worksheet',
        prompt: 'Create a homework worksheet'
    },
    {
        id: 'revision',
        title: '🔄 Revision Notes',
        titleHi: '🔄 रिवीजन नोट्स',
        contentType: 'quick_reference',
        prompt: 'Create concise revision notes with key points'
    }
]

// Guided wizard steps
const guidedSteps = [
    { id: 'what', title: 'What do you want to create?', titleHi: 'आप क्या बनाना चाहते हैं?' },
    { id: 'topic', title: 'What topic?', titleHi: 'कौन सा विषय?' },
    { id: 'class', title: 'For which class?', titleHi: 'कौन सी कक्षा के लिए?' },
    { id: 'details', title: 'Any special requirements?', titleHi: 'कोई विशेष आवश्यकता?' },
    { id: 'generate', title: 'Review & Generate', titleHi: 'समीक्षा और उत्पन्न करें' }
]

export default function SimpleContentCreator() {
    const { i18n } = useTranslation()
    const navigate = useNavigate()
    const { grades, subjects } = useMasterData()
    const isHindi = i18n.language === 'hi'

    // Creation flow state
    const [creationMode, setCreationMode] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState(0)

    // Content state
    const [topic, setTopic] = useState('')
    const [grade, setGrade] = useState<number | null>(null)
    const [subject, setSubject] = useState('')
    const [specialRequirements, setSpecialRequirements] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

    // Generated content
    const [generatedContent, setGeneratedContent] = useState('')
    const [contentTitle, setContentTitle] = useState('')
    const [contentType, setContentType] = useState('lesson_plan')

    // UI state
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [showEditMode, setShowEditMode] = useState(false)

    // Voice
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceRecognition()
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech()

    // Auto-update topic from voice transcript
    useEffect(() => {
        if (transcript && creationMode === 'voice') {
            setTopic(transcript)
        }
    }, [transcript, creationMode])

    // Generate content based on inputs
    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError(isHindi ? 'कृपया विषय दर्ज करें' : 'Please enter a topic')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Build smart prompt based on type and requirements
            let prompt = buildPrompt()
            
            const response = await aiApi.ask({
                input_text: prompt,
                mode: getAIMode(),
                grade: grade || undefined,
                subject: subject || undefined,
                language: i18n.language
            })

            if (response.content) {
                setGeneratedContent(response.content)
                setContentTitle(generateTitle())
                setShowPreview(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || (isHindi ? 'सामग्री बनाने में विफल' : 'Failed to generate content'))
        } finally {
            setLoading(false)
        }
    }

    const buildPrompt = () => {
        const gradeText = grade ? `Class ${grade}` : ''
        const subjectText = subject || ''
        const typeInfo = simpleContentTypes.find(t => t.id === selectedType)
        const templateInfo = quickTemplates.find(t => t.id === selectedTemplate)

        let basePrompt = ''

        if (templateInfo) {
            basePrompt = templateInfo.prompt
            setContentType(templateInfo.contentType)
        } else if (typeInfo) {
            setContentType(typeInfo.outputs[0])
            switch (selectedType) {
                case 'teach':
                    basePrompt = `Create a comprehensive teaching material for "${topic}"`
                    break
                case 'activity':
                    basePrompt = `Design an engaging hands-on classroom activity for "${topic}"`
                    break
                case 'assess':
                    basePrompt = `Create an assessment/quiz for "${topic}" with variety of question types`
                    break
                case 'quick_ref':
                    basePrompt = `Create a quick reference card/summary for "${topic}"`
                    break
                default:
                    basePrompt = `Create content about "${topic}"`
            }
        } else {
            basePrompt = `Create teaching content about "${topic}"`
        }

        // Add context
        let fullPrompt = basePrompt
        if (gradeText) fullPrompt += ` for ${gradeText} students`
        if (subjectText) fullPrompt += ` in ${subjectText}`
        if (specialRequirements) fullPrompt += `. Special requirements: ${specialRequirements}`

        // Add Indian context
        fullPrompt += `. Use examples relevant to Indian students. Keep language simple and clear.`

        return fullPrompt
    }

    const getAIMode = () => {
        switch (selectedType) {
            case 'teach':
                return 'plan'
            case 'activity':
            case 'assess':
                return 'assist'
            default:
                return 'explain'
        }
    }

    const generateTitle = () => {
        const typeInfo = simpleContentTypes.find(t => t.id === selectedType)
        const prefix = typeInfo ? typeInfo.title.replace('Create ', '').replace('Test ', '') : 'Content'
        return `${prefix}: ${topic}`
    }

    // Save content
    const handleSave = async (submit = false) => {
        setSaving(true)
        setError('')

        try {
            const data = {
                title: contentTitle,
                content_type: contentType,
                description: generatedContent,
                grade: grade || undefined,
                subject: subject || undefined,
                topic: topic,
                generate_pdf: true,
                vectorize: true
            }

            const result = await contentApi.create(data)

            if (submit) {
                await contentApi.submit(result.id)
                setSuccess(isHindi ? 'समीक्षा के लिए सबमिट किया गया!' : 'Submitted for review!')
            } else {
                setSuccess(isHindi ? 'ड्राफ्ट के रूप में सहेजा गया!' : 'Saved as draft!')
            }

            setTimeout(() => navigate('/teacher/my-content'), 1500)
        } catch (err: any) {
            setError(err.response?.data?.detail || (isHindi ? 'सहेजने में विफल' : 'Failed to save'))
        } finally {
            setSaving(false)
        }
    }

    // Regenerate with modifications
    const handleRegenerate = async () => {
        setLoading(true)
        try {
            const response = await aiApi.ask({
                input_text: `Improve and regenerate: ${buildPrompt()}. Make it more engaging and practical.`,
                mode: getAIMode(),
                grade: grade || undefined,
                subject: subject || undefined,
                language: i18n.language
            })
            if (response.content) {
                setGeneratedContent(response.content)
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to regenerate')
        } finally {
            setLoading(false)
        }
    }

    // Read content aloud
    const handleReadAloud = () => {
        if (isSpeaking) {
            stopSpeaking()
        } else {
            speak(generatedContent)
        }
    }

    // Reset to start
    const handleReset = () => {
        setCreationMode(null)
        setSelectedType(null)
        setCurrentStep(0)
        setTopic('')
        setGrade(null)
        setSubject('')
        setSpecialRequirements('')
        setGeneratedContent('')
        setShowPreview(false)
        setShowEditMode(false)
        setError('')
        setSuccess('')
        resetTranscript()
    }

    // Render mode selection
    const renderModeSelection = () => (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isHindi ? 'सामग्री बनाएं' : 'Create Content'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {isHindi ? 'आप कैसे शुरू करना चाहते हैं?' : 'How would you like to start?'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creationModes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setCreationMode(mode.id)}
                        className={`${mode.bgColor} p-6 rounded-2xl border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all text-left group`}
                    >
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <mode.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {isHindi ? mode.titleHi : mode.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isHindi ? mode.descriptionHi : mode.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    )

    // Render Quick Create mode
    const renderQuickCreate = () => (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isHindi ? 'बस बताएं कि आप क्या पढ़ाना चाहते हैं' : 'Just tell me what you want to teach'}
                </h2>
            </div>

            <div className="space-y-4">
                {/* Topic Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isHindi ? 'विषय या टॉपिक' : 'Topic or Subject'}
                    </label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={isHindi ? 'उदाहरण: कक्षा 5 के लिए प्रकाश संश्लेषण समझाएं' : 'Example: Explain photosynthesis for class 5'}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg"
                    />
                </div>

                {/* Quick options */}
                <div className="flex flex-wrap gap-2">
                    {grades.slice(0, 6).map((g) => (
                        <button
                            key={g.id}
                            onClick={() => setGrade(g.number)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                grade === g.number
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {subjects.slice(0, 6).map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSubject(s.name)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                subject === s.name
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>

                {/* Generate button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !topic.trim()}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isHindi ? 'बना रहा हूं...' : 'Creating...'}
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            {isHindi ? 'AI से बनाएं' : 'Create with AI'}
                        </>
                    )}
                </button>
            </div>
        </div>
    )

    // Render Voice Create mode
    const renderVoiceCreate = () => (
        <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 transition-all ${
                    isListening 
                        ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' 
                        : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                    {isListening ? (
                        <MicOff className="w-12 h-12 text-red-600" />
                    ) : (
                        <Mic className="w-12 h-12 text-green-600" />
                    )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {isListening 
                        ? (isHindi ? 'सुन रहा हूं... बोलें' : 'Listening... Speak now')
                        : (isHindi ? 'माइक पर टैप करें और बोलें' : 'Tap the mic and speak')
                    }
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {isHindi 
                        ? 'उदाहरण: "कक्षा 5 के लिए पानी का चक्र पाठ योजना बनाओ"'
                        : 'Example: "Create a lesson plan on water cycle for class 5"'
                    }
                </p>
            </div>

            {/* Voice button */}
            <button
                onClick={() => isListening ? stopListening() : startListening()}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 transition-all ${
                    isListening
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                        : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {isListening ? (
                    <MicOff className="w-10 h-10 text-white" />
                ) : (
                    <Mic className="w-10 h-10 text-white" />
                )}
            </button>

            {/* Transcript display */}
            {topic && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        {isHindi ? 'आपने कहा:' : 'You said:'}
                    </p>
                    <p className="text-gray-900 dark:text-white text-lg">{topic}</p>
                </div>
            )}

            {/* Generate button */}
            {topic && (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isHindi ? 'बना रहा हूं...' : 'Creating...'}
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            {isHindi ? 'इसके लिए बनाएं' : 'Create for this'}
                        </>
                    )}
                </button>
            )}
        </div>
    )

    // Render Guided mode
    const renderGuidedCreate = () => {
        const step = guidedSteps[currentStep]
        
        return (
            <div className="max-w-2xl mx-auto">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    {guidedSteps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                i < currentStep
                                    ? 'bg-green-600 text-white'
                                    : i === currentStep
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                                {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                            </div>
                            {i < guidedSteps.length - 1 && (
                                <div className={`w-8 sm:w-16 h-1 mx-1 ${
                                    i < currentStep ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isHindi ? step.titleHi : step.title}
                    </h2>
                </div>

                {/* Step content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    {currentStep === 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            {simpleContentTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setSelectedType(type.id)
                                        setCurrentStep(1)
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        selectedType === type.id
                                            ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <type.icon className={`w-8 h-8 mb-2 text-${type.color}-600`} />
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {isHindi ? type.titleHi : type.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isHindi ? type.descriptionHi : type.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={isHindi ? 'विषय दर्ज करें...' : 'Enter topic...'}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-lg dark:bg-gray-700 dark:text-white mb-4"
                                autoFocus
                            />
                            <button
                                onClick={() => topic && setCurrentStep(2)}
                                disabled={!topic}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
                            >
                                {isHindi ? 'आगे बढ़ें' : 'Continue'} <ChevronRight className="inline w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                                {grades.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGrade(g.number)}
                                        className={`p-3 rounded-lg text-center transition-colors ${
                                            grade === g.number
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                                {subjects.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSubject(s.name)}
                                        className={`p-3 rounded-lg text-center transition-colors ${
                                            subject === s.name
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium"
                            >
                                {isHindi ? 'आगे बढ़ें' : 'Continue'} <ChevronRight className="inline w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <textarea
                                value={specialRequirements}
                                onChange={(e) => setSpecialRequirements(e.target.value)}
                                placeholder={isHindi 
                                    ? 'कोई विशेष आवश्यकता? (वैकल्पिक)\nउदाहरण: मल्टीग्रेड कक्षा के लिए, या कम संसाधनों वाली कक्षा के लिए'
                                    : 'Any special requirements? (optional)\nExample: For multigrade classroom, or low-resource setting'
                                }
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white mb-4"
                            />
                            <button
                                onClick={() => setCurrentStep(4)}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium"
                            >
                                {isHindi ? 'समीक्षा करें' : 'Review'} <ChevronRight className="inline w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{isHindi ? 'प्रकार:' : 'Type:'}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {simpleContentTypes.find(t => t.id === selectedType)?.title}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{isHindi ? 'विषय:' : 'Topic:'}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{topic}</span>
                                </div>
                                {grade && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{isHindi ? 'कक्षा:' : 'Class:'}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">Class {grade}</span>
                                    </div>
                                )}
                                {subject && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{isHindi ? 'विषय:' : 'Subject:'}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{subject}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isHindi ? 'बना रहा हूं...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        {isHindi ? 'AI से बनाएं' : 'Generate with AI'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Back button */}
                {currentStep > 0 && (
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        ← {isHindi ? 'पीछे जाएं' : 'Go back'}
                    </button>
                )}
            </div>
        )
    }

    // Render Template mode
    const renderTemplateCreate = () => (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {isHindi ? 'टेम्पलेट चुनें' : 'Choose a Template'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {isHindi ? 'तैयार टेम्पलेट से जल्दी शुरू करें' : 'Start quickly from ready-made templates'}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {quickTemplates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTemplate === template.id
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-2xl mb-2 block">{template.title.split(' ')[0]}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {isHindi ? template.titleHi.slice(2) : template.title.slice(2)}
                        </h4>
                    </button>
                ))}
            </div>

            {selectedTemplate && (
                <div className="space-y-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={isHindi ? 'विषय दर्ज करें...' : 'Enter your topic...'}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-lg dark:bg-gray-800 dark:text-white"
                    />

                    <div className="flex flex-wrap gap-2">
                        {grades.slice(0, 6).map((g) => (
                            <button
                                key={g.id}
                                onClick={() => setGrade(g.number)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                    grade === g.number
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                }`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isHindi ? 'बना रहा हूं...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                {isHindi ? 'टेम्पलेट से बनाएं' : 'Create from Template'}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )

    // Render Preview/Edit
    const renderPreview = () => (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{contentTitle}</h2>
                    <p className="text-gray-500 text-sm">
                        {grade && `Class ${grade}`} {subject && `• ${subject}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEditMode(!showEditMode)}
                        className={`p-2 rounded-lg ${showEditMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                        {showEditMode ? <Eye className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={handleReadAloud}
                        className={`p-2 rounded-lg ${isSpeaking ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {showEditMode ? (
                    <textarea
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        className="w-full h-96 p-6 dark:bg-gray-800 dark:text-white focus:outline-none resize-none font-mono text-sm"
                    />
                ) : (
                    <div className="p-6 prose dark:prose-invert max-w-none overflow-y-auto max-h-96">
                        <MarkdownRenderer content={generatedContent} />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    {isHindi ? 'फिर से बनाएं' : 'Regenerate'}
                </button>
                <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1 py-3 border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {isHindi ? 'ड्राफ्ट सहेजें' : 'Save Draft'}
                </button>
                <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isHindi ? 'समीक्षा के लिए भेजें' : 'Submit for Review'}
                </button>
            </div>

            {/* Start over */}
            <button
                onClick={handleReset}
                className="w-full mt-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
                {isHindi ? 'नया बनाएं' : 'Create new content'}
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => creationMode && !showPreview ? setCreationMode(null) : navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">{isHindi ? 'वापस' : 'Back'}</span>
                    </button>

                    <h1 className="font-semibold text-gray-900 dark:text-white">
                        {isHindi ? 'सामग्री बनाएं' : 'Create Content'}
                    </h1>

                    <button
                        onClick={() => navigate('/teacher/content/new')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        {isHindi ? 'उन्नत मोड' : 'Advanced'}
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Error/Success messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
                        {success}
                    </div>
                )}

                {/* Content based on state */}
                {showPreview ? (
                    renderPreview()
                ) : !creationMode ? (
                    renderModeSelection()
                ) : creationMode === 'quick' ? (
                    renderQuickCreate()
                ) : creationMode === 'voice' ? (
                    renderVoiceCreate()
                ) : creationMode === 'guided' ? (
                    renderGuidedCreate()
                ) : creationMode === 'template' ? (
                    renderTemplateCreate()
                ) : null}
            </main>
        </div>
    )
}
