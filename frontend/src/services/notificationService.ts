import api from './api';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

export const getNotifications = async (unreadOnly: boolean = false, limit: number = 50): Promise<Notification[]> => {
  const response = await api.get(`/notifications/?unread_only=${unreadOnly}&limit=${limit}`);
  return response.data;
};

export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await api.get('/notifications/stats');
  return response.data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

export const archiveNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
