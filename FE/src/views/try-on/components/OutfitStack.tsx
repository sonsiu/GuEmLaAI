'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import type { OutfitLayer } from '../types'
import { Trash2Icon, RotateCcwIcon } from './icons'
import type { WardrobeItem, Outfit } from '@/types/wardrobe.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface OutfitStackProps {
  outfitHistory: OutfitLayer[]
  onRemoveGarment: (index: number) => void
  onResetOutfit: () => void
  pendingGarments?: WardrobeItem[]
  selectedOutfit?: Outfit | null
  onRemovePendingGarment?: (itemId: number) => void
  onRemoveOutfit?: () => void
  isLoading?: boolean
}

const OutfitStack: React.FC<OutfitStackProps> = ({
  outfitHistory,
  onRemoveGarment,
  onResetOutfit,
  pendingGarments = [],
  selectedOutfit = null,
  onRemovePendingGarment,
  onRemoveOutfit,
  isLoading = false
}) => {
  const { t } = useTranslation()
  const [brokenImages, setBrokenImages] = React.useState<Set<string>>(new Set())

  const handleImageError = (identifier: string) => {
    setBrokenImages(prev => new Set(prev).add(identifier))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onResetOutfit}
          size='small'
          variant='outlined'
          startIcon={<RotateCcwIcon style={{ width: 16, height: 16 }} />}
          sx={{ fontSize: '0.75rem' }}
        >
          {t('tryOn.outfitStack.reset')}
        </Button>
      </Box> */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Generated outfit layers */}
        {outfitHistory.map((layer, index) => (
          <Box
            key={layer.garment?.id || `base-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              p: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
              <Box
                sx={{
                  mr: 1.5,
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'text.secondary'
                }}
              >
                {index + 1}
              </Box>
              {layer.garment && (
              
                  <Box
                    component='img'
                    src={layer.garment.url }
                    alt={layer.garment.name}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      handleImageError(`layer-${index}`)
                      e.currentTarget.src = '/placeholder.png'
                      e.currentTarget.style.opacity = '0.5'
                    }}
                    sx={{
                      mr: 1.5,
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 1,
                      objectFit: 'cover',
                      opacity: (!layer.garment.url || brokenImages.has(`layer-${index}`)) ? 0.5 : 1,
                    }}
                  />
              )}
              <Typography
                variant='body2'
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
                title={layer.garment?.name}
              >
                {layer.garment ? layer.garment.name : t('tryOn.outfitStack.baseModel')}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Selected Outfit (not yet generated) */}
        {selectedOutfit && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.main',
              bgcolor: 'primary.lighterOpacity',
              p: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
              <Box
                sx={{
                  mr: 1.5,
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {outfitHistory.length}
              </Box>
            
                <Box
                  component='img'
                  src={selectedOutfit.imageUrl || '/placeholder.png'}
                  alt={selectedOutfit.name || 'Outfit'}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    handleImageError('selected-outfit')
                    e.currentTarget.src = '/placeholder.png'
                    e.currentTarget.style.opacity = '0.5'
                    e.currentTarget.style.border = '1px dashed'
                  }}
                  sx={{
                    mr: 1.5,
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: 1,
                    objectFit: 'cover',
                    opacity: (!selectedOutfit.imageUrl || brokenImages.has('selected-outfit')) ? 0.5 : 1,
                    border: (!selectedOutfit.imageUrl || brokenImages.has('selected-outfit')) ? '1px dashed' : 'none',
                    borderColor: 'warning.main'
                  }}
                />
              <Typography
                variant='body2'
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
                title={selectedOutfit.name || 'Outfit'}
              >
                {selectedOutfit.name || t('tryOn.outfitStack.outfit')}
              </Typography>
            </Box>
            {onRemoveOutfit && (
              <IconButton
                onClick={onRemoveOutfit}
                disabled={isLoading}
                size='small'
                sx={{
                  flexShrink: 0,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'error.lighterOpacity',
                    color: 'error.main'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed'
                  }
                }}
                aria-label={t('tryOn.outfitStack.removeOutfit')}
              >
                <Trash2Icon style={{ width: 20, height: 20 }} />
              </IconButton>
            )}
          </Box>
        )}

        {/* Pending garments */}
        {!selectedOutfit &&
          pendingGarments.map((item, index) => (
            <Box
              key={`pending-${item.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.main',
                bgcolor: 'primary.lighterOpacity',
                p: 1.5,
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, gap: 1.5 }}>
                <Box
                  sx={{
                    mr: 0,
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {outfitHistory.length + index}
                </Box>

                {/* Image with badge below */}
              
                  <Box
                    sx={{
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      component='img'
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.categoryName || 'Item'}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        handleImageError(`pending-${item.id}`)
                        e.currentTarget.src = '/placeholder.png'
                        e.currentTarget.style.opacity = '0.5'
                        e.currentTarget.style.border = '1px dashed'
                      }}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        objectFit: 'cover',
                        opacity: (!item.imageUrl || brokenImages.has(`pending-${item.id}`)) ? 0.5 : 1,
                        border: (!item.imageUrl || brokenImages.has(`pending-${item.id}`)) ? '1px dashed' : 'none',
                        borderColor: 'warning.main'
                      }}
                    />
                    {/* Public badge below image */}
                    {(item as any).isPublic && (
                      <Tooltip title={t('tryOn.publicItemNotSaved') || 'This item will not be saved in Outfit'}>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 1,
                            backgroundColor: 'warning.main',
                            color: 'warning.contrastText',
                            fontSize: '0.525rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 1,
                            whiteSpace: 'nowrap',
                            border: '1px solid',
                            borderColor: 'background.paper'
                          }}
                        >
                          Public
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                  title={(item as any).isPublic ? (t('tryOn.publicItemLabel') || 'Public Item') : (item.comment || item.categoryName || `Item #${item.id}`)}
                >
                  {(item as any).isPublic ? (t('tryOn.publicItemLabel') || 'Public Item') : (item.comment || item.categoryName || `Item #${item.id}`)}
                </Typography>
              </Box>
              {onRemovePendingGarment && (
                <IconButton
                  onClick={() => onRemovePendingGarment(item.id)}
                  disabled={isLoading}
                  size='small'
                  sx={{
                    flexShrink: 0,
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'error.lighterOpacity',
                      color: 'error.main'
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed'
                    }
                  }}
                  aria-label={t('tryOn.outfitStack.removePendingItem')}
                >
                  <Trash2Icon style={{ width: 20, height: 20 }} />
                </IconButton>
              )}
            </Box>
          ))}

        {outfitHistory.length === 1 && pendingGarments.length === 0 && !selectedOutfit && (
          <Typography variant='body2' color='text.secondary' sx={{ pt: 2, textAlign: 'center' }}>
            {t('tryOn.outfitStack.empty')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default OutfitStack

