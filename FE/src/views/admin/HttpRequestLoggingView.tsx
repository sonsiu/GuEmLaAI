'use client'

import React, { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'

import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { ClientApi } from '@/services/client-api.service'
import { showErrorToast } from '@/services/toast.service'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

interface HttpRequestLog {
  id: number
  requestTime: string
  method: string
  path: string
  statusCode: number
  elapsedMilliseconds: number
  userId?: number
  ipAddress?: string
  controller?: string
  action?: string
}

interface ChartStats {
  byStatusCode: { [key: number]: number }
  byMethod: { [key: string]: number }
  byPath: { [key: string]: number }
  responseTimeData: Array<{ date: string; avgTime: number }>
  responseTimeByEndpoint: { [endpoint: string]: Array<{ date: string; avgTime: number }> }
}

const HttpRequestLoggingView: React.FC = () => {
  const { t } = useTranslation()
  const { isAdmin, user, loading: authLoading } = useAdminAuth()
  const theme = useTheme()

  const [stats, setStats] = useState<ChartStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [userId, setUserId] = useState('')
  const [path, setPath] = useState('')
  const [statusCode, setStatusCode] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('')

  const fetchLogs = useCallback(async () => {
    // Check if user is authenticated by verifying user object (populated from header via auth context)
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Calculate 7 days ago
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const queryParams = new URLSearchParams()
      queryParams.append('limit', '1000')
      queryParams.append('startDate', startDate.toISOString())
      queryParams.append('endDate', endDate.toISOString())
      if (userId) queryParams.append('userId', userId)
      if (path) queryParams.append('path', path)
      if (statusCode) queryParams.append('statusCode', statusCode)

      const response = await ClientApi.get<HttpRequestLog[]>(
        `/HttpRequestLogging?${queryParams.toString()}`
      )

      const data = response.getRaw()

      if (data.success && Array.isArray(data.data)) {
        calculateStats(data.data)
      } else if (data.success && data.data) {
        // Handle case where data.data might be wrapped in another object
        const logsArray = Array.isArray(data.data) ? data.data : (data.data as any).data || []
        calculateStats(logsArray)
      } else {
        throw new Error(data?.message || 'Failed to fetch logs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch HTTP request logs'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, userId, path, statusCode])

  const calculateStats = (logsData: HttpRequestLog[]) => {
    const byStatusCode: { [key: number]: number } = {}
    const byMethod: { [key: string]: number } = {}
    const byPath: { [key: string]: number } = {}
    const responseTimeByDate: { [key: string]: { total: number; count: number } } = {}
    const responseTimeByEndpoint: { [endpoint: string]: { [date: string]: { total: number; count: number } } } = {}

    // Ensure logsData is an array before forEach
    if (!Array.isArray(logsData)) {
      setStats({
        byStatusCode,
        byMethod,
        byPath,
        responseTimeData: [],
        responseTimeByEndpoint: {}
      })
      return
    }

    logsData.forEach((log) => {
      // Status code distribution
      byStatusCode[log.statusCode] = (byStatusCode[log.statusCode] || 0) + 1

      // Method distribution
      byMethod[log.method] = (byMethod[log.method] || 0) + 1

      // Path distribution (endpoint tracking) - only use first two segments
      const pathSegments = log.path.split('/').filter(Boolean)
      const basePath = pathSegments.slice(0, 3).join('/')
      byPath[basePath] = (byPath[basePath] || 0) + 1

      // Response time by date (exclude CONNECT requests as they are tunneling/proxying)
      if (log.method !== 'CONNECT') {
        try {
          const logDate = new Date(log.requestTime)
          const dateKey = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          // Overall response time
          if (!responseTimeByDate[dateKey]) {
            responseTimeByDate[dateKey] = { total: 0, count: 0 }
          }
          
          // Response time by endpoint - use normalized base path
          const pathSegments = log.path.split('/').filter(Boolean)
          const basePath = pathSegments.slice(0, 3).join('/')
          
          if (!responseTimeByEndpoint[basePath]) {
            responseTimeByEndpoint[basePath] = {}
          }
          if (!responseTimeByEndpoint[basePath][dateKey]) {
            responseTimeByEndpoint[basePath][dateKey] = { total: 0, count: 0 }
          }
          
          if (log.elapsedMilliseconds && log.elapsedMilliseconds > 0) {
            responseTimeByDate[dateKey].total += log.elapsedMilliseconds
            responseTimeByDate[dateKey].count += 1
            responseTimeByEndpoint[basePath][dateKey].total += log.elapsedMilliseconds
            responseTimeByEndpoint[basePath][dateKey].count += 1
          }
        } catch (e) {
          // Silent fail on date parsing
        }
      }
    })

    const responseTimeData = Object.entries(responseTimeByDate)
      .map(([date, data]) => ({
        date,
        avgTime: data.count > 0 ? Math.round(data.total / data.count) : 0
      }))
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        } catch (e) {
          return 0
        }
      })

    // Convert endpoint response times to arrays
    const responseTimeByEndpointArray: { [endpoint: string]: Array<{ date: string; avgTime: number }> } = {}
    Object.entries(responseTimeByEndpoint).forEach(([endpoint, dateData]) => {
      responseTimeByEndpointArray[endpoint] = Object.entries(dateData)
        .map(([date, data]) => ({
          date,
          avgTime: data.count > 0 ? Math.round(data.total / data.count) : 0
        }))
        .sort((a, b) => {
          try {
            return new Date(a.date).getTime() - new Date(b.date).getTime()
          } catch (e) {
            return 0
          }
        })
    })

    setStats({
      byStatusCode,
      byMethod,
      byPath,
      responseTimeData,
      responseTimeByEndpoint: responseTimeByEndpointArray
    })
  }

  useEffect(() => {
    if (user && isAdmin) {
      fetchLogs()
    }
  }, [user, isAdmin])

  const handleFilter = () => {
    fetchLogs()
  }

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity='error'>{t('admin.httpLogging.errors.accessDenied')}</Alert>
      </Box>
    )
  }

  const statusCodeChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    colors: ['var(--mui-palette-primary-main)'],
    xaxis: {
      categories: Object.keys(stats?.byStatusCode || {}).map(String),
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        }
      },
      axisBorder: { color: 'var(--mui-palette-divider)' },
      axisTicks: { color: 'var(--mui-palette-divider)' }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        }
      }
    },
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    },
    tooltip: { enabled: true }
  }

  // Group small items as "Miscellaneous"
  const groupByPercentage = (dataObj: Record<string, number>, threshold: number = 2) => {
    const total = Object.values(dataObj).reduce((a, b) => a + b, 0)
    const result: Array<{ name: string; count: number }> = []
    let miscCount = 0

    Object.entries(dataObj).forEach(([key, count]) => {
      const percentage = (count / total) * 100
      if (percentage >= threshold) {
        result.push({ name: key, count })
      } else {
        miscCount += count
      }
    })

    if (miscCount > 0) {
      result.push({ name: 'Miscellaneous', count: miscCount })
    }

    return result.sort((a, b) => b.count - a.count)
  }

  const groupedEndpoints = groupByPercentage(stats?.byPath || {})
  const groupedMethods = groupByPercentage(stats?.byMethod || {})

  const endpointChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%'
        }
      }
    },
    labels: groupedEndpoints.map(d => d.name),
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-success-main)',
      'var(--mui-palette-warning-main)',
      'var(--mui-palette-error-main)',
      'var(--mui-palette-info-main)',
      'var(--mui-palette-secondary-main)',
      'var(--mui-palette-primary-light)',
      'var(--mui-palette-success-light)',
      'var(--mui-palette-warning-light)',
      'var(--mui-palette-error-light)'
    ],
    dataLabels: {
      enabled: true,
      formatter: (val: string) => `${parseFloat(val).toFixed(0)}%`
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: 'var(--mui-palette-text-secondary)'
      }
    },
    tooltip: { enabled: true },
    stroke: {
      width: 2,
      colors: [theme.palette.background.paper]
    }
  }

  const methodChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    labels: groupedMethods.map(d => d.name),
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-success-main)',
      'var(--mui-palette-warning-main)',
      'var(--mui-palette-error-main)',
      'var(--mui-palette-info-main)'
    ],
    dataLabels: {
      enabled: true,
      formatter: (val: string) => `${parseFloat(val).toFixed(0)}%`
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: 'var(--mui-palette-text-secondary)'
      }
    },
    tooltip: { enabled: true },
    stroke: {
      width: 2,
      colors: [theme.palette.background.paper]
    }
  }

  const responseTimeChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: true },
      animations: { enabled: true },
      zoom: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
      colors: ['var(--mui-palette-warning-main)']
    },
    markers: {
      size: 4,
      colors: ['var(--mui-palette-warning-main)'],
      strokeColors: 'var(--mui-palette-background-paper)',
      strokeWidth: 2,
      hover: {
        size: 5
      }
    },
    xaxis: {
      categories: stats?.responseTimeData.map((d) => d.date) || [],
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        },
        formatter: (value: string) => {
          try {
            const date = new Date(value)
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } catch (e) {
            return value
          }
        }
      },
      axisBorder: { color: 'var(--mui-palette-divider)' },
      axisTicks: { color: 'var(--mui-palette-divider)' }
    },
    yaxis: {
      title: { text: 'Response Time (ms)' },
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        }
      }
    },
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    },
    tooltip: { enabled: true }
  }

  const statusCodeSeries = [
    {
      name: 'Count',
      data: Object.values(stats?.byStatusCode || {})
    }
  ]

  const endpointSeries = groupedEndpoints.map(d => d.count)

  const methodSeries = groupedMethods.map(d => d.count)

  const responseTimeSeries = [
    {
      name: 'Avg Response Time (ms)',
      data: stats?.responseTimeData.map((d) => d.avgTime) || []
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
          color: 'white',
          py: 4
        }}
      >
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 } }}>
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
              <i className='tabler-chart-line' style={{ fontSize: '2rem' }}></i>
            </Box>
            <Box>
              <Typography variant='h4' fontWeight={700}>
                {t('admin.httpLogging.title')}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {t('admin.httpLogging.subtitle')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 }, py: 6 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
              {t('admin.httpLogging.filters.title')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label={t('admin.httpLogging.filters.userId')}
                  type='number'
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label={t('admin.httpLogging.filters.path')}
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder={t('admin.httpLogging.filters.pathPlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  label={t('admin.httpLogging.filters.statusCode')}
                  type='number'
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleFilter}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-search' />}
                >
                  {loading ? t('admin.httpLogging.filters.loading') : t('admin.httpLogging.filters.applyFilters')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Response Time Overview - Full Width */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
                  {t('admin.httpLogging.charts.responseTimeOverview')}
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <AppReactApexCharts
                    type='line'
                    height={300}
                    options={responseTimeChartOptions}
                    series={responseTimeSeries}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Response Time by Selected Endpoint */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3 }}>
                  <FormControl sx={{ minWidth: 300 }}>
                    <InputLabel>{t('admin.httpLogging.charts.selectEndpoint')}</InputLabel>
                    <Select
                      value={selectedEndpoint}
                      onChange={(e) => setSelectedEndpoint(e.target.value)}
                      label={t('admin.httpLogging.charts.selectEndpoint')}
                    >
                      <MenuItem value=''>{t('admin.httpLogging.charts.selectEndpointPlaceholder')}</MenuItem>
                      {stats?.byPath &&
                        Object.keys(stats.byPath).map((endpoint) => (
                          <MenuItem key={endpoint} value={endpoint}>
                            {endpoint}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  {selectedEndpoint && (
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      {t('admin.httpLogging.charts.totalRequests', { count: stats?.byPath?.[selectedEndpoint] || 0 })}
                    </Typography>
                  )}
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : selectedEndpoint && stats?.responseTimeByEndpoint?.[selectedEndpoint] ? (
                  <AppReactApexCharts
                    type='line'
                    height={300}
                    options={{
                      ...responseTimeChartOptions,
                      xaxis: {
                        ...responseTimeChartOptions.xaxis,
                        categories: stats.responseTimeByEndpoint[selectedEndpoint].map((d) => d.date) || []
                      }
                    }}
                    series={[
                      {
                        name: 'Avg Response Time (ms)',
                        data: stats.responseTimeByEndpoint[selectedEndpoint].map((d) => d.avgTime) || []
                      }
                    ]}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {selectedEndpoint ? t('admin.httpLogging.charts.noData') : t('admin.httpLogging.charts.selectEndpointPrompt')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Status Code Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
                  {t('admin.httpLogging.charts.statusDistribution')}
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <AppReactApexCharts
                    type='bar'
                    height={300}
                    options={statusCodeChartOptions}
                    series={statusCodeSeries}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Endpoint Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
               <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
                  {t('admin.httpLogging.charts.topEndpoints')}
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : stats?.byPath && Object.keys(stats.byPath).length > 0 ? (
                  <AppReactApexCharts
                    type='donut'
                    height={300}
                    options={endpointChartOptions}
                    series={endpointSeries}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No endpoint data available</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default HttpRequestLoggingView
