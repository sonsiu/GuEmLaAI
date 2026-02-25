/**
 * Notification API Service
 * Handles all notification-related API calls
 * 
 * Semantics: isRead = false (ACTIVE), isRead = true (INACTIVE)
 */

import { ClientApi } from './client-api.service'
import type { GlobalNotification, SendGlobalNotificationRequest, GlobalNotificationResponse } from '@/types/notification.type'

export const notificationService = {
  /**
   * Send global notification (admin only)
   */
  sendGlobalNotification: async (request: SendGlobalNotificationRequest): Promise<GlobalNotification> => {
    const response = await ClientApi.post<GlobalNotificationResponse>('/notification/global', request)
    const rawResponse = response.getRaw()

    if (rawResponse.success && rawResponse.data) {
      // Handle nested data structure from backend
      const data = rawResponse.data as any
      const notification = data.data || rawResponse.data
      return notification as GlobalNotification
    }

    throw new Error(rawResponse.message || 'Failed to send global notification')
  },

  /**
   * Get global notifications (activeOnly fetches only active notifications: isRead = false)
   */
  getGlobalNotifications: async (activeOnly: boolean = true, limit: number = 50): Promise<GlobalNotification[]> => {
    const response = await ClientApi.get<GlobalNotificationResponse>(
      `/notification/global?unreadOnly=${activeOnly}&limit=${limit}`
    )
    const rawResponse = response.getRaw()

    if (rawResponse.success && rawResponse.data) {
      const data = rawResponse.data
      if (Array.isArray(data)) {
        return data
      }

      const notificationList = (data as any)?.data || []
      return Array.isArray(notificationList) ? notificationList : []
    }

    throw new Error(rawResponse.message || 'Failed to fetch global notifications')
  },

  /**
   * Toggle global notification status (admin only)
   * isRead = false means ACTIVE, isRead = true means INACTIVE
   */
  setGlobalNotificationStatus: async (id: number, isRead: boolean): Promise<void> => {
    const response = await ClientApi.patch(`/notification/global/${id}/${isRead}`, {})
    const rawResponse = response.getRaw()

    if (!rawResponse.success) {
      throw new Error(rawResponse.message || 'Failed to update notification status')
    }
  },

  /**
   * Delete global notification (admin only)
   */
  deleteGlobalNotification: async (id: number): Promise<void> => {
    const response = await ClientApi.delete(`/notification/global/${id}`)
    const rawResponse = response.getRaw()

    if (!rawResponse.success) {
      throw new Error(rawResponse.message || 'Failed to delete notification')
    }
  }
}


