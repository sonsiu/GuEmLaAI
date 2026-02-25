'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTranslation } from '../hooks/useTranslation'
import { DEFAULT_URL } from '../constants/global.const'

const Loading = dynamic(() => import('@core/components/loading/Loading'), {
  ssr: false
})

type GuestProviderProps = {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  isNotCheck?: boolean
}

export const PublicProvider = ({ children, redirectTo = DEFAULT_URL, isNotCheck }: GuestProviderProps) => {
  const router = useRouter()
  const { lang } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (isNotCheck) {
        setIsPublic(true)
        setIsLoading(false)
        return
      }

      try {
        const accessToken = localStorage.getItem('accessToken')

        if (accessToken) {
          router.replace(`/${lang}${redirectTo}`)
          return
        }

        setIsPublic(true)
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, redirectTo, lang])

  if (isLoading) {
    return <Loading />
  }

  if (!isPublic) {
    return <Loading />
  }

  return <>{children}</>
}
