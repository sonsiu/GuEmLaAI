/**
 * Admin Dashboard Type Definitions
 */

export interface AdminUser {
  id: number
  email: string
  displayName: string
  role: number
  createDate: string
}

export interface DashboardStats {
  totalUsers: number
  totalItems: number
  totalOutfits: number
  analytics: AnalyticsStats
  timestamp: string
}

export interface AnalyticsStats {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  userTypeStats: UserTypeStats
}

export interface UserTypeStats {
  total: number
  registered: number
  anonymous: number
}

export interface VisitChartData {
  date: string
  count: number
}

export interface UpdateRoleRequest {
  newRole: number
}

export enum UserRole {
  Admin = 1,
  User = 3,
}

export const isAdmin = (role: number): boolean => {
  return role === UserRole.Admin;
};
