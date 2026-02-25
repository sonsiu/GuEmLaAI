'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast } from '@/services/toast.service'
import type { WearStats, CategoryData, ColorData, WearCountData } from '@/types/wardrobe.type'
import CategoryChart from './CategoryChart'
import ColorChart from './ColorChart'
import WearCountChart from './WearCountChart'

const StatisticsSection: React.FC = () => {
  const { t } = useTranslation()
  const [wearStats, setWearStats] = useState<WearStats[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [colorData, setColorData] = useState<ColorData[]>([])
  const [wearCountData, setWearCountData] = useState<WearCountData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch wardrobe statistics
  const loadWardrobeStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await wardrobeService.getWardrobeWearStatistics()

      if (!response) {
        setError('No data available')
        return
      }

      if (!Array.isArray(response)) {
        setError('Invalid data format from API')
        return
      }

      if (response.length === 0) {
        setCategoryData([])
        setColorData([])
        setWearCountData([])
        return
      }

      setWearStats(response)

      // Helper function to group items below threshold as "Miscellaneous"
      const groupByPercentage = (
        map: Map<string, number>,
        threshold: number = 2
      ): Array<{ name: string; count: number }> => {
        const total = Array.from(map.values()).reduce((a, b) => a + b, 0)
        const result: Array<{ name: string; count: number }> = []
        let miscCount = 0

        Array.from(map.entries()).forEach(([key, count]) => {
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

      // Process category data
      const categoryMap = new Map<string, number>()
      response.forEach((item: any) => {
        const category = item.CategoryCode || item.categoryCode || 'Unknown'
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
      })
      const processedCategoryData = groupByPercentage(categoryMap)
      setCategoryData(
        processedCategoryData.map(d => ({
          category: d.name,
          count: d.count
        }))
      )

      // Process color data
      const colorMap = new Map<string, number>()
      response.forEach((item: any) => {
        const colors = item.colors || item.Colors || []
        colors.forEach((color: string) => {
          colorMap.set(color, (colorMap.get(color) || 0) + 1)
        })
      })
      const processedColorData = groupByPercentage(colorMap)
      setColorData(
        processedColorData.map(d => ({
          color: d.name,
          count: d.count
        }))
      )

      // Process wear count distribution
      const wearArray: WearCountData[] = response
        .map((item: any) => ({
          name: (item.Comment || item.comment || 'Unknown') as string,
          wearCount: (item.WearCount || item.wearCount || 0) as number
        }))
        .sort((a, b) => b.wearCount - a.wearCount)
      setWearCountData(wearArray)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('profile.statistics.errors.loadStats')

      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadWardrobeStats()
  }, [loadWardrobeStats])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>{t('profile.statistics.loading')}</Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error' sx={{ maxWidth: 500 }}>
          <Typography variant='h6' gutterBottom>
            {t('profile.statistics.errors.title')}
          </Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='tabler-chart-bar text-primary' style={{ fontSize: '1.5rem' }}></i>
        <Typography variant='h5' fontWeight={700}>
          {t('profile.statistics.title')}
        </Typography>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <CategoryChart data={categoryData} />
        <ColorChart data={colorData} />
      </Box>
      <WearCountChart data={wearCountData} />
    </Box>
  )
}

export default StatisticsSection
