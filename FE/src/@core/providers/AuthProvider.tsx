// src/@core/providers/AuthProvider.tsx
'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTranslation } from '../hooks/useTranslation'
import { ClientApi } from '@/services/client-api.service'

const Loading = dynamic(() => import('@core/components/loading/Loading'), {
  ssr: false
})

type AuthProviderProps = {
  children: ReactNode
  fallback?: ReactNode
  onAuth?: () => void
  redirectTo?: string
}

export const AuthProvider = ({ children, onAuth, redirectTo = '/login' }: AuthProviderProps) => {
  const { lang } = useTranslation()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')

        if (!accessToken) {
          router.replace(`/${lang}${redirectTo}`)
          return
        }

        ClientApi.setAccessToken(accessToken)
        setIsAuthenticated(true)
        onAuth?.()
      } catch (error) {
        router.replace(`/${lang}${redirectTo}`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, onAuth, lang, redirectTo])

  if (isLoading) {
    //console.log('isLoading', isLoading)
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Loading />
  }

  return <>{children}</>
}
