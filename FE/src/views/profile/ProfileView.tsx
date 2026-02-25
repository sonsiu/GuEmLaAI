'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { userService } from '@/services/user.service'
import type { UserProfile } from '@/services/user.types'
import StatisticsSection from './components/StatisticsSection'
import ProfileInfoView from './components/ProfileInfoView'

type TabValue = 'statistics' | 'profile'

const ProfileView: React.FC = () => {
  const theme = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('statistics')
  const [refreshKey, setRefreshKey] = useState(0)

  // Check authentication and fetch data
  useEffect(() => {
    const fetchData = async () => {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        router.push(`/${lang}/login`)
        return
      }

      try {
        setLoading(true)
        await fetchUserProfile()
      } catch (err) {
        // console.error('Error fetching profile data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, lang, refreshKey])

  const fetchUserProfile = async () => {
    try {
      const profileData = await userService.getUserProfileFromBackend()

      setProfile(profileData)
    } catch (err) {
      // console.error('Failed to fetch user profile from backend:', err)
    }
  }

  const handleProfileUpdate = () => {
    // Trigger a refresh of profile data
    setRefreshKey(prev => prev + 1)
  }

  const displayName = profile?.displayName || user?.displayName || user?.email || 'User'
  const profileImageUrl = profile?.profilePictureUrl || user?.avatar

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Cover Photo Section */}
      <Box
        sx={{
          position: 'relative',
          mb: { xs: 10, sm: 12, md: 14 },
          borderRadius: { xs: 1, sm: 2 },
          overflow: 'visible'
        }}
      >
        <Box
          sx={{
            height: { xs: 128, sm: 160, md: 192 },
            width: '100%',
            borderRadius: { xs: 1, sm: 2 },
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
          }}
        />

        {/* Profile Picture */}
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: -40, sm: -48, md: -56 },
            left: { xs: 3, sm: 4, md: 6 },
            zIndex: 2
          }}
        >
          <Avatar
            src={profileImageUrl || undefined}
            alt={displayName}
            sx={{
              width: { xs: 80, sm: 96, md: 112 },
              height: { xs: 80, sm: 96, md: 112 },
              border: `4px solid ${theme.palette.background.paper}`,
              bgcolor: theme.palette.primary.main,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 'bold',
              boxShadow: theme.shadows[8]
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: TabValue) => setActiveTab(value)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab
            label={t('profile.tabs.statistics')}
            value="statistics"
            icon={<i className='tabler-chart-bar' style={{ marginRight: '8px' }}></i>}
            iconPosition="start"
          />
          <Tab
            label={t('profile.tabs.profileInfo')}
            value="profile"
            icon={<i className='tabler-user' style={{ marginRight: '8px' }}></i>}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <Box>
          <StatisticsSection />
        </Box>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ProfileInfoView
          displayName={displayName}
          profileImageUrl={profileImageUrl || null}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </Box>
  )
}

export default ProfileView
