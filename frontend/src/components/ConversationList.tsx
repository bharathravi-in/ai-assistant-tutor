/**
 * Conversation List - View all chat conversations
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { Conversation, ChatMode } from '../types/chat';
import { listConversations, createConversation, deleteConversation } from '../services/chatService';


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
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat Conversations</h1>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md active:scale-95 transition-all text-sm font-medium"
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
        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            Start a new conversation to get AI-powered teaching support
          </p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
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
              className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30 transition-all cursor-pointer p-5 group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {conv.title || 'Untitled Conversation'}
                </h3>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${getModeColor(conv.mode).replace('bg-orange-100 text-orange-700', 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400').replace('bg-blue-100 text-blue-700', 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400').replace('bg-green-100 text-green-700', 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400').replace('bg-cyan-100 text-cyan-700', 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400').replace('bg-purple-100 text-purple-700', 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400')}`}>
                  {conv.mode}
                </span>
                {conv.subject && (
                  <span className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                    {conv.subject}
                  </span>
                )}
                {conv.grade && (
                  <span className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                    Grade {conv.grade}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 dark:border-white/5">
                <p className="text-xs text-gray-500 font-medium italic">
                  {conv.message_count} messages
                </p>

                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {conv.last_message_at
                    ? `${formatTimeAgo(conv.last_message_at)}`
                    : `${formatTimeAgo(conv.created_at)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Conversation Modal */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Start New Conversation</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Chat Mode</label>
                <select
                  value={newConv.mode}
                  onChange={(e) => setNewConv({ ...newConv, mode: e.target.value as ChatMode })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                >
                  <option value="explain">Explain - Concept Explanation</option>
                  <option value="plan">Plan - Lesson Planning</option>
                  <option value="assist">Assist - Teaching Support</option>
                  <option value="ask">Ask - General Q&A</option>
                  <option value="general">General - Free Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Subject (optional)</label>
                <input
                  type="text"
                  value={newConv.subject || ''}
                  onChange={(e) => setNewConv({ ...newConv, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Grade</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newConv.grade || ''}
                    onChange={(e) => setNewConv({ ...newConv, grade: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                    placeholder="1-12"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Topic</label>
                  <input
                    type="text"
                    value={newConv.topic || ''}
                    onChange={(e) => setNewConv({ ...newConv, topic: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                    placeholder="Topic name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">First Message</label>
                <textarea
                  value={newConv.initial_message || ''}
                  onChange={(e) => setNewConv({ ...newConv, initial_message: e.target.value })}
                  rows={3}
                  placeholder="Ask your first question..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all font-medium text-sm"
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
