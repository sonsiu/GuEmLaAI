'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'
import { useTranslation } from '@/@core/hooks/useTranslation'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

interface WearCountChartProps {
  data: Array<{
    name: string
    wearCount: number
  }>
}

const WearCountChart: React.FC<WearCountChartProps> = ({ data }) => {
  const { t } = useTranslation()
  const theme = useTheme()

  // Sort by wear count descending and get top 10
  const sortedData = [...data].sort((a, b) => b.wearCount - a.wearCount).slice(0, 10)

  const chartOptions: ApexOptions = React.useMemo(
    () => ({
      chart: {
        type: 'bar',
        zoom: { enabled: false },
        parentHeightOffset: 0,
        animations: { enabled: true },
        toolbar: { show: false }
      },
      colors: ['var(--mui-palette-primary-main)'],
      dataLabels: { enabled: true, position: 'top' },
      grid: {
        show: true,
        borderColor: 'var(--mui-palette-divider)',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      plotOptions: {
        bar: {
          columnWidth: '60%',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      xaxis: {
        categories: sortedData.map(d => d.name),
        labels: {
          style: {
            fontSize: '11px',
            colors: 'var(--mui-palette-text-secondary)',
            fontFamily: theme.typography.fontFamily
          },
          rotate: -45
        },
        axisBorder: { color: 'var(--mui-palette-divider)' },
        axisTicks: { color: 'var(--mui-palette-divider)' }
      },
      yaxis: {
        title: {
          text: 'Times Worn',
          style: {
            color: 'var(--mui-palette-text-secondary)',
            fontFamily: theme.typography.fontFamily,
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            fontSize: '12px',
            colors: 'var(--mui-palette-text-secondary)',
            fontFamily: theme.typography.fontFamily
          }
        }
      },
      tooltip: { enabled: true }
    }),
    [theme.typography.fontFamily, sortedData]
  )

  const series = React.useMemo(
    () => [
      {
        name: 'Times Worn',
        data: sortedData.map(d => d.wearCount)
      }
    ],
    [sortedData]
  )

  if (data.length === 0) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} sx={{ mb: 3 }}>
            {t('profile.statistics.itemsByWearCount')}
          </Typography>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color='text.secondary'>{t('profile.statistics.noData')}</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant='h6' fontWeight={700}>
            {t('profile.statistics.itemsByWearCount')}
          </Typography>
          {data.length > 10 && (
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Showing top 10 of {data.length} items
            </Typography>
          )}
        </Box>

        <Box>
          <AppReactApexCharts type='bar' height={350} options={chartOptions} series={series} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default WearCountChart
