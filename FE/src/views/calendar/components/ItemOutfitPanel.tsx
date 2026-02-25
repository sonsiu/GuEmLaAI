'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import type { GarmentItem, Outfit, OutfitDetailsData } from '@/types/calendar.type'
import ItemCarousel from './ItemCarousel'
import OutfitDetailsModal from './OutfitDetailsModal'
import { getCachedOutfitImage } from '@/utils/calendar-image.utils'
import { calendarService } from '@/services/calendar.service'
import { showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface ItemOutfitPanelProps {
    items: GarmentItem[]
    outfit: Outfit | null
    onDeleteItem?: (itemId: number) => void
    onDeleteOutfit?: () => void
    onAddItemOrOutfit?: () => void
}

const ItemOutfitPanel: React.FC<ItemOutfitPanelProps> = ({
    items,
    outfit,
    onDeleteItem,
    onDeleteOutfit,
    onAddItemOrOutfit,
}) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [presignedUrl, setPresignedUrl] = useState<string>('')
    const [isLoadingImage, setIsLoadingImage] = useState(true)
    const [imageLoadError, setImageLoadError] = useState(false)
    const [isOutfitDetailsOpen, setIsOutfitDetailsOpen] = useState(false)
    const [outfitDetails, setOutfitDetails] = useState<OutfitDetailsData | null>(null)
    const [isLoadingOutfitDetails, setIsLoadingOutfitDetails] = useState(false)

    // Generate presigned URL from imageFilename when outfit changes
    useEffect(() => {
        const generatePresignedUrl = async () => {
            if (!outfit) {
                setIsLoadingImage(false)
                return
            }

            setIsLoadingImage(true)
            setImageLoadError(false)

            // If imageUrl already exists (runtime cache from modal), use it
            if (outfit.imageUrl) {
                setPresignedUrl(outfit.imageUrl)
                setIsLoadingImage(false)
            }
            // If imageFilename exists (stored in database), generate presigned URL
            else if (outfit.imageFilename) {
                // Use outfit.id to fetch image
                const url = await getCachedOutfitImage(outfit.id)

                setPresignedUrl(url)
                setIsLoadingImage(false)
            } else {
                // Fallback try by ID
                const url = await getCachedOutfitImage(outfit.id)

                if (url) setPresignedUrl(url)
                setIsLoadingImage(false)
            }
        }

        generatePresignedUrl()
    }, [outfit])

    const handleOutfitImageClick = async () => {
        if (!outfit || !outfit.id) {
            showErrorToast(t('calendar.error.incompleteOutfitData'))
            return
        }

        try {
            setIsLoadingOutfitDetails(true)
            const response = await calendarService.getAssociatedItemsFromOutfit(outfit.id)

            setOutfitDetails(response.data)
            setIsOutfitDetailsOpen(true)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('calendar.error.fetchOutfitDetails')

            showErrorToast(errorMessage)
        } finally {
            setIsLoadingOutfitDetails(false)
        }
    }

    const hasItems = items.length > 0
    const hasOutfit = outfit !== null

    return (
        <Card
            sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'action.selected',
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 },
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {t('calendar.panel.itemsAndOutfit')}
                </Typography>
                {onAddItemOrOutfit && (
                    <Button
                        variant='contained'
                        size='small'
                        onClick={onAddItemOrOutfit}
                        startIcon={<Plus size={14} />}
                        title='Add item or outfit from database'
                    >
                        {t('common.add')}
                    </Button>
                )}
            </Box>

            {/* Content Layout */}
            <Box
                sx={{
                    display: 'flex',
                    gap: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', md: hasItems && hasOutfit ? 'row' : 'column' },
                    alignItems: { xs: 'stretch', md: hasItems && hasOutfit ? 'flex-start' : 'stretch' },
                }}
            >
                {/* Items Section */}
                {hasItems && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            flex: hasOutfit ? 1 : 'none',
                            minWidth: 0,
                            width: { xs: '100%', md: hasOutfit ? '50%' : '100%' }
                        }}
                    >
                        <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            {t('calendar.panel.itemOfToday')}
                        </Typography>
                        <ItemCarousel items={items} onDeleteItem={onDeleteItem} />
                    </Box>
                )}

                {/* Divider - only show when both sections exist */}
                {hasItems && hasOutfit && (
                    <Box
                        sx={{
                            width: { xs: '100%', md: '1px' },
                            height: { xs: '1px', md: 'auto' },
                            bgcolor: 'divider',
                            flexShrink: 0,
                        }}
                    />
                )}

                {/* Outfit Section */}
                {hasOutfit && outfit && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            flex: hasItems ? 1 : 'none',
                            minWidth: 0,
                            width: { xs: '100%', md: hasItems ? '50%' : '100%' }
                        }}
                    >
                        <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            {t('calendar.panel.outfitOfToday')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    width: '100%',
                                    minHeight: { xs: 200, sm: 240 },
                                    maxHeight: { xs: 300, sm: 360 },
                                    '&:hover .outfit-overlay': {
                                        opacity: 1,
                                    },
                                }}
                                onClick={handleOutfitImageClick}
                            >
                                {isLoadingImage ? (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'action.selected',
                                            borderRadius: 1,
                                        }}
                                    >
                                        <CircularProgress size={32} />
                                    </Box>
                                ) : imageLoadError || !presignedUrl ? (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'action.selected',
                                            borderRadius: 1,
                                            border: 2,
                                            borderStyle: 'dashed',
                                            borderColor: 'divider',
                                            p: 2,
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                            },
                                        }}
                                    >
                                        <ImageIcon size={48} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                                        <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500, textAlign: 'center' }}>
                                            {t('calendar.error.imageNotAvailable')}
                                        </Typography>
                                        <Typography variant='caption' sx={{ color: 'text.disabled', mt: 0.5, textAlign: 'center' }}>
                                            {t('calendar.error.imageDeleted')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <Box
                                            component='img'
                                            src={presignedUrl}
                                            alt='Outfit'
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                maxHeight: { xs: 300, sm: 360 },
                                                objectFit: 'contain',
                                                borderRadius: 1,
                                                '&:hover': {
                                                    opacity: 0.9,
                                                },
                                            }}
                                            onError={() => {
                                                setImageLoadError(true)
                                            }}
                                        />
                                        {/* Overlay hint on hover */}
                                        <Box
                                            className='outfit-overlay'
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                bgcolor: 'rgba(0, 0, 0, 0)',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                                                },
                                            }}
                                        >
                                            <Box
                                                component='svg'
                                                xmlns='http://www.w3.org/2000/svg'
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    color: 'common.white',
                                                }}
                                                fill='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z' />
                                            </Box>
                                        </Box>
                                    </>
                                )}
                                {onDeleteOutfit && (
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteOutfit()
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: 'error.main',
                                            color: 'error.contrastText',
                                            '&:hover': {
                                                bgcolor: 'error.dark',
                                            },
                                        }}
                                        size='small'
                                        title='Delete outfit'
                                    >
                                        <Trash2 size={18} />
                                    </IconButton>
                                )}
                            </Box>
                            {/* Outfit Name Display */}
                            {outfit.name && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Chip
                                        label={outfit.name}
                                        sx={{
                                            bgcolor: 'action.selected',
                                            fontWeight: 600,
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Outfit Details Modal */}
            <OutfitDetailsModal
                isOpen={isOutfitDetailsOpen}
                onClose={() => setIsOutfitDetailsOpen(false)}
                outfitData={outfitDetails}
                isLoading={isLoadingOutfitDetails}
            />
        </Card>
    )
}

export default ItemOutfitPanel
