/**
 * Chat & Conversation Types
 */

export type ChatMode = 'explain' | 'plan' | 'assist' | 'ask' | 'general';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  structured_data?: Record<string, any>;
  suggested_followups?: string[];
  ai_model?: string;
  tokens_used?: number;
  response_time_ms?: number;
  language?: string;
  was_voice_input: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  mode: ChatMode;
  title?: string;
  grade?: number;
  subject?: string;
  topic?: string;
  context_data?: Record<string, any>;
  message_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  messages?: ChatMessage[];
}

export interface TeacherProfile {
  id: number;
  user_id: number;
  primary_grades?: number[];
  primary_subjects?: string[];
  school_type?: string;
  location?: string;
  preferred_language?: string;
  teaching_style?: string;
  preferred_ai_tone?: string;
  common_challenges?: string[];
  favorite_topics?: string[];
  total_conversations: number;
  total_messages: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSendResponse {
  user_message: ChatMessage;
  ai_response: ChatMessage;
  conversation: Conversation;
}
