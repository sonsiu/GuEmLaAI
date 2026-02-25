'use client'

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { OutfitDetailsData } from '@/types/calendar.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface OutfitDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    outfitData: OutfitDetailsData | null
    isLoading: boolean
}

const OutfitDetailsModal: React.FC<OutfitDetailsModalProps> = ({ isOpen, onClose, outfitData, isLoading }) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [currentItemIndex, setCurrentItemIndex] = useState(0)
    const [currentPoseImageIndex, setCurrentPoseImageIndex] = useState(0)
    const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set())
    const [failedPoseImages, setFailedPoseImages] = useState<Set<number>>(new Set())

    if (!outfitData) return null

    const associatedItems = outfitData.associatedItems || []
    const poseImages = outfitData.poseImages || []
    const hasItems = associatedItems.length > 0
    const hasPoseImages = poseImages.length > 0

    // Pose image navigation
    const goToPreviousPoseImage = () => {
        if (hasPoseImages) {
            setCurrentPoseImageIndex((prev) => (prev === 0 ? poseImages.length - 1 : prev - 1))
        }
    }

    const goToNextPoseImage = () => {
        if (hasPoseImages) {
            setCurrentPoseImageIndex((prev) => (prev === poseImages.length - 1 ? 0 : prev + 1))
        }
    }

    // Associated items navigation
    const goToPrevious = () => {
        if (hasItems) {
            setCurrentItemIndex((prev) => (prev === 0 ? associatedItems.length - 1 : prev - 1))
        }
    }

    const goToNext = () => {
        if (hasItems) {
            setCurrentItemIndex((prev) => (prev === associatedItems.length - 1 ? 0 : prev + 1))
        }
    }

    const currentItem = hasItems ? associatedItems[currentItemIndex] : null

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement
        img.src = ''
        const itemId = parseInt(img.getAttribute('data-item-id') || '0')
        if (itemId) {
            setFailedImageIds((prev) => new Set([...prev, itemId]))
        }
    }

    const handlePoseImageError = (index: number) => {
        setFailedPoseImages((prev) => new Set([...prev, index]))
    }

    const isItemDeleted = (item: typeof associatedItems[0]) => {
        return !item.imageUrl || item.imageUrl.trim() === '' || failedImageIds.has(item.id)
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth='lg' fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant='h6' sx={{ fontWeight: 700 }}>
                            {outfitData.name || `Outfit #${outfitData.id}`}
                        </Typography>
                        <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {t('calendar.modal.itemsInOutfit', { count: associatedItems.length })}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size='small'>
                        <X size={20} />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, p: 3 }}>
                    {/* Left: Outfit Pose Images Carousel */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '3/4',
                                bgcolor: 'action.selected',
                                borderRadius: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 2,
                                borderColor: 'divider',
                            }}
                        >
                            {isLoading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress />
                                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                        {t('common.loading')}
                                    </Typography>
                                </Box>
                            ) : hasPoseImages ? (
                                <>
                                    {/* Previous Button */}
                                    {poseImages.length > 1 && (
                                        <IconButton
                                            onClick={goToPreviousPoseImage}
                                            sx={{
                                                position: 'absolute',
                                                left: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                zIndex: 10,
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            }}
                                            aria-label='Previous pose image'
                                        >
                                            <ChevronLeft size={20} />
                                        </IconButton>
                                    )}

                                    {/* Current Pose Image */}
                                    {!failedPoseImages.has(currentPoseImageIndex) ? (
                                        <Box
                                            component='img'
                                            src={poseImages[currentPoseImageIndex]}
                                            alt={`${outfitData.name || 'Outfit'} - Pose ${currentPoseImageIndex + 1}`}
                                            sx={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                            }}
                                            onError={() => handlePoseImageError(currentPoseImageIndex)}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2 }}>
                                            <ImageIcon size={40} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {t('calendar.error.imageNotAvailable')}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Next Button */}
                                    {poseImages.length > 1 && (
                                        <IconButton
                                            onClick={goToNextPoseImage}
                                            sx={{
                                                position: 'absolute',
                                                right: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                zIndex: 10,
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            }}
                                            aria-label='Next pose image'
                                        >
                                            <ChevronRight size={20} />
                                        </IconButton>
                                    )}

                                    {/* Counter */}
                                    {poseImages.length > 1 && (
                                        <Chip
                                            label={`${currentPoseImageIndex + 1} / ${poseImages.length}`}
                                            size='small'
                                            sx={{
                                                position: 'absolute',
                                                bottom: 8,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'common.white',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                            }}
                                        />
                                    )}
                                </>
                            ) : outfitData.imageUrl ? (
                                <Box
                                    component='img'
                                    src={outfitData.imageUrl}
                                    alt={outfitData.name || 'Outfit'}
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2 }}>
                                    <ImageIcon size={40} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                        {t('calendar.error.imageNotAvailable')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Pose Image Thumbnails */}
                        {hasPoseImages && poseImages.length > 1 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto', pb: 0.5, maxWidth: '100%' }}>
                                {poseImages.map((poseImg, idx) => (
                                    <IconButton
                                        key={`pose-thumb-${idx}`}
                                        onClick={() => setCurrentPoseImageIndex(idx)}
                                        sx={{
                                            flexShrink: 0,
                                            width: 56,
                                            height: 56,
                                            borderRadius: 1,
                                            border: 2,
                                            overflow: 'hidden',
                                            p: 0,
                                            ...(idx === currentPoseImageIndex
                                                ? {
                                                      borderColor: 'primary.main',
                                                      boxShadow: theme.shadows[2],
                                                  }
                                                : {
                                                      borderColor: 'divider',
                                                      opacity: 0.6,
                                                      '&:hover': {
                                                          opacity: 1,
                                                      },
                                                  }),
                                        }}
                                        aria-label={`Go to pose image ${idx + 1}`}
                                    >
                                        {failedPoseImages.has(idx) ? (
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    bgcolor: 'action.disabledBackground',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <ImageIcon size={18} style={{ color: theme.palette.text.disabled }} />
                                            </Box>
                                        ) : (
                                            <Box
                                                component='img'
                                                src={poseImg}
                                                alt={`Pose thumbnail ${idx + 1}`}
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={() => handlePoseImageError(idx)}
                                            />
                                        )}
                                    </IconButton>
                                ))}
                            </Box>
                        )}

                        <Typography variant='caption' sx={{ color: 'text.secondary', mt: 1, textAlign: 'center' }}>
                            {outfitData.name || `Outfit #${outfitData.id}`}
                        </Typography>
                    </Box>

                    {/* Right: Associated Items */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
                            {t('calendar.modal.associatedGarments')}
                        </Typography>

                        {hasItems ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Current Item Display */}
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: '90%',
                                        aspectRatio: '3/4',
                                        bgcolor: 'action.selected',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: 2,
                                        borderColor: 'divider',
                                    }}
                                >
                                    {/* Previous Button */}
                                    {associatedItems.length > 1 && (
                                        <IconButton
                                            onClick={goToPrevious}
                                            sx={{
                                                position: 'absolute',
                                                left: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                zIndex: 10,
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            }}
                                            aria-label='Previous item'
                                        >
                                            <ChevronLeft size={20} />
                                        </IconButton>
                                    )}

                                    {currentItem && currentItem.imageUrl && !failedImageIds.has(currentItem.id) ? (
                                        <Box
                                            component='img'
                                            src={currentItem.imageUrl}
                                            alt={currentItem.name}
                                            sx={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                p: 1,
                                            }}
                                            data-item-id={currentItem.id}
                                            onError={handleImageError}
                                        />
                                    ) : currentItem && isItemDeleted(currentItem) ? (
                                        <Alert
                                            severity='warning'
                                            icon={<AlertCircle size={20} />}
                                            sx={{
                                                bgcolor: 'warning.lightOpacity',
                                                border: 1,
                                                borderColor: 'warning.main',
                                            }}
                                        >
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                {t('calendar.error.itemRemoved')}
                                            </Typography>
                                            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                                                ID: {currentItem.id}
                                            </Typography>
                                        </Alert>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                            <ImageIcon size={40} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                {t('calendar.error.imageNotAvailable')}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Next Button */}
                                    {associatedItems.length > 1 && (
                                        <IconButton
                                            onClick={goToNext}
                                            sx={{
                                                position: 'absolute',
                                                right: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                zIndex: 10,
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            }}
                                            aria-label='Next item'
                                        >
                                            <ChevronRight size={20} />
                                        </IconButton>
                                    )}

                                    {/* Counter */}
                                    {associatedItems.length > 1 && (
                                        <Chip
                                            label={`${currentItemIndex + 1} / ${associatedItems.length}`}
                                            size='small'
                                            sx={{
                                                position: 'absolute',
                                                bottom: 8,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'common.white',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Item Info */}
                                {currentItem && (
                                    <Box
                                        sx={{
                                            borderRadius: 1,
                                            p: 2,
                                            ...(isItemDeleted(currentItem)
                                                ? {
                                                      bgcolor: 'warning.lightOpacity',
                                                      border: 1,
                                                      borderColor: 'warning.main',
                                                  }
                                                : {
                                                      bgcolor: 'action.selected',
                                                  }),
                                        }}
                                    >
                                        <Typography variant='body2' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                            {isItemDeleted(currentItem) ? t('calendar.error.deletedItem') : currentItem.name}
                                        </Typography>
                                        <Typography variant='caption' sx={{ color: 'text.secondary', mt: 0.5, wordBreak: 'break-word' }}>
                                            ID: {currentItem.id}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Thumbnail Navigation */}
                                {associatedItems.length > 1 && (
                                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                                        {associatedItems.map((item, idx) => (
                                            <IconButton
                                                key={`outfit-item-${idx}-${item.id}`}
                                                onClick={() => setCurrentItemIndex(idx)}
                                                sx={{
                                                    flexShrink: 0,
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 1,
                                                    border: 2,
                                                    overflow: 'hidden',
                                                    p: 0,
                                                    ...(idx === currentItemIndex
                                                        ? {
                                                              borderColor: 'primary.main',
                                                              boxShadow: theme.shadows[2],
                                                          }
                                                        : {
                                                              borderColor: 'divider',
                                                              opacity: 0.6,
                                                              '&:hover': {
                                                                  opacity: 1,
                                                              },
                                                          }),
                                                }}
                                                aria-label={`Go to item ${idx + 1}`}
                                            >
                                                {isItemDeleted(item) ? (
                                                    <Box
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            bgcolor: 'warning.lightOpacity',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <AlertCircle size={18} style={{ color: theme.palette.warning.main }} />
                                                    </Box>
                                                ) : (
                                                    <Box
                                                        component='img'
                                                        src={item.imageUrl}
                                                        alt={`Thumbnail ${idx + 1}`}
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                        data-item-id={item.id}
                                                        onError={handleImageError}
                                                    />
                                                )}
                                            </IconButton>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 200,
                                    textAlign: 'center',
                                    color: 'text.disabled',
                                }}
                            >
                                <Typography variant='body2'>{t('calendar.error.noAssociatedItems')}</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    )
}

export default OutfitDetailsModal
