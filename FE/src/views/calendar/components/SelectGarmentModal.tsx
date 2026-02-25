'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { Search, Shirt, Layers, Image as ImageIcon } from 'lucide-react'
import { wardrobeService } from '@/services/wardrobe.service'
import { getCachedItemImage, getCachedOutfitImage } from '@/utils/calendar-image.utils'
import { showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAuth } from '@/@core/contexts/AuthContext'

interface SelectGarmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (
        type: 'item' | 'outfit',
        id: number,
        imageUrl: string,
        imageFilename?: string,
        name?: string,
        categoryName?: string
    ) => void
}

interface GarmentItem {
    id: number
    imageFilename?: string
    imageUrl: string
    categoryName?: string
    name?: string
}

const SelectGarmentModal: React.FC<SelectGarmentModalProps> = ({ isOpen, onClose, onSelect }) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<string>('0')
    const [searchQuery, setSearchQuery] = useState('')
    const [items, setItems] = useState<GarmentItem[]>([])
    const [outfits, setOutfits] = useState<GarmentItem[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Cache for fetched data to avoid refetching on every open
    const [hasFetchedItems, setHasFetchedItems] = useState(false)
    const [hasFetchedOutfits, setHasFetchedOutfits] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (activeTab === '0' && !hasFetchedItems) {
                fetchItems()
            } else if (activeTab === '1' && !hasFetchedOutfits) {
                fetchOutfits()
            }
        }
    }, [isOpen, activeTab])

    const fetchItems = async () => {
        setIsLoading(true)
        try {
            if (!user?.id) {
                throw new Error('User not found')
            }
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id

            const response = await wardrobeService.getUserItems(userId, 1, 100)

            const fetchedItems = await Promise.all(
                (response?.data || []).map(async (item) => {
                    let imageUrl = item.imageUrl || ''
                    if (!imageUrl && item.id) {
                        imageUrl = await getCachedItemImage(item.id)
                    }

                    return {
                        id: item.id,
                        imageUrl,
                        categoryName: item.categoryName,
                        imageFilename: item.imagePreview,
                    }
                })
            )

            setItems(fetchedItems)
            setHasFetchedItems(true)
        } catch (error) {
            showErrorToast(t('wardrobe.errors.fetchItems'))
        } finally {
            setIsLoading(false)
        }
    }

    const fetchOutfits = async () => {
        setIsLoading(true)
        try {
            if (!user?.id) {
                throw new Error('User not found')
            }
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id

            const response = await wardrobeService.getUserOutfits(userId, 1, 100)

            const fetchedOutfits = await Promise.all(
                (response?.data || []).map(async (outfit) => {
                    let imageUrl = outfit.imageUrl || ''
                    if (!imageUrl && outfit.id) {
                        imageUrl = await getCachedOutfitImage(outfit.id)
                    }

                    return {
                        id: outfit.id,
                        imageUrl,
                        name: outfit.name || t('calendar.modal.outfitDefaultName', { id: outfit.id }),
                        imageFilename: outfit.imagePreview,
                    }
                })
            )

            setOutfits(fetchedOutfits)
            setHasFetchedOutfits(true)
        } catch (error) {
            showErrorToast(t('wardrobe.errors.fetchOutfits'))
        } finally {
            setIsLoading(false)
        }
    }

    const filteredData = (activeTab === '0' ? items : outfits).filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.categoryName && item.categoryName.toLowerCase().includes(searchLower))
        )
    })

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue)
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{t('calendar.modal.addGarment')}</DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <TabContext value={activeTab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab icon={<Shirt size={18} />} iconPosition='start' label={t('wardrobe.items')} value='0' />
                            <Tab icon={<Layers size={18} />} iconPosition='start' label={t('wardrobe.outfits')} value='1' />
                        </Tabs>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                size='small'
                                placeholder={t('calendar.modal.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <Search size={18} style={{ color: theme.palette.text.secondary }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <TabPanel value={activeTab} sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                            {isLoading ? (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: 200,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : filteredData.length > 0 ? (
                                <Grid container spacing={2}>
                                    {filteredData.map((item, index) => (
                                        <Grid item xs={6} sm={4} md={3} key={`${activeTab}-garment-${index}-${item.id}`}>
                                            <Button
                                                onClick={() =>
                                                    onSelect(
                                                        activeTab === '0' ? 'item' : 'outfit',
                                                        item.id,
                                                        item.imageUrl,
                                                        item.imageFilename,
                                                        item.name,
                                                        item.categoryName
                                                    )
                                                }
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    p: 1,
                                                    textAlign: 'left',
                                                    textTransform: 'none',
                                                    width: '100%',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        aspectRatio: '1',
                                                        width: '100%',
                                                        borderRadius: 1,
                                                        border: 1,
                                                        borderColor: 'divider',
                                                        bgcolor: 'action.selected',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        '&:hover': {
                                                            borderColor: 'primary.main',
                                                            boxShadow: theme.shadows[2],
                                                        },
                                                    }}
                                                >
                                                    {item.imageUrl ? (
                                                        <Box
                                                            component='img'
                                                            src={item.imageUrl}
                                                            alt={item.name || item.categoryName || t('calendar.item')}
                                                            sx={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'contain',
                                                                p: 1,
                                                            }}
                                                        />
                                                    ) : (
                                                        <ImageIcon size={32} style={{ color: theme.palette.text.disabled }} />
                                                    )}
                                                </Box>
                                                <Typography
                                                    variant='caption'
                                                    sx={{
                                                        fontWeight: 500,
                                                        textAlign: 'center',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        width: '100%',
                                                        color: 'text.primary',
                                                    }}
                                                >
                                                    {item.name ||
                                                        item.categoryName ||
                                                        (activeTab === '0'
                                                            ? t('calendar.modal.itemDefaultName', { id: item.id })
                                                            : t('calendar.modal.outfitDefaultName', { id: item.id }))}
                                                </Typography>
                                            </Button>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 200,
                                        color: 'text.disabled',
                                    }}
                                >
                                    <Typography variant='body2'>{t('calendar.modal.noResults')}</Typography>
                                </Box>
                            )}
                        </TabPanel>
                    </Box>
                </TabContext>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    )
}

export default SelectGarmentModal
