import React from 'react';
import { ConversationPreview } from '../../services/messagingService';
import { User, MessageSquare } from 'lucide-react';

interface ConversationListProps {
    conversations: ConversationPreview[];
    activeUserId: number | null;
    onSelectConversation: (userId: number) => void;
    loading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    activeUserId,
    onSelectConversation,
    loading
}) => {
    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-4 text-center">
                <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                <p>No messages yet.</p>
                <p className="text-sm">When you message a CRP or they message you, it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col border-r h-full overflow-y-auto bg-white">
            <div className="p-4 border-b font-semibold text-gray-700 flex justify-between items-center">
                <span>Messages</span>
            </div>
            <div className="flex-1">
                {conversations.map((conv) => (
                    <button
                        key={conv.user_id}
                        onClick={() => onSelectConversation(conv.user_id)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b text-left ${activeUserId === conv.user_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                            }`}
                    >
                        <div className={`relative w-12 h-12 flex items-center justify-center rounded-full ${conv.user_role === 'crp' ? 'bg-purple-100 text-purple-600' :
                                conv.user_role === 'arp' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                            }`}>
                            <User className="w-6 h-6" />
                            {conv.unread_count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                    {conv.unread_count}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold text-gray-900 truncate">{conv.user_name}</h4>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                    {new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                {conv.user_role}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ConversationList;
