'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { Outfit } from '@/types/wardrobe.type'

interface OutfitCardProps {
  outfit: Outfit
  onClick: () => void
  onToggleFavorite?: (outfitId: number) => void
  formatDate: (dateString?: string | null) => string
}

const PLACEHOLDER_IMAGE = '/placeholder.png'

const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onClick,
  onToggleFavorite,
  formatDate
}) => {
  const { t } = useTranslation()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (outfit.imageUrl) {
      const img = new Image()
      img.src = outfit.imageUrl
      img.onload = () => setImageLoaded(true)
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [outfit.imageUrl])

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(outfit.id)
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          '& .favorite-button': {
            opacity: 1
          },
          '& .hover-overlay': {
            opacity: 0.2
          }
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {!imageLoaded && outfit.imageUrl && (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: '60%',
                height: '60%',
                bgcolor: 'grey.300',
                borderRadius: 1
              }}
            />
          </Box>
        )}

        {imageLoaded && (
          <>
            <CardMedia
              component="img"
              src={!imageError && outfit.imageUrl ? outfit.imageUrl : PLACEHOLDER_IMAGE}
              alt={outfit.name || `Outfit #${outfit.id}`}
              onError={event => {
                if (!event.currentTarget.src.includes(PLACEHOLDER_IMAGE)) {
                  event.currentTarget.src = PLACEHOLDER_IMAGE
                }
              }}
              sx={{
                width: '100%',
                aspectRatio: '1/1',
                objectFit: 'cover'
              }}
            />

            {/* Hover overlay */}
            <Box
              className="hover-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'black',
                opacity: 0,
                transition: 'opacity 0.2s ease'
              }}
            />

            {/* Favorite Icon - Shows on hover or if favorited */}
            {onToggleFavorite && (
              <IconButton
                onClick={handleFavoriteClick}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  bgcolor: outfit.isFavorite ? 'error.main' : 'background.paper',
                  color: outfit.isFavorite ? 'error.contrastText' : 'text.secondary',
                  opacity: outfit.isFavorite ? 1 : 0,
                  transition: 'all 0.2s ease',
                  boxShadow: 3,
                  border: 1,
                  borderColor: outfit.isFavorite ? 'error.main' : 'divider',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: outfit.isFavorite ? 'error.dark' : 'background.paper'
                  }
                }}
                className="favorite-button"
              >
                <i
                  className={outfit.isFavorite ? 'tabler-heart-filled' : 'tabler-heart'}
                  style={{
                    fill: outfit.isFavorite ? 'currentColor' : 'none'
                  }}
                />
              </IconButton>
            )}
          </>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="subtitle1" noWrap>
          {outfit.name || `Outfit #${outfit.id}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(outfit.createdAt) || t('common.today')}
        </Typography>
        {outfit.outfitSeasons && outfit.outfitSeasons.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {outfit.outfitSeasons.map(season => (
              <Chip key={`${outfit.id}-${season}`} label={season} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default OutfitCard
