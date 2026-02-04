import React, { useState, useEffect } from 'react';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import { getConversations, getContacts, ConversationPreview, Contact } from '../services/messagingService';
import { MessageSquare, Search, PlusCircle, X, User as UserIcon } from 'lucide-react';

const MessagesPage: React.FC = () => {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(false);

    useEffect(() => {
        loadConversations();
        // Poll for new conversations/unread counts every 30s
        const interval = setInterval(loadConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = async () => {
        setShowContactPicker(true);
        setContactsLoading(true);
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (err) {
            console.error('Failed to load contacts:', err);
        } finally {
            setContactsLoading(false);
        }
    };

    const startConversation = (user: { id: number, name: string, role: string }) => {
        // Add to conversations locally if not already there
        if (!conversations.find(c => c.user_id === user.id)) {
            const newConv: ConversationPreview = {
                user_id: user.id,
                user_name: user.name,
                user_role: user.role,
                last_message: 'New conversation',
                last_message_at: new Date().toISOString(),
                unread_count: 0
            };
            setConversations([newConv, ...conversations]);
        }
        setSelectedUserId(user.id);
        setShowContactPicker(false);
    };

    const selectedConversation = conversations.find(c => c.user_id === selectedUserId);

    const filteredConversations = conversations.filter(c =>
        c.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full bg-[#F8F9FB] dark:bg-gray-900 overflow-hidden relative">
            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 dark:border-white/10 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 dark:border-white/10 space-y-4 shadow-sm bg-white dark:bg-[#1C1C1E] z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
                        <button
                            onClick={handleNewMessage}
                            className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 group"
                            title="New Message"
                        >
                            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 text-sm transition-all dark:text-white shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        conversations={filteredConversations}
                        activeUserId={selectedUserId}
                        onSelectConversation={setSelectedUserId}
                        loading={loading}
                    />
                </div>

            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex items-center justify-center bg-slate-50 dark:bg-black/20' : 'flex'}`}>
                {selectedUserId && selectedConversation ? (
                    <ChatWindow
                        userId={selectedUserId}
                        userName={selectedConversation.user_name}
                        onBack={() => setSelectedUserId(null)}
                    />
                ) : (
                    <div className="text-center p-8 max-w-sm">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a message</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose a conversation from the list or start a new message to connect with CRPs or other colleagues.
                        </p>
                    </div>
                )}
            </div>

            {/* Contact Picker Modal */}
            {showContactPicker && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">New Message</h3>
                            <button onClick={() => setShowContactPicker(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {contactsLoading ? (
                                <div className="flex flex-col gap-4 p-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No suggested contacts found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {contacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => startConversation(contact)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left group"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 shadow-sm transition-all">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{contact.name}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                                    <span>{contact.role}</span>
                                                    <span className="opacity-40">•</span>
                                                    <span className="truncate">{contact.reason}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
