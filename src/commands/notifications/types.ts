export type NotificationChannel = "email";

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  link_url: string | null;
  source: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  delivery_error: string | null;
  created_at: string;
  updated_at: string;
}
