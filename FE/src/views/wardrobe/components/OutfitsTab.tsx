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
import type { Outfit } from '@/types/wardrobe.type'
import OutfitCard from './OutfitCard'

interface OutfitsTabProps {
  outfits: Outfit[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOutfitClick: (outfit: Outfit) => void
  onToggleFavorite?: (outfitId: number) => void
  onCreateOutfit: () => void
}

const OutfitsTab: React.FC<OutfitsTabProps> = ({
  outfits,
  loading,
  page,
  totalPages,
  onPageChange,
  onOutfitClick,
  onToggleFavorite,
  onCreateOutfit
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (outfits.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: theme =>
              `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
          }}
        >
          <i
            className='tabler-plus'
            style={{
              fontSize: 48,
              color: theme.palette.primary.main
            }}
          />
        </Box>
        <Typography variant='h6' gutterBottom>
          {t('tryOn.wardrobe.empty.outfits.title')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          {t('tryOn.wardrobe.empty.outfits.description')}
        </Typography>
        {/* <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={onCreateOutfit}>
          {t('tryOn.wardrobe.empty.outfits.action')}
        </Button> */}
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {outfits.map(outfit => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={outfit.id}>
            <OutfitCard
              outfit={outfit}
              onClick={() => onOutfitClick(outfit)}
              onToggleFavorite={onToggleFavorite}
              formatDate={formatDate}
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

export default OutfitsTab
