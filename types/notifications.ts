/**
 * Notification System Core Types.
 */

export type NotificationEventType =
  | "like"
  | "reply"
  | "reminder"
  | "admin"
  | "survey"
  | "announcement";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface PushSubscriptionPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderTime?: string; // HH:mm format
  updatedAt: string;
}
