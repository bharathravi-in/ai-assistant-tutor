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
        <div className="flex-1 flex flex-col h-full bg-gray-50 border-r">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft />
                    </button>
                )}
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{userName}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100/30">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p>Start a conversation with {userName}</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md border ${msg.sender_id === userId
                                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 dark:bg-blue-700 dark:border-blue-600'
                                : 'bg-white text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                                }`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                                    <MarkdownRenderer content={msg.content} />
                                </div>
                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${msg.sender_id === userId ? 'text-gray-400' : 'text-blue-100'
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
            <div className="bg-white border-t p-4">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                        style={{ height: 'auto', minHeight: '44px' }}
                    />
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
