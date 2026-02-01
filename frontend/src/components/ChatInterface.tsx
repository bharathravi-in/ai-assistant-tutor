/**
 * Chat Interface Component - Multi-turn Conversations
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Mic, ArrowLeft, MoreVertical, Loader2 } from 'lucide-react';
import { ChatMessage, Conversation } from '../types/chat';
import { getConversation, sendMessage } from '../services/chatService';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from './common/MarkdownRenderer';
import StructuredAIResponse from './common/StructuredAIResponse';

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  // Ensure the date string is treated as UTC if it doesn't have a timezone indicator
  const utcDateString = dateString.includes('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;
  const date = new Date(utcDateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return 'just now'; // Handle future dates
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const ChatInterface: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const data = await getConversation(Number(conversationId));
      setConversation(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = input;
    const tempId = Date.now(); // Temporary ID for optimistic UI

    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversation_id: Number(conversationId),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
      was_voice_input: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await sendMessage(Number(conversationId), {
        content: userMessage,
        language: localStorage.getItem('i18nextLng') || 'en',
      });

      // Avoid duplicates: replace the optimistic message with the real one, and add the AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [...filtered, response.user_message, response.ai_response];
      });
      setConversation(response.conversation);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
      setInput(userMessage); // Restore input on error
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
  };

  if (!conversation) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/chat')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">{conversation.title || 'Conversation'}</h2>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  {conversation.mode}
                </span>
                {conversation.subject && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    {conversation.subject}
                  </span>
                )}
                {conversation.grade && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    Grade {conversation.grade}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100/30">
        {[...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg) => (
          <div key={msg.id} className="mb-4">
            {/* Message Bubble */}
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                  ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-700'
                  : 'bg-white text-gray-900 shadow-md border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                  }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words text-gray-800 dark:text-gray-200">
                  {msg.role === 'assistant' && msg.structured_data && Object.keys(msg.structured_data).filter(k => !['mode', 'raw_response'].includes(k)).length > 0 ? (
                    <StructuredAIResponse
                      content={msg.content}
                      structured={msg.structured_data}
                      topic={conversation.topic}
                      grade={conversation.grade}
                    />
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                {/* Metadata */}
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTimeAgo(msg.created_at)}
                  {msg.was_voice_input && ' • Voice'}
                  {msg.response_time_ms && ` • ${(msg.response_time_ms / 1000).toFixed(1)}s`}
                </p>
              </div>
            </div>

            {/* Follow-up Suggestions */}
            {
              msg.role === 'assistant' && msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 ml-2">
                  {msg.suggested_followups.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpClick(suggestion)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )
            }
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white p-3 rounded-lg shadow">
              <Loader2 className="animate-spin w-5 h-5 text-blue-600 inline mr-2" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {
        error && (
          <div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-800 text-sm">{error}</p>
              <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
                ×
              </button>
            </div>
          </div>
        )
      }

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.typePlaceholder', 'Type your message...')}
            disabled={loading}
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            disabled
            className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-50"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div >
  );
};

export default ChatInterface;
