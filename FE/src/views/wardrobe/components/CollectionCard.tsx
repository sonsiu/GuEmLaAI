'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import type { Collection } from '@/types/wardrobe.type'

interface CollectionCardProps {
  collection: Collection
  onClick: () => void
  onEdit: () => void
  getTimeAgo: (dateString: string) => string
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onClick,
  onEdit,
  getTimeAgo
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (collection.imageCoverUrl) {
      const img = new Image()
      img.src = collection.imageCoverUrl
      img.onload = () => setImageLoaded(true)
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [collection.imageCoverUrl])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1/1' }}>
        {!imageLoaded && collection.imageCoverUrl && (
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
            {collection.imageCoverUrl && !imageError ? (
              <CardMedia
                component="img"
                image={collection.imageCoverUrl}
                alt={collection.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(211, 47, 47, 0.2) 100%)'
                }}
              >
                <i className="tabler-layers" style={{ fontSize: 48, color: 'inherit' }} />
              </Box>
            )}

            <Chip
              icon={<i className="tabler-layers" />}
              label={`${collection.outfitCount} ${collection.outfitCount === 1 ? 'outfit' : 'outfits'}`}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'background.paper',
                boxShadow: 2
              }}
            />

            {collection.isPublic && (
              <Chip
                label="Public"
                size="small"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  boxShadow: 2
                }}
              />
            )}

            <IconButton
              onClick={handleEditClick}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'background.paper',
                opacity: 0,
                transition: 'opacity 0.3s',
                '&:hover': { bgcolor: 'background.paper' },
                boxShadow: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0'
              }}
            >
              <i className="tabler-pencil" />
            </IconButton>
          </>
        )}
      </Box>

      <CardContent>
        <Typography variant="h6" component="h3" noWrap gutterBottom>
          {collection.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Updated {getTimeAgo(collection.updatedAt)}
        </Typography>
        {collection.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
            noWrap
          >
            {collection.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default CollectionCard

