'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { IAccount } from '@/types/auth.type'
import { ClientApi } from '@/services/client-api.service'
import { userService } from '@/services/user.service'

interface AuthContextType {
  user: IAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: IAccount | null) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<IAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tokenLoaded, setTokenLoaded] = useState(false)

  // Hàm fetch profile từ API và cập nhật vào user
  const fetchAndUpdateProfile = useCallback(async (currentUser: IAccount) => {
    try {
      const profileData = await userService.getUserProfileFromBackend()

      // Cập nhật user với thông tin từ profile API
      const updatedUser: IAccount = {
        ...currentUser,
        displayName: profileData.displayName || currentUser.displayName || currentUser.email,
        avatar: profileData.profilePictureUrl || currentUser.avatar
      }

      setUserState(updatedUser)

      // User info should always be fetched from the backend or retrieved from the auth context

      return updatedUser
    } catch (error) {
      //console.error('Error fetching user profile:', error)

      // Nếu lỗi, vẫn giữ user hiện tại
      return currentUser
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      //console.warn('Logout request failed, clearing local session only.', error)
    }

    setUserState(null)
    localStorage.removeItem('accessToken')
    ClientApi.setAccessToken('')
  }, [])

  // Stage 1: Load and restore token from localStorage IMMEDIATELY
  useEffect(() => {
    try {
      const accessToken = localStorage.getItem('accessToken')

      if (accessToken) {
        // Set access token for API calls BEFORE anything else
        ClientApi.setAccessToken(accessToken)
      } else {
        setUserState(null)
        ClientApi.setAccessToken('')
      }
    } catch (error) {
      //.error('Error loading access token from localStorage:', error)
      setUserState(null)
      ClientApi.setAccessToken('')
    } finally {
      // Mark token as loaded so components know they can use it
      setTokenLoaded(true)
    }
  }, [])

  // Stage 2: Fetch user profile ONLY after token is loaded
  useEffect(() => {
    if (!tokenLoaded) return

    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')

        if (!accessToken) {
          setUserState(null)
          setIsLoading(false)
          return
        }

        // Fetch user profile from backend
        try {
          const response = await ClientApi.get<any>('/UserProfile/profile')
          const profileData = response.getRaw().data

          if (profileData) {
            // Create user object from profile data
            const userData: IAccount = {
              id: profileData.id || '',
              email: profileData.email || '',
              displayName: profileData.displayName || '',
              fullName: profileData.fullName || profileData.displayName || '',
              avatar: profileData.profilePictureUrl,
              role: profileData.role,
              accessToken: accessToken,
              isActive: profileData.isActive !== false
            }

            setUserState(userData)
          } else {
            setUserState(null)
          }
        } catch (profileError) {
          //console.warn('Failed to fetch user profile:', profileError)
          setUserState(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        fetchUserProfile()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [tokenLoaded])

  const setUser = async (userData: IAccount | null) => {
    setUserState(userData)

    if (userData) {
      // Set access token for API calls
      if (userData.accessToken) {
        localStorage.setItem('accessToken', userData.accessToken)
        ClientApi.setAccessToken(userData.accessToken)

        // Gọi API Profile để lấy avatar và displayName mới nhất sau khi login
        // Gọi trong background để không block UI
        fetchAndUpdateProfile(userData).catch(error => {
          //console.error('Error updating profile after setUser:', error)
        })
      }
    } else {
      localStorage.removeItem('accessToken')
      ClientApi.setAccessToken('')
    }
  }

  useEffect(() => {
    ClientApi.setUnauthorizedHandler(logout)

    return () => {
      ClientApi.clearUnauthorizedHandler()
    }
  }, [logout])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setUser,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
