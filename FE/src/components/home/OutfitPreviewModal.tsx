'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import { ClientApi } from '@/services/client-api.service'

interface SuggestedOutfit {
  id: number
  name?: string
  imagePreviewUrl: string
  isFavorite: boolean
  matchReason: string
  seasons: string[]
  comment?: string
}

interface OutfitDetail extends SuggestedOutfit {
  description?: string
  createdAt?: string
  updatedAt?: string
  items?: Array<{
    id: number
    name: string
    imageUrl?: string
    category?: string
  }>
  [key: string]: any
}

interface WeatherContext {
  locationName: string
  temperature: number
  temperatureUnit: string
  weatherText: string
}

interface OutfitPreviewModalProps {
  open: boolean
  onClose: () => void
  outfitId: number | null
  basicOutfitInfo?: SuggestedOutfit
  weatherContext?: WeatherContext
}

const OutfitPreviewModal: React.FC<OutfitPreviewModalProps> = ({
  open,
  onClose,
  outfitId,
  basicOutfitInfo,
  weatherContext
}) => {
  const [outfitDetail, setOutfitDetail] = useState<OutfitDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Fetch outfit detail when modal opens and outfitId changes
  useEffect(() => {
    if (open && outfitId) {
      setIsLoadingDetail(true)
      setOutfitDetail(null)

      const fetchOutfitDetail = async () => {
        try {
          const detailResponse = await ClientApi.get<OutfitDetail>(`/Outfit/${outfitId}/details`)
          const rawResponse = detailResponse.getRaw()

          if (rawResponse.success && rawResponse.data) {
            setOutfitDetail(rawResponse.data)
          } else {
            // Fallback: use the basic outfit info if detail API fails
            if (basicOutfitInfo) {
              setOutfitDetail(basicOutfitInfo as OutfitDetail)
            }
          }
        } catch {
          // Fallback: use the basic outfit info if API call fails
          if (basicOutfitInfo) {
            setOutfitDetail(basicOutfitInfo as OutfitDetail)
          }
        } finally {
          setIsLoadingDetail(false)
        }
      }

      fetchOutfitDetail()
    } else if (!open) {
      // Reset when modal closes
      setOutfitDetail(null)
      setIsLoadingDetail(false)
    }
  }, [open, outfitId, basicOutfitInfo])

  const displayOutfit = outfitDetail || basicOutfitInfo

  if (!displayOutfit) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
        {isLoadingDetail ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover'
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <CardMedia
            component='img'
            image={displayOutfit.imagePreviewUrl}
            alt={displayOutfit.name || 'Outfit'}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        {displayOutfit.isFavorite && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'error.main',
              borderRadius: '50%',
              p: 1.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className='tabler-heart-filled text-white' style={{ fontSize: '1.5rem' }}></i>
          </Box>
        )}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            '&:hover': {
              bgcolor: 'background.paper',
              transform: 'scale(1.1)'
            },
            transition: 'transform 0.2s'
          }}
        >
          <i className='tabler-x'></i>
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4 }}>
        {isLoadingDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title */}
            <Box>
              <Typography variant='h4' fontWeight={700} color='text.primary' gutterBottom>
                {displayOutfit.name || 'Untitled Outfit'}
              </Typography>
              {outfitDetail?.description && (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  {outfitDetail.description}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Match Reason */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighterOpacity',
                  flexShrink: 0
                }}
              >
                <i className='tabler-sparkles' style={{ color: 'var(--mui-palette-primary-main)', fontSize: '1.5rem' }}></i>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary' fontWeight={600} gutterBottom>
                  Match Reason
                </Typography>
                <Typography variant='body1' color='primary.main' fontWeight={600}>
                  {displayOutfit.matchReason}
                </Typography>
              </Box>
            </Box>

            {/* Outfit Items */}
            {outfitDetail?.items && outfitDetail.items.length > 0 && (
              <Box>
                <Typography variant='body2' color='text.secondary' fontWeight={600} gutterBottom>
                  Outfit Items
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                    mt: 1
                  }}
                >
                  {outfitDetail.items.map((item: any) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        textAlign: 'center'
                      }}
                    >
                      {item.imageUrl ? (
                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 1,
                            overflow: 'hidden',
                            mb: 1,
                            bgcolor: 'action.hover'
                          }}
                        >
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
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1
                          }}
                        >
                          <i className='tabler-shirt' style={{ fontSize: '2rem', color: 'var(--mui-palette-text-disabled)' }}></i>
                        </Box>
                      )}
                      <Typography variant='caption' fontWeight={600} color='text.primary' noWrap>
                        {item.name}
                      </Typography>
                      {item.category && (
                        <Typography variant='caption' color='text.disabled' display='block' mt={0.5}>
                          {item.category}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Seasons */}
            {displayOutfit.seasons.length > 0 && (
              <Box>
                <Typography variant='body2' color='text.secondary' fontWeight={600} gutterBottom>
                  Seasons
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {displayOutfit.seasons.map(season => (
                    <Chip
                      key={season}
                      label={season}
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        fontWeight: 600
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Comment */}
            {displayOutfit.comment && (
              <Box>
                <Typography variant='body2' color='text.secondary' fontWeight={600} gutterBottom>
                  Comment
                </Typography>
                <Typography
                  variant='body1'
                  color='text.disabled'
                  sx={{
                    fontStyle: 'italic',
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  "{displayOutfit.comment}"
                </Typography>
              </Box>
            )}

            {/* Weather Context Info */}
            {weatherContext && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-info-lighterOpacity))',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant='body2' color='text.secondary' fontWeight={600} gutterBottom>
                  Weather Context
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-map-pin' style={{ color: 'var(--mui-palette-text-secondary)' }}></i>
                    <Typography variant='body2' color='text.secondary'>
                      {weatherContext.locationName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2' fontWeight={700} color='primary.main'>
                      {weatherContext.temperature}°{weatherContext.temperatureUnit}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {weatherContext.weatherText}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OutfitPreviewModal

