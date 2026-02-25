'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { ChevronLeft, ChevronRight, Trash2, Image as ImageIcon } from 'lucide-react'
import type { GarmentItem } from '@/types/calendar.type'
import { getCachedItemImage } from '@/utils/calendar-image.utils'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface ItemCarouselProps {
    items: GarmentItem[]
    onDeleteItem?: (itemId: number) => void
}

const ItemCarousel: React.FC<ItemCarouselProps> = ({ items, onDeleteItem }) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [presignedUrls, setPresignedUrls] = useState<Map<number, string>>(new Map())
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set())
    const [isLoadingImages, setIsLoadingImages] = useState(true)

    // Generate presigned URLs for all items on mount and when items change
    useEffect(() => {
        const generatePresignedUrls = async () => {
            setIsLoadingImages(true)
            setImageLoadErrors(new Set())
            const urls = new Map<number, string>()

            for (const item of items) {
                // If imageUrl already exists (runtime cache from modal), use it
                if (item.imageUrl) {
                    urls.set(item.id, item.imageUrl)
                }
                // If item has id, fetch cached image URL
                else if (item.id) {
                    const url = await getCachedItemImage(item.id)

                    if (url) {
                        urls.set(item.id, url)
                    }
                }
            }

            setPresignedUrls(urls)
            setIsLoadingImages(false)
        }

        if (items.length > 0) {
            generatePresignedUrls()
        } else {
            setIsLoadingImages(false)
            setCurrentIndex(0)
        }
    }, [items])

    // Reset currentIndex if it's out of bounds after items change
    useEffect(() => {
        if (currentIndex >= items.length) {
            setCurrentIndex(Math.max(0, items.length - 1))
        }
    }, [items.length, currentIndex])

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
    }

    if (!items || items.length === 0) return null

    const currentItem = items[currentIndex]

    // Guard against undefined currentItem
    if (!currentItem) return null

    const imageUrl = presignedUrls.get(currentItem.id) || ''
    const hasError = imageLoadErrors.has(currentItem.id)
    const totalItems = items.length

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, width: '100%' }}>
            {/* Carousel Display */}
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'action.selected',
                    borderRadius: 1,
                    p: { xs: 1, sm: 1.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: 200, sm: 240 },
                    maxHeight: { xs: 300, sm: 360 },
                    width: '100%',
                }}
            >
                {isLoadingImages ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <>
                        {/* Left Arrow */}
                        {totalItems > 1 && (
                            <IconButton
                                onClick={goToPrevious}
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    left: { xs: 4, sm: 8 },
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
                                <ChevronLeft size={16} />
                            </IconButton>
                        )}

                        {/* Image or Error State */}
                        {!hasError && imageUrl ? (
                            <Box
                                component='img'
                                src={imageUrl}
                                alt={`Item ${currentIndex + 1}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    maxHeight: { xs: 280, sm: 320 },
                                    objectFit: 'contain',
                                }}
                                onError={() => {
                                    setImageLoadErrors((prev) => new Set([...prev, currentItem.id]))
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 2,
                                }}
                            >
                                <ImageIcon size={48} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                                <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500, textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    {t('calendar.error.imageNotAvailable')}
                                </Typography>
                            </Box>
                        )}

                        {/* Right Arrow */}
                        {totalItems > 1 && (
                            <IconButton
                                onClick={goToNext}
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    right: { xs: 4, sm: 8 },
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
                                <ChevronRight size={16} />
                            </IconButton>
                        )}

                        {/* Delete Button */}
                        {onDeleteItem && (
                            <IconButton
                                onClick={() => onDeleteItem(currentItem.id)}
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    top: { xs: 4, sm: 8 },
                                    right: { xs: 4, sm: 8 },
                                    bgcolor: 'error.main',
                                    color: 'error.contrastText',
                                    '&:hover': {
                                        bgcolor: 'error.dark',
                                    },
                                }}
                                title={t('common.delete')}
                            >
                                <Trash2 size={14} />
                            </IconButton>
                        )}

                        {/* Counter */}
                        {totalItems > 1 && (
                            <Chip
                                label={`${currentIndex + 1} / ${totalItems}`}
                                size='small'
                                sx={{
                                    position: 'absolute',
                                    bottom: { xs: 4, sm: 8 },
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'common.white',
                                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                    fontWeight: 500,
                                    height: { xs: 20, sm: 24 },
                                }}
                            />
                        )}
                    </>
                )}
            </Box>

            {/* Item Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {currentItem.categoryName || `Item #${currentItem.id}`}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {t('calendar.modal.item')}
                    </Typography>
                </Box>
                {totalItems > 1 && (
                    <Chip
                        label={`${totalItems} ${t('calendar.modal.item')}s`}
                        size='small'
                        sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            bgcolor: 'action.selected',
                        }}
                    />
                )}
            </Box>

            {/* Thumbnail Navigation (show if more than 1 item) */}
            {totalItems > 1 && (
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                    {items.map((item, idx) => {
                        const thumbUrl = presignedUrls.get(item.id) || ''

                        return (
                            <IconButton
                                key={`item-thumb-${idx}-${item.id}`}
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
                                aria-label={`Go to item ${idx + 1}`}
                            >
                                {thumbUrl ? (
                                    <Box
                                        component='img'
                                        src={thumbUrl}
                                        alt={`Thumbnail ${idx + 1}`}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <ImageIcon size={16} style={{ color: theme.palette.text.disabled }} />
                                    </Box>
                                )}
                            </IconButton>
                        )
                    })}
                </Box>
            )}
        </Box>
    )
}

export default ItemCarousel
