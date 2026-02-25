'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import {
  HeroBannerSection,
  PublicCollectionsSection,
  WeatherOutfitSection
} from '@/components/home'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { IAccount } from '@/types/auth.type'
import { USER_ROLE } from '@/@core/constants/global.const'

const HomeView: React.FC = () => {
  const router = useRouter()
  const { setUser } = useAuth()
  const { lang } = useTranslation()

  useEffect(() => {
    // Check if there are Google auth parameters in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('accessToken')
    const displayName = urlParams.get('displayName')
    const id = urlParams.get('id')
    const role = urlParams.get('role')

    if (accessToken && displayName && id && role) {
      // Google authentication data found in URL
      const userData: IAccount = {
        id: id,
        displayName: displayName,
        fullName: urlParams.get('fullName') || displayName,
        email: urlParams.get('email') || '',
        role: parseInt(role) as USER_ROLE,
        accessToken: accessToken,
        referralCode: urlParams.get('referralCode') || undefined,
        referralStatus: urlParams.get('referralStatus') || undefined,
        referredById: urlParams.get('referredById') ? parseInt(urlParams.get('referredById')!) : undefined,
        itemUploadCount: urlParams.get('itemUploadCount') ? parseInt(urlParams.get('itemUploadCount')!) : 0,
        outfitUploadCount: urlParams.get('outfitUploadCount') ? parseInt(urlParams.get('outfitUploadCount')!) : 0,
        virtualTryOnUsedCount: urlParams.get('virtualTryOnUsedCount')
          ? parseInt(urlParams.get('virtualTryOnUsedCount')!)
          : 0,
        avatar: urlParams.get('avatar') || undefined,
        isActive: true
      }

      // Update auth context (this will also handle localStorage)
      setUser(userData)

      // Clean URL by removing auth parameters
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)

      //console.log('✅ Google OAuth - User logged in:', userData.displayName, 'Role:', userData.role)

      // Redirect admin users to admin dashboard
      if (userData.role === USER_ROLE.ADMIN) {
        //console.log('✅ Admin user - redirecting to /admin')
        router.push(`/${lang}/admin`)
      } else {
        //console.log('✅ Regular user - staying on /home')
      }
    }
  }, [setUser, router, lang])

  return (
    <Box
      component='main'
      sx={{
        minHeight: '100vh',
        color: 'text.primary'
      }}
      className='min-h-screen w-full'
    >
      <HeroBannerSection />
      <PublicCollectionsSection />
    
    </Box>
  )
}

export default HomeView
