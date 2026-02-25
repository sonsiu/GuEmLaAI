'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/types/admin.type'
import { useAuth } from '@/@core/contexts/AuthContext'

export const useAdminAuth = () => {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth context to finish loading
    if (isLoading) {
      return
    }

    setIsChecking(false)

    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (!isAdmin(user.role)) {
      router.push('/')
      return
    }
  }, [user, isLoading, router])

  return {
    isAdmin: user ? isAdmin(user.role) : false,
    user,
    loading: isChecking || isLoading
  }
}

