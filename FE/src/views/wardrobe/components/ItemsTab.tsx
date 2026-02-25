'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { WardrobeItem } from '@/types/wardrobe.type'
import ItemCard from './ItemCard'

interface ItemsTabProps {
  items: WardrobeItem[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onItemClick: (item: WardrobeItem) => void
  onToggleFavorite?: (itemId: number) => void
  onAddItems: () => void
  getTimeAgo: (dateString: string) => string
}

const ItemsTab: React.FC<ItemsTabProps> = ({
  items,
  loading,
  page,
  totalPages,
  onPageChange,
  onItemClick,
  onToggleFavorite,
  onAddItems,
  getTimeAgo
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)'
              }`
          }}
        >
          <i
            className="tabler-plus"
            style={{
              fontSize: 48,
              color: theme.palette.primary.main
            }}
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          {t('tryOn.wardrobe.empty.items.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('tryOn.wardrobe.empty.items.description')}
        </Typography>
        <Button variant="contained" startIcon={<i className="tabler-plus" />} onClick={onAddItems}>
          {t('tryOn.wardrobe.empty.items.action')}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
            <ItemCard
              item={item}
              onClick={() => onItemClick(item)}
              onToggleFavorite={onToggleFavorite}
              getTimeAgo={getTimeAgo}
            />
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(_e, page) => onPageChange(page)} />
        </Box>
      )}
    </Box>
  )
}

export default ItemsTab

