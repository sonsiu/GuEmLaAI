'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useTheme } from '@mui/material/styles'
import { Shirt, Layers, Calendar as CalendarIcon, Search, Image as ImageIcon } from 'lucide-react'
import { wardrobeService } from '@/services/wardrobe.service'
import { getCachedItemImage, getCachedOutfitImage } from '@/utils/calendar-image.utils'
import { showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAuth } from '@/@core/contexts/AuthContext'

interface AddDataModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    onAddData: (type: 'item' | 'outfit' | 'event', data: any) => void
}

interface GarmentItem {
    id: number
    imageFilename?: string
    imageUrl: string
    categoryName?: string
    name?: string
}

// Helper function to format date in local timezone as YYYY-MM-DD
const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const AddDataModal: React.FC<AddDataModalProps> = ({ isOpen, onClose, selectedDate, onAddData }) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<string>('0')
    const [searchQuery, setSearchQuery] = useState('')
    const [items, setItems] = useState<GarmentItem[]>([])
    const [outfits, setOutfits] = useState<GarmentItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetchedItems, setHasFetchedItems] = useState(false)
    const [hasFetchedOutfits, setHasFetchedOutfits] = useState(false)

    // Event Form State
    const [eventName, setEventName] = useState('')
    const [isAllDay, setIsAllDay] = useState(false)
    const [eventStartDate, setEventStartDate] = useState(formatDateLocal(selectedDate))
    const [eventStartTime, setEventStartTime] = useState('09:00')
    const [eventEndDate, setEventEndDate] = useState(formatDateLocal(selectedDate))
    const [eventEndTime, setEventEndTime] = useState('17:00')

    const fetchItems = useCallback(async () => {
        setIsLoading(true)

        try {
            if (!user?.id) throw new Error('User not found')

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
    }, [t, user])

    const fetchOutfits = useCallback(async () => {
        setIsLoading(true)

        try {
            if (!user?.id) throw new Error('User not found')

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
                        name: outfit.name || `Outfit #${outfit.id}`,
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
    }, [t, user])

    useEffect(() => {
        if (!isOpen) return

        if (activeTab === '0' && !hasFetchedItems) {
            fetchItems()
        } else if (activeTab === '1' && !hasFetchedOutfits) {
            fetchOutfits()
        }
    }, [isOpen, activeTab, hasFetchedItems, hasFetchedOutfits, fetchItems, fetchOutfits])

    const handleAddEvent = () => {
        if (!eventName.trim()) {
            showErrorToast(t('calendar.error.eventNameEmpty'))
            return
        }

        const eventId = Math.floor(Math.random() * 1000000) + Date.now()
        const eventData = {
            id: eventId,
            name: eventName,
            time: isAllDay ? 'All Day' : eventStartTime,
            startDate: eventStartDate,
            startTime: eventStartTime,
            endDate: eventEndDate,
            endTime: eventEndTime,
            isAllDay: isAllDay,
            associatedGarments: {},
        }

        onAddData('event', eventData)
        resetEventForm()
    }

    const resetEventForm = () => {
        setEventName('')
        setIsAllDay(false)
        setEventStartDate(formatDateLocal(selectedDate))
        setEventStartTime('09:00')
        setEventEndDate(formatDateLocal(selectedDate))
        setEventEndTime('17:00')
    }

    const filteredData = (activeTab === '0' ? items : outfits).filter((item) => {
        const searchLower = searchQuery.toLowerCase()

        return (
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.categoryName && item.categoryName.toLowerCase().includes(searchLower))
        )
    })

    const handleModalClose = () => {
        resetEventForm()
        onClose()
    }

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue)
        if (newValue === '2') {
            // Reset event form when switching to event tab
            resetEventForm()
        }
    }

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && activeTab === '2') {
            setEventStartDate(formatDateLocal(selectedDate))
            setEventEndDate(formatDateLocal(selectedDate))
        }
    }, [isOpen, activeTab, selectedDate])

    return (
        <Dialog open={isOpen} onClose={handleModalClose} maxWidth='md' fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant='h6' sx={{ fontWeight: 700 }}>
                            {t('calendar.modal.title')}
                        </Typography>
                        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <TabContext value={activeTab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab
                                    icon={<Shirt size={18} />}
                                    iconPosition='start'
                                    label={t('calendar.item')}
                                    value='0'
                                />
                                <Tab
                                    icon={<Layers size={18} />}
                                    iconPosition='start'
                                    label={t('tryOn.outfitLabel')}
                                    value='1'
                                />
                                <Tab
                                    icon={<CalendarIcon size={18} />}
                                    iconPosition='start'
                                    label={t('calendar.event.label')}
                                    value='2'
                                />
                            </Tabs>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
                            {/* Event Tab */}
                            <TabPanel value='2' sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label={t('calendar.modal.eventName')}
                                        placeholder={t('calendar.modal.eventNamePlaceholder')}
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isAllDay}
                                                onChange={(e) => setIsAllDay(e.target.checked)}
                                            />
                                        }
                                        label={t('calendar.event.isAllDay')}
                                    />

                                    {/* Start Date and Time */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={isAllDay ? 12 : 6}>
                                            <TextField
                                                fullWidth
                                                type='date'
                                                label={t('calendar.event.startDate')}
                                                value={eventStartDate}
                                                onChange={(e) => setEventStartDate(e.target.value)}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                        {!isAllDay && (
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    type='time'
                                                    label={t('calendar.event.startTime')}
                                                    value={eventStartTime}
                                                    onChange={(e) => setEventStartTime(e.target.value)}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                        )}
                                    </Grid>

                                    {/* End Date and Time */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={isAllDay ? 12 : 6}>
                                            <TextField
                                                fullWidth
                                                type='date'
                                                label={t('calendar.event.endDate')}
                                                value={eventEndDate}
                                                onChange={(e) => setEventEndDate(e.target.value)}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                        {!isAllDay && (
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    type='time'
                                                    label={t('calendar.event.endTime')}
                                                    value={eventEndTime}
                                                    onChange={(e) => setEventEndTime(e.target.value)}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            </TabPanel>

                            {/* Item/Outfit Tabs */}
                            {(activeTab === '0' || activeTab === '1') && (
                                <>
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
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: 200,
                                                    gap: 2,
                                                }}
                                            >
                                                <CircularProgress />
                                                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                                    {t('calendar.modal.loadingData')}
                                                </Typography>
                                            </Box>
                                        ) : filteredData.length > 0 ? (
                                            <Grid container spacing={2}>
                                                {filteredData.map((item, index) => (
                                                    <Grid item xs={6} sm={4} md={3} key={`${activeTab}-item-${index}-${item.id}`}>
                                                        <Button
                                                            onClick={() =>
                                                                onAddData(
                                                                    activeTab === '0' ? 'item' : 'outfit',
                                                                    activeTab === '0' ? [item] : item
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
                                                                    position: 'relative',
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
                                </>
                            )}
                        </Box>
                    </TabContext>
                </DialogContent>

                <DialogActions>
                    {activeTab === '2' ? (
                        <>
                            <Button onClick={handleModalClose}>{t('common.cancel')}</Button>
                            <Button onClick={handleAddEvent} variant='contained'>
                                {t('calendar.modal.createEvent')}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleModalClose}>{t('common.close')}</Button>
                    )}
                </DialogActions>
            </Dialog>
    )
}

export default AddDataModal
