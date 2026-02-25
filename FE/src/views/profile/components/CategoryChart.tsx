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
import type { CategoryData } from '@/types/wardrobe.type'
import itemData from '../../../../public/item.json'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

interface CategoryChartProps {
  data: CategoryData[]
}

// Helper function to get human-readable category name from category code
const getCategoryDisplayName = (categoryCode: string, lang: string = 'en'): string => {
  // Check if categoryCode is "Miscellaneous" or other non-code values
  if (categoryCode === 'Miscellaneous' || categoryCode === 'Unknown') {
    return categoryCode
  }

  // Search through item.json categories for matching category_code
  for (const items of Object.values(itemData.category)) {
    if (Array.isArray(items)) {
      const found = items.find((item: any) => item.category_code === categoryCode)

      if (found) {
        // Return Vietnamese name if language is 'vi', otherwise return English name
        return lang === 'vi' ? (found.name_vn || found.name) : found.name
      }
    }
  }

  // Fallback to the original code if not found
  return categoryCode
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const { t, lang } = useTranslation()
  const theme = useTheme()

  const chartOptions: ApexOptions = React.useMemo(() => ({
    chart: {
      type: 'donut',
      zoom: {
        enabled: false
      },
      parentHeightOffset: 0,
      animations: { enabled: true },
      toolbar: { show: false }
    },
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-secondary-main)',
      'var(--mui-palette-success-main)',
      'var(--mui-palette-warning-main)',
      'var(--mui-palette-error-main)',
      'var(--mui-palette-info-main)',
      'var(--mui-palette-error-light)',
      'var(--mui-palette-warning-light)',
      'var(--mui-palette-success-light)',
      'var(--mui-palette-info-light)'
    ],
    dataLabels: { enabled: false },
    labels: data.map(d => getCategoryDisplayName(d.category, lang)),
    legend: {
      position: 'bottom',
      labels: {
        colors: 'var(--mui-palette-text-secondary)'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              color: 'var(--mui-palette-text-secondary)',
              fontFamily: theme.typography.fontFamily
            },
            value: {
              show: true,
              color: 'var(--mui-palette-text-primary)',
              fontFamily: theme.typography.fontFamily
            },
            total: {
              show: true,
              label: t('profile.statistics.itemCount'),
              color: 'var(--mui-palette-text-secondary)',
              fontFamily: theme.typography.fontFamily
            }
          }
        }
      }
    },
    tooltip: {
      enabled: true
    }
  }), [t, lang, theme.typography.fontFamily, data])

  const series = React.useMemo(() => data.map(d => d.count), [data])

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent>
        <Typography variant='h6' fontWeight={700} sx={{ mb: 3 }}>
          {t('profile.statistics.itemsByCategory')}
        </Typography>

        {data.length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 500 }}>
              <AppReactApexCharts type='donut' height={350} options={chartOptions} series={series} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color='text.secondary'>{t('profile.statistics.noData')}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CategoryChart
