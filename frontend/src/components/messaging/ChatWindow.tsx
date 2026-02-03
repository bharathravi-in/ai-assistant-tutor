import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, getMessagesWithUser, sendMessage, markMessageRead } from '../../services/messagingService';
import { Send, User, ChevronLeft, Loader2, MessageCircle } from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer';

interface ChatWindowProps {
    userId: number;
    userName: string;
    onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId, userName, onBack }) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages
    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 10000); // Poll for new messages every 10s
        return () => clearInterval(interval);
    }, [userId]);

    const loadMessages = async () => {
        try {
            const data = await getMessagesWithUser(userId);
            setMessages(data);

            // Mark unread as read
            const unreadIds = data.filter(m => m.sender_id === userId && !m.is_read).map(m => m.id);
            for (const id of unreadIds) {
                await markMessageRead(id);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const content = input;
        setInput('');
        setSending(true);

        try {
            const response = await sendMessage({ receiver_id: userId, content });
            setMessages(prev => [...prev, response]);
        } catch (err) {
            console.error('Failed to send message:', err);
            setInput(content); // Restore input on fail
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-black/20">
            {/* Header */}
            <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-white/10 p-4 flex items-center gap-3">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <ChevronLeft className="dark:text-gray-400" />
                    </button>
                )}
                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{userName}</h3>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 opacity-60">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p className="font-medium">Start a conversation with {userName}</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${msg.sender_id === userId
                                ? 'bg-white text-gray-900 border-gray-100 dark:bg-gray-800 dark:text-white dark:border-white/5'
                                : 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 dark:bg-blue-700 dark:border-blue-600'
                                }`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={msg.content} />
                                </div>
                                <div className={`text-[10px] mt-2 flex items-center gap-1 font-medium uppercase tracking-wider ${msg.sender_id === userId ? 'text-gray-400 dark:text-gray-500' : 'text-blue-100/80'
                                    }`}>
                                    {new Date(msg.created_at.includes('Z') || msg.created_at.includes('+') ? msg.created_at : `${msg.created_at}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender_id !== userId && (
                                        <span>• {msg.is_read ? 'Read' : 'Sent'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <div className="relative flex-1">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none dark:text-white transition-all text-sm"
                            style={{ minHeight: '48px', maxHeight: '150px' }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
