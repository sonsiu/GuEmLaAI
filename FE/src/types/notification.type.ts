/**
 * Notification Type Definitions
 */

export enum NotificationType {
  SYSTEM = 0,
  WELCOME = 1,
  CREDIT = 2,
  REFERRAL = 3,
  PAYMENT = 4,
  REMINDER = 5
}

export enum NotificationCategory {
  Info = 0,
  Warning = 1,
  Error = 2,
  Success = 3
}

export interface GlobalNotification {
  id: number
  userId: number | null
  content: string
  type: NotificationType | string
  category?: NotificationCategory
  isRead: boolean
  createdAt: string
  updatedAt?: string
}

export interface SendGlobalNotificationRequest {
  en?: string
  vn?: string
  type?: NotificationType
}

export interface GlobalNotificationResponse {
  success: boolean
  message: string
  data?: GlobalNotification | GlobalNotification[]
  count?: number
}
