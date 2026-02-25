'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import type { Outfit, ItemData } from '@/types/wardrobe.type'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { loadItemData, getCategoryVietnameseName } from '@/utils/itemData'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast } from '@/services/toast.service'

interface OutfitDetailModalProps {
  open: boolean
  onClose: () => void
  outfit: Outfit | null
  loading?: boolean
  onDeleteSuccess?: (outfitId: number) => void
  onEditClick?: (outfit: Outfit) => void
}

const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  open,
  onClose,
  outfit,
  loading = false,
  onDeleteSuccess,
  onEditClick
}) => {
  const router = useRouter()
  const theme = useTheme()
  const { t } = useTranslation()
  const [itemMetadata, setItemMetadata] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Only use pose images for carousel
  const allImages = outfit?.poseImages || []

  React.useEffect(() => {
    loadItemData()
      .then(setItemMetadata)
      .catch(error => {
        // console.error('Failed to load item metadata:', error)
      })
  }, [])

  const resolveCategoryName = (categoryCode: string) => {
    if (!itemMetadata) return categoryCode

    return getCategoryVietnameseName(itemMetadata, categoryCode)
  }

  if (!outfit) return null

  const handleEdit = () => {
    if (onEditClick) {
      onEditClick(outfit)
    } else {
      onClose()
      router.push(`/wardrobe/outfit?outfitId=${outfit.id}`)
    }
  }

  const handleDelete = async () => {
    if (!outfit || isDeleting) return

    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!outfit || isDeleting) return

    try {
      setIsDeleting(true)
      await wardrobeService.deleteOutfit(outfit.id)
      setShowDeleteConfirm(false)
      onDeleteSuccess?.(outfit.id)
      onClose()
    } catch (error) {
      // console.error('Error deleting outfit:', error)
      showErrorToast(t('tryOn.wardrobe.errors.deleteOutfit') || 'Failed to delete outfit')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h5'>{outfit.name || `Outfit #${outfit.id}`}</Typography>
          <IconButton onClick={onClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Carousel - Main Image + Pose Images */}
        <Box sx={{ mb: 3 }}>
          {allImages.length > 0 ? (
            <Box
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(15,23,42,0.04)',
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Main Carousel Image */}
              <Box
                component='img'
                src={allImages[currentImageIndex]}
                alt={`Outfit image ${currentImageIndex + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: 500
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (!img.src.includes('/placeholder.png')) {
                    img.src = '/placeholder.png'
                  }
                }}
              />

              {/* Previous Button */}
              {allImages.length > 1 && (
                <IconButton
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.6)'
                    }
                  }}
                >
                  <i className='tabler-chevron-left' />
                </IconButton>
              )}

              {/* Next Button */}
              {allImages.length > 1 && (
                <IconButton
                  onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.6)'
                    }
                  }}
                >
                  <i className='tabler-chevron-right' />
                </IconButton>
              )}

              {/* Image Counter */}
              {allImages.length > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.875rem'
                  }}
                >
                  {currentImageIndex + 1} / {allImages.length}
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(15,23,42,0.04)',
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                {t('tryOn.wardrobe.noItems')}
              </Typography>
            </Box>
          )}

          {/* Thumbnail Strip - Centered and Flexible */}
          {allImages.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                pb: 1,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              {allImages.map((imageUrl, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  sx={{
                    width: { xs: 70, sm: 80 },
                    height: { xs: 70, sm: 80 },
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: `2px solid ${index === currentImageIndex ? theme.palette.primary.main : theme.palette.divider}`,
                    cursor: 'pointer',
                    opacity: index === currentImageIndex ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  <Box
                    component='img'
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      if (!img.src.includes('/placeholder.png')) {
                        img.src = '/placeholder.png'
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Outfit Details */}
        <Box sx={{ mb: 3 }}>
          {outfit.comment && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' gutterBottom>
                {t('tryOn.wardrobe.modals.outfitDetail.comment')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {outfit.comment}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {outfit.isFavorite && (
              <Chip
                icon={<i className='tabler-heart-filled' />}
                label={t('tryOn.wardrobe.modals.outfitDetail.favorite')}
                color='error'
                size='small'
              />
            )}
            {outfit.isPublic && (
              <Chip
                icon={<i className='tabler-world' />}
                label={t('tryOn.wardrobe.modals.outfitDetail.public')}
                color='primary'
                size='small'
              />
            )}
          </Box>

          <Typography variant='caption' color='text.secondary'>
            {t('tryOn.wardrobe.modals.outfitDetail.created')}: {new Date(outfit.createdAt).toLocaleDateString()}
          </Typography>
        </Box>

        {/* Items in Outfit */}
        {outfit.itemImages && outfit.itemImages.length > 0 && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant='subtitle2' gutterBottom sx={{ mb: 2 }}>
              {t('tryOn.wardrobe.modals.outfitDetail.itemsInOutfit')} ({outfit.itemImages.length})
            </Typography>
            <Grid container spacing={2}>
              {outfit.itemImages.map((item: ItemData) => (
                <Grid item xs={6} sm={4} md={3} key={`item-${item.id}`}>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.92 }
                    }}
                  >
                    <Box
                      sx={{
                        aspectRatio: '1/1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: theme.palette.mode === 'dark' ? 6 : 2
                      }}
                    >
                      {item.imageUrl ? (
                        <Box
                          component='img'
                          src={item.imageUrl}
                          alt={item.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            if (!img.src.includes('/placeholder.png')) {
                              img.src = '/placeholder.png'
                            }
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
                          <Typography variant='caption' color='text.secondary'>
                            No Image
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant='body2' noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {item.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' noWrap>
                      {resolveCategoryName(item.categoryCode)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleDelete}
          variant='outlined'
          color='error'
          startIcon={<i className='tabler-trash' />}
          disabled={isDeleting}
        >
          {isDeleting ? t('tryOn.wardrobe.modals.outfitDetail.deleting') : t('tryOn.wardrobe.modals.outfitDetail.delete')}
        </Button>
        <Button
          onClick={handleEdit}
          variant='outlined'
          startIcon={<i className='tabler-pencil' />}
        >
          {t('tryOn.wardrobe.modals.outfitDetail.edit') || 'Edit'}
        </Button>
        <Button onClick={onClose} variant='contained'>
          {t('tryOn.wardrobe.modals.outfitDetail.close')}
        </Button>
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>
          {t('tryOn.wardrobe.modals.deleteConfirm.title') || 'Delete Outfit'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('tryOn.wardrobe.modals.deleteConfirm.message') || 'Are you sure you want to delete this outfit? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            variant='outlined'
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant='contained'
            color='error'
            disabled={isDeleting}
          >
            {isDeleting ? t('tryOn.wardrobe.modals.deleteConfirm.deleting') : t('tryOn.wardrobe.modals.deleteConfirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default OutfitDetailModal
