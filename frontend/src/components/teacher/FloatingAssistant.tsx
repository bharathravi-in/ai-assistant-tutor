import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Bot,
    X,
    Mic,
    MicOff,
    Send,
    Loader2,
    Volume2,
    VolumeX,
    ChevronDown,
    BrainCircuit
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import * as chatService from '../../services/chatService';
import { ChatMessage, Conversation } from '../../types/chat';
import MarkdownRenderer from '../common/MarkdownRenderer';

export default function FloatingAssistant() {
    const { i18n } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [autoSpeak, setAutoSpeak] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice recognition hook
    const {
        isListening,
        transcript,
        interimTranscript,
        isSupported: voiceSupported,
        startListening,
        stopListening,
        resetTranscript
    } = useVoiceRecognition({
        language: i18n.language,
        continuous: false,
        interimResults: true,
    });

    // TTS hook
    const {
        speak,
        stop: stopSpeaking
    } = useTextToSpeech({
        language: i18n.language,
        rate: 1,
        pitch: 1,
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, interimTranscript]);

    // Handle voice input completion
    useEffect(() => {
        if (transcript && !isListening) {
            handleSendMessage(transcript);
            resetTranscript();
        }
    }, [transcript, isListening]);

    const handleSendMessage = async (text: string = inputText) => {
        const messageContent = text.trim();
        if (!messageContent || loading) return;

        setInputText('');
        setLoading(true);

        try {
            let activeConv = conversation;

            // 1. Create conversation if none exists
            if (!activeConv) {
                activeConv = await chatService.createConversation({
                    mode: 'general',
                    title: 'Quick Assistant Query',
                    initial_message: messageContent
                });
                setConversation(activeConv);
                // The API creates the first message pair (user + ai)
                setMessages(activeConv.messages || []);

                // Speak response if autoSpeak is on
                if (autoSpeak && activeConv.messages && activeConv.messages.length > 0) {
                    const lastMsg = activeConv.messages[activeConv.messages.length - 1];
                    if (lastMsg.role === 'assistant') speak(lastMsg.content);
                }
            } else {
                // 2. Add optimistic user message
                const tempId = Date.now();
                const optimisticMsg: ChatMessage = {
                    id: tempId,
                    conversation_id: activeConv.id,
                    role: 'user',
                    content: messageContent,
                    created_at: new Date().toISOString(),
                    was_voice_input: !inputText.trim() && text.length > 0
                };
                setMessages(prev => [...prev, optimisticMsg]);

                // 3. Send message
                const response = await chatService.sendMessage(activeConv.id, {
                    content: messageContent,
                    language: i18n.language
                });

                // 4. Update messages and speak
                setMessages((prev: ChatMessage[]) => {
                    const filtered = prev.filter(m => m.id !== tempId);
                    return [...filtered, response.user_message, response.ai_response];
                });

                if (autoSpeak) speak(response.ai_response.content);
            }
        } catch (error) {
            console.error('Assistant failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            stopSpeaking();
            startListening();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-[100] group"
                title="AI Assistant"
            >
                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 group-hover:opacity-40" />
                <BrainCircuit className="w-8 h-8 relative z-10" />
            </button>
        );
    }

    return (
        <div
            className={`fixed right-6 bottom-6 z-[100] transition-all duration-300 ease-out flex flex-col
                ${isMinimized ? 'w-16 h-16' : 'w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-white/10 overflow-hidden'}
            `}
        >
            {isMinimized ? (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            ) : (
                <>
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Teaching Butler</h3>
                                <p className="text-[10px] text-blue-100 font-medium">Ready to support your classroom</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAutoSpeak(!autoSpeak)}
                                className={`p-2 rounded-lg transition-colors ${autoSpeak ? 'bg-white/20' : 'text-white/40'}`}
                            >
                                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2 italic">How can I help you today?</h4>
                                <p className="text-xs text-gray-500">Ask about lesson plans, explain concepts, or classroom management strategies.</p>
                            </div>
                        ) : (
                            messages.map((msg: ChatMessage) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5'
                                        }`}>
                                        <div className="prose prose-xs dark:prose-invert max-w-none break-words">
                                            <MarkdownRenderer content={msg.content} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Butler is thinking...</span>
                                </div>
                            </div>
                        )}
                        {isListening && (
                            <div className="flex justify-end italic text-xs text-indigo-500 animate-pulse font-medium">
                                Listening: {interimTranscript || '...'}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-6 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 shrink-0">
                        <div className="relative flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-[2rem] border-2 border-gray-200 dark:border-white/10 focus-within:border-indigo-500/50 transition-all">
                            <button
                                onClick={toggleListening}
                                disabled={!voiceSupported}
                                className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30'}`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type your request..."
                                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm dark:text-white max-h-32"
                                rows={1}
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim() || loading}
                                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-indigo-500/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Helper icons
function PlusIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
