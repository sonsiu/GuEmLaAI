'use client'

// React Imports
import React, { useEffect, useState, useCallback } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { useTranslation } from '@/@core/hooks/useTranslation'

// Service Imports
import { adminService } from '@/services/admin.service'
import { showErrorToast } from '@/services/toast.service'

// Type Imports
import type { DashboardStats, VisitChartData } from '@/types/admin.type'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { isAdmin: isUserAdmin, user, loading: authLoading } = useAdminAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<VisitChartData[]>([])
  const [chartDays, setChartDays] = useState(7)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    if (!user?.accessToken) return

    setDataLoading(true)
    setError(null)

    try {
      const statsData = await adminService.getDashboardStats()

      setStats(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('admin.dashboard.errors.loadDashboard')

      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setDataLoading(false)
    }
  }, [user?.accessToken, t])

  const loadChartData = useCallback(async () => {
    if (!user?.accessToken) return

    try {
      const data = await adminService.getVisitsChart(chartDays)

      setChartData(data)
    } catch (err) {
      // console.error(t('admin.dashboard.errors.loadChart'), err)
    }
  }, [user?.accessToken, chartDays, t])

  useEffect(() => {
    if (user?.accessToken && isUserAdmin) {
      loadDashboardData()
    }
  }, [user, isUserAdmin, loadDashboardData])

  useEffect(() => {
    if (user?.accessToken && isUserAdmin) {
      loadChartData()
    }
  }, [user, isUserAdmin, chartDays, loadChartData])

  const theme = useTheme()

  // Prepare chart data cho ApexCharts
  const chartCategories = (chartData || []).map(point => {
    if (!point?.date) return ''

    try {
      const date = new Date(point.date)

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  })

  const chartSeries = [
    {
      name: t('admin.dashboard.analytics.totalVisits') || 'Visits',
      data: (chartData || []).map(point => point?.count || 0)
    }
  ]

  // Create chart options - copy cấu hình chart line chuẩn đang dùng trong project
  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      zoom: {
        enabled: false
      },
      parentHeightOffset: 0,
      animations: { enabled: true },
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 5,
      curve: 'smooth',
      colors: ['var(--mui-palette-primary-main)']
    },
    colors: ['var(--mui-palette-primary-main)'],
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    markers: {
      size: 4,
      colors: ['var(--mui-palette-primary-main)'],
      strokeColors: 'var(--mui-palette-background-paper)',
      strokeWidth: 2
    },
    xaxis: {
      categories: chartCategories,
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)',
          fontFamily: theme.typography.fontFamily
        }
      },
      axisBorder: {
        color: 'var(--mui-palette-divider)'
      },
      axisTicks: {
        color: 'var(--mui-palette-divider)'
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)',
          fontFamily: theme.typography.fontFamily
        }
      }
    },
    tooltip: {
      enabled: true
    }
  }

  // Show loading if auth is still checking
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>{t('admin.dashboard.checkingAuth')}</Typography>
        </Box>
      </Box>
    )
  }

  // Show loading if not admin (will redirect)
  if (!isUserAdmin) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>{t('admin.dashboard.redirecting')}</Typography>
        </Box>
      </Box>
    )
  }

  if (dataLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>{t('admin.dashboard.loading')}</Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 4
        }}
      >
        <Alert severity='error' sx={{ maxWidth: 500 }}>
          <Typography variant='h6' gutterBottom>
            {t('admin.dashboard.accessError')}
          </Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-info-main) 100%)',
          color: 'white',
          py: 4
        }}
      >
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 } }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className='tabler-shield' style={{ fontSize: '2rem' }}></i>
              </Box>
              <Box>
                <Typography variant='h4' fontWeight={700} gutterBottom>
                  {t('admin.dashboard.title')}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {t('admin.dashboard.welcomeBack').replace('{name}', user?.displayName || user?.email || '')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant='contained'
              onClick={() => {
                loadDashboardData()
                loadChartData()
              }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                }
              }}
              startIcon={<i className='tabler-refresh'></i>}
            >
              {t('admin.dashboard.refresh')}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 }, py: 4 }}>
        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4
          }}
        >
          {/* Total Users */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(0, 188, 212, 0.1) 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-users text-white' style={{ fontSize: '1.5rem' }}></i>
                </Box>
                <i className='tabler-trending-up text-primary' style={{ fontSize: '1.5rem' }}></i>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('admin.dashboard.stats.totalUsers')}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {stats?.totalUsers.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Items */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(233, 30, 99, 0.1) 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-package text-white' style={{ fontSize: '1.5rem' }}></i>
                </Box>
                <i className='tabler-trending-up text-secondary' style={{ fontSize: '1.5rem' }}></i>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('admin.dashboard.stats.totalItems')}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {stats?.totalItems.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Outfits */}
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-shirt text-white' style={{ fontSize: '1.5rem' }}></i>
                </Box>
                <i className='tabler-trending-up text-warning' style={{ fontSize: '1.5rem' }}></i>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('admin.dashboard.stats.totalOutfits')}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {stats?.totalOutfits.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Analytics Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <i className='tabler-activity text-primary' style={{ fontSize: '1.5rem' }}></i>
            <Typography variant='h5' fontWeight={700}>
              {t('admin.dashboard.analytics.title')}
            </Typography>
          </Box>

          {/* Analytics Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 3
            }}
          >
            {/* Total Visits */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <i className='tabler-eye text-primary' style={{ fontSize: '2rem' }}></i>
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  {t('admin.dashboard.analytics.totalVisits')}
                </Typography>
                <Typography variant='h5' fontWeight={700}>
                  {stats?.analytics.totalVisits.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Unique Visitors */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <i className='tabler-users text-info' style={{ fontSize: '2rem' }}></i>
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  {t('admin.dashboard.analytics.uniqueVisitors')}
                </Typography>
                <Typography variant='h5' fontWeight={700}>
                  {stats?.analytics.uniqueVisitors.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Today's Visits */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <i className='tabler-activity text-success' style={{ fontSize: '2rem' }}></i>
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  {t('admin.dashboard.analytics.todayVisits')}
                </Typography>
                <Typography variant='h5' fontWeight={700}>
                  {stats?.analytics.todayVisits.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Registered vs Anonymous */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <i className='tabler-user-check text-primary' style={{ fontSize: '1.5rem' }}></i>
                  <i className='tabler-user-x text-disabled' style={{ fontSize: '1.5rem' }}></i>
                </Box>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {t('admin.dashboard.analytics.userTypes')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='caption' color='text.secondary'>
                      {t('admin.dashboard.analytics.registered')}
                    </Typography>
                    <Typography variant='h6' fontWeight={700} color='primary.main'>
                      {stats?.analytics.userTypeStats.registered || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='caption' color='text.secondary'>
                      {t('admin.dashboard.analytics.anonymous')}
                    </Typography>
                    <Typography variant='h6' fontWeight={700} color='text.disabled'>
                      {stats?.analytics.userTypeStats.anonymous || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Visits Chart */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Typography variant='h6' fontWeight={700}>
                  {t('admin.dashboard.analytics.visitsOverTime')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[7, 14, 30].map(days => (
                    <Button
                      key={days}
                      variant={chartDays === days ? 'contained' : 'outlined'}
                      size='small'
                      onClick={() => setChartDays(days)}
                      sx={{ minWidth: 60 }}
                    >
                      {days}d
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* ApexCharts Area Chart - dùng trục & tooltip mặc định */}
              {chartData && chartData.length > 0 && chartSeries[0]?.data?.length > 0 ? (
                <AppReactApexCharts type='area' height={350} options={chartOptions} series={chartSeries} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color='text.secondary'>{t('admin.dashboard.analytics.noVisitData')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard
