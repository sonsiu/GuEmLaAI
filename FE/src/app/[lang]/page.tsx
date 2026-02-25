'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/@core/contexts/AuthContext'

export default function RootPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const lang = params.lang as string

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      // Redirect authenticated users to dashboard
      router.push(`/${lang}/(dashboard)`)
    } else {
      // Redirect unauthenticated users to landing page
      router.push(`/${lang}/(blank-layout-pages)/landing`)
    }
  }, [isAuthenticated, isLoading, lang, router])

  // Show nothing while redirecting
  return null
}
