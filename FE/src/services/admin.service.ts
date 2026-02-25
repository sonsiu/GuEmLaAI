/**
 * Admin API Service
 * Handles all admin-related API calls
 */

import { ClientApi } from './client-api.service'
import type { AdminUser, DashboardStats, VisitChartData } from '@/types/admin.type'

export const adminService = {
  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await ClientApi.get<AdminUser[]>('/Admin/users')
    const rawResponse = response.getRaw()

    if (rawResponse.success && rawResponse.data) {
      // Handle both array response and wrapped response
      if (Array.isArray(rawResponse.data)) {
        return rawResponse.data
      }

      return rawResponse.data as AdminUser[]
    }

    throw new Error('Failed to fetch users')
  },

  /**
   * Get dashboard statistics (admin only)
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await ClientApi.get<DashboardStats>('/Admin/dashboard/stats')
    const rawResponse = response.getRaw()

    if (rawResponse.success && rawResponse.data) {
      return rawResponse.data
    }

    throw new Error('Failed to fetch dashboard stats')
  },

  /**
   * Get visits chart data (admin only)
   */
  getVisitsChart: async (days: number = 30): Promise<VisitChartData[]> => {
    const response = await ClientApi.get<VisitChartData[]>(`/Admin/analytics/chart?days=${days}`)
    const rawResponse = response.getRaw()

    if (rawResponse.success && rawResponse.data) {
      // Handle both array response and wrapped response
      if (Array.isArray(rawResponse.data)) {
        return rawResponse.data
      }

      return rawResponse.data as VisitChartData[]
    }

    throw new Error('Failed to fetch visits chart')
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole: async (userId: number, newRole: number): Promise<void> => {
    const response = await ClientApi.put(`/Admin/users/${userId}/role`, { newRole })
    const rawResponse = response.getRaw()

    if (!rawResponse.success) {
      throw new Error(rawResponse.message || 'Failed to update user role')
    }
  }
}

