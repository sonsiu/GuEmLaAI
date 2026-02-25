'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Eye } from 'lucide-react'
import OutfitDetailsModal from './OutfitDetailsModal'
import { OutfitDetailsData } from '@/types/calendar.type'
import { calendarService } from '@/services/calendar.service'
import { showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface Garment {
    type: 'item' | 'outfit'
    id: number
    imageUrl: string
    imageFilename?: string
    categoryName?: string
    name?: string
}

interface EventGarmentCarouselProps {
    garments: Garment[]
    eventId: number
    onRemoveGarment?: (eventId: number, garmentIndex: number) => void
    imageLoadErrors?: Set<number>
}

const EventGarmentCarousel: React.FC<EventGarmentCarouselProps> = ({
    garments,
    eventId,
    onRemoveGarment,
    imageLoadErrors = new Set(),
}) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [localImageErrors, setLocalImageErrors] = useState<Set<number>>(new Set())
    const [isOutfitDetailsOpen, setIsOutfitDetailsOpen] = useState(false)
    const [outfitDetails, setOutfitDetails] = useState<OutfitDetailsData | null>(null)
    const [isLoadingOutfitDetails, setIsLoadingOutfitDetails] = useState(false)

    if (garments.length === 0) {
        return null
    }

    // Reset currentIndex if it's out of bounds after garments array changes
    const safeIndex = currentIndex >= garments.length ? garments.length - 1 : currentIndex
    const currentGarment = garments[safeIndex]
    const totalGarments = garments.length

    // If safeIndex is different from currentIndex, update state
    if (safeIndex !== currentIndex) {
        setCurrentIndex(safeIndex)
    }

    // Guard against undefined currentGarment
    if (!currentGarment) {
        return null
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? totalGarments - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === totalGarments - 1 ? 0 : prev + 1))
    }

    const handleImageError = () => {
        setLocalImageErrors((prev) => new Set([...prev, currentIndex]))
    }

    const handleViewOutfitDetails = async () => {
        if (currentGarment.type !== 'outfit' || !currentGarment.id) return

        try {
            setIsLoadingOutfitDetails(true)
            const response = await calendarService.getAssociatedItemsFromOutfit(currentGarment.id)
            setOutfitDetails(response.data)
            setIsOutfitDetailsOpen(true)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('calendar.error.fetchOutfitDetails')
            showErrorToast(errorMessage)
        } finally {
            setIsLoadingOutfitDetails(false)
        }
    }

    const hasImageError = localImageErrors.has(currentIndex)

    return (
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Carousel Display */}
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'action.selected',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 192,
                }}
            >
                {/* Left Arrow */}
                {totalGarments > 1 && (
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
                        aria-label='Previous garment'
                    >
                        <ChevronLeft size={20} />
                    </IconButton>
                )}

                {/* Image or Error State */}
                {!hasImageError ? (
                    <Box
                        component='img'
                        src={currentGarment.imageUrl}
                        alt={currentGarment.categoryName || currentGarment.name || t('calendar.item')}
                        sx={{
                            maxHeight: 224,
                            maxWidth: '100%',
                            objectFit: 'contain',
                        }}
                        onError={handleImageError}
                    />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ImageIcon size={40} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                        <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {t('calendar.error.imageNotAvailable')}
                        </Typography>
                    </Box>
                )}

                {/* Right Arrow */}
                {totalGarments > 1 && (
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
                        aria-label='Next garment'
                    >
                        <ChevronRight size={20} />
                    </IconButton>
                )}

                {/* View Outfit Details Button (for outfits only) */}
                {currentGarment.type === 'outfit' && (
                    <IconButton
                        onClick={handleViewOutfitDetails}
                        disabled={isLoadingOutfitDetails}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            zIndex: 10,
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                            '&.Mui-disabled': {
                                opacity: 0.5,
                            },
                        }}
                        size='small'
                        aria-label='View outfit details'
                        title='View outfit and associated items'
                    >
                        {isLoadingOutfitDetails ? (
                            <CircularProgress size={16} sx={{ color: 'primary.contrastText' }} />
                        ) : (
                            <Eye size={14} />
                        )}
                    </IconButton>
                )}

                {/* Remove Button */}
                {onRemoveGarment && (
                    <IconButton
                        onClick={() => onRemoveGarment(eventId, currentIndex)}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'error.main',
                            color: 'error.contrastText',
                            zIndex: 10,
                            '&:hover': {
                                bgcolor: 'error.dark',
                            },
                        }}
                        size='small'
                        aria-label='Remove garment'
                    >
                        <X size={14} />
                    </IconButton>
                )}

                {/* Counter */}
                {totalGarments > 1 && (
                    <Chip
                        label={`${currentIndex + 1} / ${totalGarments}`}
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

            {/* Garment Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {currentGarment.categoryName || currentGarment.name || `${currentGarment.type} #${currentIndex + 1}`}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {currentGarment.type}
                    </Typography>
                </Box>
                {totalGarments > 1 && (
                    <Chip
                        label={`${totalGarments} ${t('calendar.items')}`}
                        size='small'
                        sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            bgcolor: 'action.selected',
                        }}
                    />
                )}
            </Box>

            {/* Thumbnail Navigation (show if more than 1 garment) */}
            {totalGarments > 1 && (
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                    {garments.map((garment, idx) => (
                        <IconButton
                            key={`event-garment-thumb-${eventId}-${garment.type}-${garment.id}-${idx}`}
                            onClick={() => setCurrentIndex(idx)}
                            sx={{
                                flexShrink: 0,
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                border: 2,
                                overflow: 'hidden',
                                p: 0,
                                ...(idx === currentIndex
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
                            aria-label={`Go to garment ${idx + 1}`}
                        >
                            <Box
                                component='img'
                                src={garment.imageUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </IconButton>
                    ))}
                </Box>
            )}

            {/* Outfit Details Modal */}
            <OutfitDetailsModal
                isOpen={isOutfitDetailsOpen}
                onClose={() => setIsOutfitDetailsOpen(false)}
                outfitData={outfitDetails}
                isLoading={isLoadingOutfitDetails}
            />
        </Box>
    )
}

export default EventGarmentCarousel
