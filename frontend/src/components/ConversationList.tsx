/**
 * Conversation List - View all chat conversations
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { Conversation, ChatMode } from '../types/chat';
import { listConversations, createConversation, deleteConversation } from '../services/chatService';
import { useTranslation } from 'react-i18next';

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // New conversation form
  const [newConv, setNewConv] = useState<{
    mode: ChatMode;
    subject?: string;
    grade?: number;
    topic?: string;
    initial_message?: string;
  }>({
    mode: 'general',
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await listConversations({ page: 1, page_size: 50 });
      setConversations(data.conversations);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const conversation = await createConversation(newConv);
      setCreateDialogOpen(false);
      navigate(`/teacher/chat/${conversation.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create conversation');
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete conversation');
    }
  };

  const getModeColor = (mode: ChatMode): string => {
    const colors: Record<ChatMode, string> = {
      explain: 'bg-blue-100 text-blue-700',
      plan: 'bg-green-100 text-green-700',
      assist: 'bg-cyan-100 text-cyan-700',
      ask: 'bg-purple-100 text-purple-700',
      general: 'bg-orange-100 text-orange-700',
    };
    return colors[mode];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chat Conversations</h1>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Conversations Grid */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6">
            Start a new conversation to get AI-powered teaching support
          </p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Start Chatting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/teacher/chat/${conv.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold line-clamp-1">
                  {conv.title || 'Untitled Conversation'}
                </h3>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs rounded ${getModeColor(conv.mode)}`}>
                  {conv.mode}
                </span>
                {conv.subject && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {conv.subject}
                  </span>
                )}
                {conv.grade && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    Grade {conv.grade}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-1">
                {conv.message_count} messages
              </p>

              <p className="text-xs text-gray-500">
                {conv.last_message_at
                  ? `Last active ${formatTimeAgo(conv.last_message_at)}`
                  : `Created ${formatTimeAgo(conv.created_at)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Conversation Modal */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Start New Conversation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chat Mode</label>
                <select
                  value={newConv.mode}
                  onChange={(e) => setNewConv({ ...newConv, mode: e.target.value as ChatMode })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="explain">Explain - Concept Explanation</option>
                  <option value="plan">Plan - Lesson Planning</option>
                  <option value="assist">Assist - Teaching Support</option>
                  <option value="ask">Ask - General Q&A</option>
                  <option value="general">General - Free Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject (optional)</label>
                <input
                  type="text"
                  value={newConv.subject || ''}
                  onChange={(e) => setNewConv({ ...newConv, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grade (optional)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newConv.grade || ''}
                  onChange={(e) => setNewConv({ ...newConv, grade: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Topic (optional)</label>
                <input
                  type="text"
                  value={newConv.topic || ''}
                  onChange={(e) => setNewConv({ ...newConv, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">First Message (optional)</label>
                <textarea
                  value={newConv.initial_message || ''}
                  onChange={(e) => setNewConv({ ...newConv, initial_message: e.target.value })}
                  rows={3}
                  placeholder="Start the conversation with a question or topic..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
