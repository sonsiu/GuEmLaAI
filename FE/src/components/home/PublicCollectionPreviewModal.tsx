'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Button from '@mui/material/Button'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAuth } from '@/@core/contexts/AuthContext'

interface PublicOutfitItem {
  id: number
  name: string
  imageUrl: string
  buyLink?: string | null
  color?: string | null
  displayOrder: number
}

interface PublicOutfitCard {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive?: boolean
  displayOrder?: number
  seasons?: string[]
  createdAt?: string
  updatedAt?: string | null
  items?: PublicOutfitItem[]
}

interface PublicCollectionPreviewModalProps {
  open: boolean
  onClose: () => void
  outfit: PublicOutfitCard | null
}

const PublicCollectionPreviewModal: React.FC<PublicCollectionPreviewModalProps> = ({ open, onClose, outfit }) => {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()

  // Use the outfit data passed directly - no need for additional API call since items are already loaded
  const displayOutfit = outfit
  const isLoading = open && !displayOutfit

  const handleTryOn = () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang || 'en'
      router.push(`/${lang}/login`)
      return
    }

    // Serialize all items to pass via URL params
    if (!displayOutfit?.items || displayOutfit.items.length === 0) {
      return
    }

    const itemsData = displayOutfit.items.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      color: item.color || '',
      displayOrder: item.displayOrder
    }))

    const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang || 'en'
    const itemsParam = encodeURIComponent(JSON.stringify(itemsData))

    // Navigate to try-on page with all items data
    router.push(`/${lang}/try-on?publicItems=${itemsParam}`)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(to right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ flex: 1 }}>
          {isLoading ? (
            <Skeleton variant='text' width={200} height={32} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.lighterOpacity',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <i className='tabler-sparkles text-primary' style={{ fontSize: '1.5rem' }}></i>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h5' fontWeight={700} color='text.primary' gutterBottom>
                  {displayOutfit?.name || 'Outfit'}
                </Typography>
                {displayOutfit?.description && (
                  <Typography variant='body2' color='text.secondary'>
                    {displayOutfit.description}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {!isLoading && displayOutfit?.items && displayOutfit.items.length > 0 && (
            <Button
              variant='contained'
              color='primary'
              startIcon={<i className='tabler-shirt'></i>}
              onClick={handleTryOn}
              sx={{
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {t('home.publicCollections.tryOnAll')}
            </Button>
          )}
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <i className='tabler-x'></i>
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 4, overflowY: 'auto', bgcolor: 'background.default' }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 2.5
            }}
          >
            {[1, 2, 3, 4].map(i => (
              <Card
                key={i}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  boxShadow: 3
                }}
              >
                <Skeleton variant='rectangular' width='100%' sx={{ aspectRatio: '1' }} />
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant='text' width='75%' />
                  <Skeleton variant='text' width='50%' />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : displayOutfit?.items && displayOutfit.items.length > 0 ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 2 }}>
                <Chip
                  icon={<i className='tabler-shopping-bag'></i>}
                  label={t('home.publicCollections.itemsCount', { count: displayOutfit.items.length })}
                  sx={{
                    bgcolor: 'primary.lighterOpacity',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    px: 2
                  }}
                />
              </Divider>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: 2.5
              }}
            >
              {[...displayOutfit.items]
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .slice(0, 4)
                .map(item => (
                  <Card
                    key={item.id}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          overflow: 'hidden',
                          background:
                            'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))'
                        }}
                      >
                        {item.imageUrl ? (
                          <CardMedia
                            component='img'
                            image={item.imageUrl}
                            alt={item.name}
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
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className='tabler-layers' style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)', opacity: 0.3 }}></i>
                          </Box>
                        )}
                      </Box>

                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          variant='body2'
                          fontWeight={700}
                          color='text.primary'
                          sx={{
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.name}
                        </Typography>
                        {item.color && (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            {item.color}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                ))}
            </Box>
          </>
        ) : (
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px dashed', borderColor: 'divider' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant='body1' fontWeight={600} color='text.secondary'>
                {t('home.publicCollections.noItemsToDisplay')}
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PublicCollectionPreviewModal

