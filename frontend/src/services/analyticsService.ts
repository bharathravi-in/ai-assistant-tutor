import api from './api';

export interface UsageStats {
  period_days: number;
  total_queries: number;
  queries_by_mode: Record<string, number>;
  content_created: number;
  reflections: {
    total: number;
    worked: number;
    not_worked: number;
    success_rate: number;
  };
  chat: {
    conversations: number;
    messages: number;
    avg_messages_per_conversation: number;
  };
  daily_activity: Array<{ date: string; queries: number }>;
  top_subjects: Array<{ subject: string; count: number }>;
}

export interface ContentEngagement {
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  recent_content: Array<{
    id: number;
    title: string;
    type: string;
    status: string;
    views: number;
    likes: number;
    downloads: number;
    created_at: string;
  }>;
  total_content: number;
}

export const getTeacherUsageStats = async (days: number = 30): Promise<UsageStats> => {
  const response = await api.get(`/analytics/teacher/usage?days=${days}`);
  return response.data;
};

export const getContentEngagement = async (): Promise<ContentEngagement> => {
  const response = await api.get('/analytics/content/engagement');
  return response.data;
};

export const getSystemMetrics = async (days: number = 7) => {
  const response = await api.get(`/analytics/admin/system-metrics?days=${days}`);
  return response.data;
};

export const getCRPActivity = async (days: number = 7) => {
  const response = await api.get(`/analytics/admin/crp-activity?days=${days}`);
  return response.data;
};
