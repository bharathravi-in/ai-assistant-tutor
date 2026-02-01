/**
 * Chat API Service
 */
import axios from 'axios';
import { Conversation, ChatMessage, ChatSendResponse, TeacherProfile, ChatMode } from '@/types/chat';

// Use relative path - the dev server proxy handles routing
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

// Profile APIs
export const getProfile = async (): Promise<TeacherProfile> => {
  const response = await api.get('/chat/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<TeacherProfile>): Promise<TeacherProfile> => {
  const response = await api.put('/chat/profile', data);
  return response.data;
};

// Conversation APIs
export const createConversation = async (data: {
  mode: ChatMode;
  title?: string;
  grade?: number;
  subject?: string;
  topic?: string;
  initial_message?: string;
}): Promise<Conversation> => {
  const response = await api.post('/chat/conversations', data);
  return response.data;
};

export const listConversations = async (params?: {
  page?: number;
  page_size?: number;
  mode?: ChatMode;
  is_active?: boolean;
}): Promise<{
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> => {
  const response = await api.get('/chat/conversations', { params });
  return response.data;
};

export const getConversation = async (conversationId: number): Promise<Conversation> => {
  const response = await api.get(`/chat/conversations/${conversationId}`);
  return response.data;
};

export const updateConversation = async (
  conversationId: number,
  data: { title?: string; is_active?: boolean }
): Promise<Conversation> => {
  const response = await api.patch(`/chat/conversations/${conversationId}`, data);
  return response.data;
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
  await api.delete(`/chat/conversations/${conversationId}`);
};

// Message APIs
export const sendMessage = async (
  conversationId: number,
  data: {
    content: string;
    language?: string;
    voice_note_url?: string;
  }
): Promise<ChatSendResponse> => {
  const response = await api.post(`/chat/conversations/${conversationId}/messages`, data);
  return response.data;
};

export const getMessages = async (
  conversationId: number,
  params?: { limit?: number; before_id?: number }
): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
  return response.data;
};
