import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Bot,
    Lightbulb,
    Clock,
    Users,
    Plus,
    History as HistoryIcon,
    ArrowRight,
    ChevronRight,
    BrainCircuit,
    MessageCircle,
    X,
    Loader2
} from 'lucide-react';
import { Conversation, ChatMode } from '../../types/chat';
import * as chatService from '../../services/chatService';

const modeConfig = [
    {
        id: 'explain',
        title: 'Explain Concept',
        description: 'Get simplified explanations and analogies for complex topics.',
        icon: Lightbulb,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        lightBg: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        id: 'plan',
        title: 'Lesson Planning',
        description: 'Collaborate on structured, engaging lesson plans and activities.',
        icon: Clock,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-600',
        lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        id: 'assist',
        title: 'Classroom Support',
        description: 'Strategies for classroom management and student engagement.',
        icon: Users,
        color: 'orange',
        gradient: 'from-orange-500 to-amber-600',
        lightBg: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
        id: 'ask',
        title: 'Direct Q&A',
        description: 'Quick answers to pedagogy and subject matter questions.',
        icon: MessageSquare,
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600',
        lightBg: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
        id: 'general',
        title: 'Free Chat',
        description: 'Open-ended conversation about anything on your mind.',
        icon: Bot,
        color: 'rose',
        gradient: 'from-rose-500 to-pink-600',
        lightBg: 'bg-rose-50 dark:bg-rose-900/20',
        textColor: 'text-rose-600 dark:text-rose-400',
    }
];

export default function AITutorLanding() {
    const navigate = useNavigate();
    const [recentChats, setRecentChats] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<ChatMode | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        subject: '',
        grade: '',
        topic: '',
        initial_message: ''
    });

    useEffect(() => {
        loadRecentActivity();
    }, []);

    const loadRecentActivity = async () => {
        try {
            const data = await chatService.listConversations({ page_size: 3 });
            setRecentChats(data.conversations || []);
        } catch (error) {
            console.error('Failed to load recent chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = (modeId: string) => {
        setSelectedMode(modeId as ChatMode);
        setCreateDialogOpen(true);
    };

    const handleCreateChat = async () => {
        if (!selectedMode) return;

        setIsCreating(true);
        try {
            const conversation = await chatService.createConversation({
                mode: selectedMode,
                subject: formData.subject || undefined,
                grade: formData.grade ? parseInt(formData.grade) : undefined,
                topic: formData.topic || undefined,
                initial_message: formData.initial_message || undefined
            });
            navigate(`/teacher/chat/${conversation.id}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8 bg-[#F8F9FB] dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Hero / Header */}
                <div className="relative mb-12 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-900 to-blue-800 p-8 lg:p-12 shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                            <path d="M0 0 L100 0 L100 100 Z" fill="white" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                                <Bot className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Next-Gen Teaching Assistant</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                                Your Personal <br /> <span className="text-blue-400">AI Tutor</span>
                            </h1>
                            <p className="text-indigo-100 text-lg max-w-xl mb-8 leading-relaxed opacity-90">
                                Collaborate with AI to explain concepts, plan lessons, and get instant pedagogical support tailored to your classroom.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <button
                                    onClick={() => handleOpenCreate('general')}
                                    className="px-8 py-3.5 bg-white text-indigo-900 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95 shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    New Conversation
                                </button>
                                <button
                                    onClick={() => navigate('/teacher/history?tab=chats')}
                                    className="px-8 py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                    <HistoryIcon className="w-5 h-5" />
                                    View History
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <div className="w-72 h-72 rounded-full bg-blue-500/20 animate-pulse absolute -z-10 blur-3xl" />
                            <div className="w-64 h-64 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 rotate-12 flex items-center justify-center p-8 relative overflow-hidden group hover:rotate-6 transition-transform duration-500">
                                <BrainCircuit className="w-32 h-32 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/30 blur-2xl rounded-full" />
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/30 blur-2xl rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Modes */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Choose Your Mode</h2>
                            <p className="text-gray-500 dark:text-gray-400">Select a specialized assistant for your current task</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {modeConfig.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => handleOpenCreate(mode.id)}
                                className="group relative flex flex-col items-start text-left p-6 rounded-[2rem] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all shadow-sm hover:shadow-xl active:scale-[0.98]"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${mode.lightBg} ${mode.textColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <mode.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{mode.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-6">
                                    {mode.description}
                                </p>
                                <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start Now <ChevronRight className="w-4 h-4" />
                                </div>

                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-5 rounded-bl-[4rem] transition-opacity`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section: Recent Activity */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
                            <p className="text-gray-500 dark:text-gray-400">Continue your last conversations</p>
                        </div>
                        <button
                            onClick={() => navigate('/teacher/history?tab=chats')}
                            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            All Conversations <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 rounded-[2rem] bg-white dark:bg-[#1C1C1E] animate-pulse border border-gray-100 dark:border-white/5" />
                            ))}
                        </div>
                    ) : recentChats.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recentChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => navigate(`/teacher/chat/${chat.id}`)}
                                    className="group text-left p-6 rounded-[2rem] bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] border-l-4 border-l-blue-500"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5">
                                            <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">{chat.mode}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">{formatTimeAgo(chat.last_message_at || chat.created_at)}</span>
                                    </div>
                                    <h4 className="text-gray-900 dark:text-white font-bold line-clamp-2 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {chat.title || 'Untitled Conversation'}
                                    </h4>
                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>Grade {chat.grade || 'N/A'} • {chat.subject || 'All Subjects'}</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No recent activity</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                                Start your first conversation with the AI Tutor to see it here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Dialog */}
            {createDialogOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setCreateDialogOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 lg:p-10">
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modeConfig.find(m => m.id === selectedMode)?.lightBg} ${modeConfig.find(m => m.id === selectedMode)?.textColor}`}>
                                        {React.createElement(modeConfig.find(m => m.id === selectedMode)?.icon || MessageSquare, { className: "w-5 h-5" })}
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Start {modeConfig.find(m => m.id === selectedMode)?.title}</h2>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">Set the context for your conversation</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Grade Level</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 5"
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all dark:text-white shadow-sm"
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Science"
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all dark:text-white shadow-sm"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Specific Topic</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Photosynthesis"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all dark:text-white shadow-sm"
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Initial Message (Optional)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="What would you like to discuss?"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all dark:text-white shadow-sm resize-none"
                                        value={formData.initial_message}
                                        onChange={(e) => setFormData({ ...formData, initial_message: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={() => setCreateDialogOpen(false)}
                                        className="flex-1 py-4 px-6 rounded-2xl border border-gray-200 dark:border-white/10 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateChat}
                                        disabled={isCreating}
                                        className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Initialize Chat
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
