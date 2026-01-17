import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    HelpCircle,
    BookOpen,
    Video,
    MessageCircle,
    Phone,
    Mail,
    ChevronDown,
    ChevronUp,
    Search,
    ExternalLink,
    GraduationCap,
    FileText
} from 'lucide-react'

interface FAQItem {
    question: string
    answer: string
    category: string
}

const FAQ_ITEMS: FAQItem[] = [
    {
        category: 'Getting Started',
        question: 'How do I start using the AI Assistant?',
        answer: 'Navigate to the "Ask AI" section from your dashboard. You can type or speak your question, and the AI will provide contextual support based on your class profile, subject, and grade level.'
    },
    {
        category: 'Getting Started',
        question: 'How do I update my classroom profile?',
        answer: 'Go to Profile Settings from the left sidebar. Here you can update your grades taught, subjects, class size, and other classroom context information.'
    },
    {
        category: 'AI Assistant',
        question: 'Can the AI help with lesson planning?',
        answer: 'Yes! The AI Assistant can help you create lesson plans tailored to your class size, grade level, time constraints, and available resources. Just describe what you need and it will generate a customized plan.'
    },
    {
        category: 'AI Assistant',
        question: 'Is the AI content aligned with NCERT curriculum?',
        answer: 'Yes, all AI-generated content is reviewed against NCERT guidelines and state curriculum standards to ensure alignment with official educational frameworks.'
    },
    {
        category: 'Resources',
        question: 'How can I share resources with other teachers?',
        answer: 'After creating a resource, you can share it with your CRP who can then publish it to the wider community. You can also directly share resources within your school network.'
    },
    {
        category: 'Support',
        question: 'How do I contact my CRP for support?',
        answer: 'You can submit a query from the Dashboard or use the "Share with CRP" toggle when asking the AI Assistant. Your CRP will receive notifications and can respond directly.'
    },
    {
        category: 'Support',
        question: 'What should I do if the AI response is incorrect?',
        answer: 'Use the feedback buttons on the response to mark it as unhelpful. You can also submit a detailed report to your CRP who can escalate the issue to improve the system.'
    },
    {
        category: 'Account',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your registered email or phone number. You will receive a link to reset your password.'
    }
]

const VIDEO_TUTORIALS = [
    { title: 'Platform Overview', duration: '5:30', icon: GraduationCap },
    { title: 'Using the AI Assistant', duration: '8:45', icon: MessageCircle },
    { title: 'Creating Lesson Plans', duration: '6:20', icon: FileText },
    { title: 'Managing Resources', duration: '4:15', icon: BookOpen },
]

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('All')

    const categories = ['All', ...Array.from(new Set(FAQ_ITEMS.map(item => item.category)))]

    const filteredFAQs = FAQ_ITEMS.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
                    <p className="text-blue-100 max-w-xl mx-auto">
                        Find answers to common questions, watch tutorials, or contact support for assistance.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-md mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: BookOpen, label: 'Documentation', color: 'bg-blue-500' },
                        { icon: Video, label: 'Video Tutorials', color: 'bg-purple-500' },
                        { icon: MessageCircle, label: 'Contact CRP', color: 'bg-green-500' },
                        { icon: Phone, label: 'Helpline', color: 'bg-orange-500' },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                        >
                            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* FAQ Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-blue-500" />
                                Frequently Asked Questions
                            </h2>

                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* FAQ Items */}
                            <div className="space-y-3">
                                {filteredFAQs.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No matching questions found.</p>
                                ) : (
                                    filteredFAQs.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                                                className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <span className="font-medium text-gray-800 dark:text-white pr-4">{item.question}</span>
                                                {expandedFAQ === idx ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                            </button>
                                            {expandedFAQ === idx && (
                                                <div className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
                                                    {item.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Video Tutorials */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Video className="w-5 h-5 text-purple-500" />
                                Video Tutorials
                            </h3>
                            <div className="space-y-3">
                                {VIDEO_TUTORIALS.map((video, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <video.icon className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 dark:text-white text-sm">{video.title}</p>
                                            <p className="text-xs text-gray-500">{video.duration}</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                            <h3 className="text-lg font-bold mb-2">Need More Help?</h3>
                            <p className="text-blue-100 text-sm mb-4">
                                Contact our support team for personalized assistance.
                            </p>
                            <div className="space-y-3">
                                <a href="mailto:support@educationai.gov.in" className="flex items-center gap-2 text-sm hover:underline">
                                    <Mail className="w-4 h-4" />
                                    support@educationai.gov.in
                                </a>
                                <a href="tel:1800-XXX-XXXX" className="flex items-center gap-2 text-sm hover:underline">
                                    <Phone className="w-4 h-4" />
                                    1800-XXX-XXXX (Toll Free)
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-blue-600 text-sm font-medium"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
