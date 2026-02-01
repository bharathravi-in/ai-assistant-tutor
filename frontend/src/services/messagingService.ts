/**
 * Direct Messaging Service
 * For Teacher-CRP communication
 */
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface DirectMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    receiver_id: number;
    receiver_name: string;
    content: string;
    query_id?: number;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

export interface ConversationPreview {
    user_id: number;
    user_name: string;
    user_role: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

export interface Contact {
    id: number;
    name: string;
    role: string;
    reason: string;
}

export interface SendMessageRequest {
    receiver_id: number;
    content: string;
    query_id?: number;
}

/**
 * Send a direct message
 */
export const sendMessage = async (data: SendMessageRequest): Promise<DirectMessage> => {
    const response = await api.post('/messages/send', data);
    return response.data;
};

/**
 * Get list of conversations
 */
export const getConversations = async (): Promise<ConversationPreview[]> => {
    const response = await api.get('/messages/conversations');
    return response.data;
};

/**
 * Get messages with a specific user
 */
export const getMessagesWithUser = async (
    userId: number,
    limit = 50,
    beforeId?: number
): Promise<DirectMessage[]> => {
    const params: Record<string, any> = { limit };
    if (beforeId) {
        params.before_id = beforeId;
    }
    const response = await api.get(`/messages/with/${userId}`, { params });
    return response.data;
};

/**
 * Mark a message as read
 */
export const markMessageRead = async (messageId: number): Promise<void> => {
    await api.post(`/messages/${messageId}/read`);
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/messages/unread-count');
    return response.data;
};

/**
 * Get recommended contacts
 */
export const getContacts = async (): Promise<Contact[]> => {
    const response = await api.get('/messages/contacts');
    return response.data;
};
