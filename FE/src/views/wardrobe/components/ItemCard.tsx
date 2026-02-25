'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import type { WardrobeItem } from '@/types/wardrobe.type'
import { loadItemData, getCategoryDisplayName } from '@/utils/itemData'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface ItemCardProps {
  item: WardrobeItem
  onClick: () => void
  onToggleFavorite?: (itemId: number) => void
  getTimeAgo: (dateString: string) => string
}

const PLACEHOLDER_IMAGE = '/placeholder.png'

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  onToggleFavorite,
  getTimeAgo
}) => {
  const { lang } = useTranslation()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [categoryDisplayName, setCategoryDisplayName] = useState<string>(item.categoryName)

  // Load item data for category name mapping
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadItemData()

        const displayName = getCategoryDisplayName(data, item.categoryName, lang)

        setCategoryDisplayName(displayName)
      } catch (error) {
        // console.error('Failed to load item data:', error)

        // Fallback to categoryName if loading fails
        setCategoryDisplayName(item.categoryName)
      }
    }

    loadData()
  }, [item.categoryName, lang])

  useEffect(() => {
    if (item.imageUrl) {
      const img = new Image()

      img.src = item.imageUrl
      img.onload = () => setImageLoaded(true)
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [item.imageUrl])

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(item.id)
    }
  }

  return (
    <Card
      sx={{
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
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
        {!imageLoaded && item.imageUrl && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
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
              image={!imageError && item.imageUrl ? item.imageUrl : PLACEHOLDER_IMAGE}
              alt={item.categoryName}
              onError={(event) => {
                if (!event.currentTarget.src.includes(PLACEHOLDER_IMAGE)) {
                  event.currentTarget.src = PLACEHOLDER_IMAGE
                }
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
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
                  bgcolor: item.isFavorite ? 'error.main' : 'background.paper',
                  color: item.isFavorite ? 'error.contrastText' : 'text.secondary',
                  opacity: item.isFavorite ? 1 : 0,
                  transition: 'all 0.2s ease',
                  boxShadow: 3,
                  border: 1,
                  borderColor: item.isFavorite ? 'error.main' : 'divider',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: item.isFavorite ? 'error.dark' : 'background.paper'
                  }
                }}
                className="favorite-button"
              >
                <i
                  className={item.isFavorite ? 'tabler-heart-filled' : 'tabler-heart'}
                  style={{
                    fill: item.isFavorite ? 'currentColor' : 'none'
                  }}
                />
              </IconButton>
            )}

            {item.isPublic && (
              <Chip
                label="Public"
                size="small"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 10
                }}
              />
            )}
          </>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" noWrap gutterBottom>
          {item.comment || categoryDisplayName}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {getTimeAgo(item.createdAt)}
          </Typography>
          {item.size && (
            <Chip label={item.size} size="small" variant="outlined" />
          )}
        </Box>
        {item.comment && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
            noWrap
          >
            {categoryDisplayName}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default ItemCard

