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
import type { ColorData } from '@/types/wardrobe.type'
import itemData from '../../../../public/item.json'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

interface ColorChartProps {
  data: ColorData[]
}

// Helper function to get human-readable color name from color code
const getColorDisplayName = (colorName: string, lang: string = 'en'): string => {
  // Find matching color in item.json
  const found = itemData.colors.find((color: any) => color.name.toLowerCase() === colorName.toLowerCase())

  if (found) {
    // Return Vietnamese name if language is 'vi', otherwise return English name
    return lang === 'vi' ? (found.name_vn || found.name) : found.name
  }

  // Fallback to the original name if not found
  return colorName
}

const ColorChart: React.FC<ColorChartProps> = ({ data }) => {
  const { t, lang } = useTranslation()
  const theme = useTheme()

  // Map color names to actual hex colors
  const colorMap: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00AA00',
    yellow: '#FFFF00',
    gray: '#808080',
    grey: '#808080',
    pink: '#FFC0CB',
    purple: '#800080',
    orange: '#FFA500',
    brown: '#A52A2A',
    navy: '#000080',
    beige: '#F5F5DC',
    khaki: '#F0E68C',
    silver: '#C0C0C0',
    gold: '#FFD700',
    tan: '#D2B48C',
    maroon: '#800000',
    cyan: '#00FFFF',
    navy_blue: '#000080',
    teal: '#008080',
    turquoise: '#40E0D0',
    lime: '#00FF00',
    olive: '#808000',
    dark_blue: '#00008B',
    light_blue: '#ADD8E6',
    light_gray: '#D3D3D3',
    cream: '#FFFDD0'
  }

  const chartColors = data.map(d => {
    const colorKey = d.color.toLowerCase().replace(/\s+/g, '_')

    return colorMap[colorKey] || '#999999'
  })

  // Function to determine if a color is light or dark
  const getLuminance = (hexColor: string): number => {
    const rgb = parseInt(hexColor.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff

    return (r * 299 + g * 587 + b * 114) / 1000
  }

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
    colors: chartColors,
    dataLabels: { enabled: false },
    labels: data.map(d => getColorDisplayName(d.color, lang)),
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
              label: t('profile.statistics.colors'),
              color: 'var(--mui-palette-text-secondary)',
              fontFamily: theme.typography.fontFamily
            }
          }
        }
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily
      },
      y: {
        formatter: (val: number) => `${val} items`
      },
      custom: ({ seriesIndex }) => {
        const backgroundColor = chartColors[seriesIndex] || '#999999'
        const textColor = getLuminance(backgroundColor) > 155 ? '#000000' : '#FFFFFF'
        const colorName = getColorDisplayName(data[seriesIndex]?.color || '', lang)
        const count = data[seriesIndex]?.count || 0

        return `<div style="background-color: ${backgroundColor}; color: ${textColor}; font-family: ${theme.typography.fontFamily}; font-size: 12px; padding: 8px; border-radius: 4px;"><strong>${colorName}</strong><br/>${count} items</div>`
      }
    }
  }), [t, lang, theme.typography.fontFamily, data, chartColors])

  const series = React.useMemo(() => data.map(d => d.count), [data])

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent>
        <Typography variant='h6' fontWeight={700} sx={{ mb: 3 }}>
          {t('profile.statistics.itemsByColor')}
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

export default ColorChart
