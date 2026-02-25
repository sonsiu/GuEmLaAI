'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Fab from '@mui/material/Fab'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'
import { Cloud, RefreshCw, Plus } from 'lucide-react'
import type {
    CalendarData,
    GarmentItem,
    Outfit,
    Event as CalendarEvent,
    DailyForecast
} from '@/types/calendar.type'
import DayContentGrid from '@/views/calendar/components/DayContentGrid'
import CalendarWithUpcoming from '@/views/calendar/components/CalendarWithUpcoming'
import AddDataModal from '@/views/calendar/components/AddDataModal'
import { calendarService } from '@/services/calendar.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { getCachedItemImage, getCachedOutfitImage } from '@/utils/calendar-image.utils'

export default function CalendarPage() {
    const theme = useTheme()
    const { t } = useTranslation()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [currentForecast, setCurrentForecast] = useState<DailyForecast | undefined>(undefined)
    const [calendarData, setCalendarData] = useState<CalendarData>({})
    const [hasInitialLoad, setHasInitialLoad] = useState(false)
    const [shouldShowSaveToast, setShouldShowSaveToast] = useState(false)

    const toISODateString = (date: Date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const findGarmentDateKey = (
        associatedGarments: CalendarEvent['associatedGarments'],
        targetKey: string
    ): string => {
        if (!associatedGarments) {
            return targetKey
        }

        if (associatedGarments[targetKey]) {
            return targetKey
        }

        const fallbackKey = Object.keys(associatedGarments).find((key) => key.startsWith(targetKey))

        return fallbackKey || targetKey
    }

const normalizeAssociatedGarments = (
    associatedGarments: CalendarEvent['associatedGarments']
): CalendarEvent['associatedGarments'] => {
    if (!associatedGarments) {
        return {}
    }

    const normalized: CalendarEvent['associatedGarments'] = {}

    Object.entries(associatedGarments).forEach(([key, garments]) => {
        const normalizedKey = key.split('T')[0]
        normalized[normalizedKey] = [
            ...(normalized[normalizedKey] || []),
            ...garments.map((garment) => ({ ...garment })),
        ]
    })

    return normalized
}


    // Normalize calendar data: ensure events are filled into all days in their date range
    const normalizeCalendarData = (data: CalendarData): CalendarData => {
        // Deep clone to avoid mutating original data
        const normalized: CalendarData = JSON.parse(JSON.stringify(data))

        // First pass: collect all unique events with their date ranges
        const eventsMap = new Map<number, { event: CalendarEvent; startDate: Date; endDate: Date }>()

        Object.keys(normalized).forEach((dateKey) => {
            const dayData = normalized[dateKey]
            if (dayData?.events && Array.isArray(dayData.events)) {
                dayData.events.forEach((event) => {
                    // Only process if we haven't seen this event ID before
                    if (!eventsMap.has(event.id)) {
                        const startDateStr = event.startDate || dateKey
                        const endDateStr = event.endDate || startDateStr
                        const startDate = new Date(startDateStr)
                        const endDate = new Date(endDateStr)

                        // Deep clone the event to avoid reference issues, preserving all properties
                        const eventClone: CalendarEvent = {
                            ...event,
                            associatedGarments: normalizeAssociatedGarments(
                                event.associatedGarments ? JSON.parse(JSON.stringify(event.associatedGarments)) : {}
                            ),
                        }
                        eventsMap.set(event.id, { event: eventClone, startDate, endDate })
                        
                    }
                })
            }
        })

        // Second pass: fill events into all days in their date range
        eventsMap.forEach(({ event, startDate, endDate }) => {
            const currentDate = new Date(startDate)

            while (currentDate <= endDate) {
                const currentDateKey = toISODateString(currentDate)

                // Ensure dayData exists
                if (!normalized[currentDateKey]) {
                    normalized[currentDateKey] = {
                        items: [],
                        outfit: null,
                        events: []
                    }
                }

                // Ensure events array exists
                if (!normalized[currentDateKey].events) {
                    normalized[currentDateKey].events = []
                }

                // Check if event already exists in this day
                const eventExists = normalized[currentDateKey].events.some((e) => e.id === event.id)
                if (!eventExists) {
                    // Deep clone event for this day, preserving ALL properties including associatedGarments
                    // Use JSON parse/stringify to ensure deep copy of nested objects
                    const eventForDay: CalendarEvent = JSON.parse(JSON.stringify(event))
                    
                    // Ensure associatedGarments exists and is an object
                    if (!eventForDay.associatedGarments) {
                        eventForDay.associatedGarments = {}
                    }
                    
                    normalized[currentDateKey].events.push(eventForDay)
                }

                currentDate.setDate(currentDate.getDate() + 1)
            }
        })

        // Log final result with detailed event info
        return normalized
    }

    const hydrateEventGarmentImages = async (data: CalendarData): Promise<CalendarData> => {
        const hydrated: CalendarData = JSON.parse(JSON.stringify(data))
        const imagePromises: Promise<void>[] = []

        Object.keys(hydrated).forEach((dateKey) => {
            const dayData = hydrated[dateKey]
            if (!dayData?.events) return

            dayData.events.forEach((event) => {
                if (!event.associatedGarments) {
                    event.associatedGarments = {}
                    return
                }

                Object.entries(event.associatedGarments).forEach(([garmentDate, garments]) => {
                    garments.forEach((garment, garmentIndex) => {
                        if (garment.imageUrl || !garment.id) {
                            return
                        }

                        const fetchPromise =
                            garment.type === 'outfit'
                                ? getCachedOutfitImage(garment.id)
                                : getCachedItemImage(garment.id)

                        imagePromises.push(
                            fetchPromise
                                .then((url) => {
                                    if (url) {
                                        event.associatedGarments?.[garmentDate]?.[garmentIndex] &&
                                            (event.associatedGarments![garmentDate][garmentIndex].imageUrl = url)
                                    }
                                })
                                .catch(() => {
                                    // Ignore image fetch errors, UI will show fallback
                                })
                        )
                    })
                })
            })
        })

        if (imagePromises.length > 0) {
            await Promise.all(imagePromises)
        }

        return hydrated
    }

    // Helper function to determine what time to display for an event on a given date
    const getEventDisplayTime = (event: CalendarEvent, currentDateStr: string) => {
        const startDate = event.startDate || ''
        const endDate = event.endDate || startDate
        const startTime = event.startTime || '09:00'
        const endTime = event.endTime || '17:00'
        const isAllDay = event.isAllDay || false

        if (isAllDay) {
            return t('calendar.event.allDay') || 'All Day'
        }

        if (startDate === endDate) {
            return startTime
        }

        if (currentDateStr === startDate) {
            return startTime
        } else if (currentDateStr === endDate) {
            return endTime
        } else {
            return t('calendar.event.allDay') || 'All Day'
        }
    }

    useEffect(() => {
        const loadCalendarData = async () => {
            try {
                setIsLoading(true)
                const data = await calendarService.fetchUserCalendar()

                // Normalize calendar data to ensure events are filled into all days in their date range
                const normalizedData = normalizeCalendarData(data)
                const hydratedData = await hydrateEventGarmentImages(normalizedData)
                
                const selectedDateKey = toISODateString(selectedDate)
                const selectedDayData = normalizedData[selectedDateKey]

                // Set calendarData and mark initial load as complete
                // Use a small delay to ensure state is set before auto-save triggers
                setCalendarData(hydratedData)

                // Use setTimeout to ensure hasInitialLoad is set after calendarData
                setTimeout(() => {
                    setHasInitialLoad(true)
                }, 100)
            } catch (error) {
                if (
                    error instanceof Error &&
                    !error.message.includes('session') &&
                    !error.message.includes('Unauthorized')
                ) {
                    // Error handled silently
                }

                setCalendarData({})
                setHasInitialLoad(true)
            } finally {
                setIsLoading(false)
            }
        }

        loadCalendarData()
    }, [])

    useEffect(() => {
        let isCancelled = false

        const hydrateCurrentDayImages = async () => {
            const dateKey = toISODateString(selectedDate)
            const dayData = calendarData[dateKey]

            if (!dayData?.events?.length) {
                return
            }

            const missingImages: Array<{
                eventId: number
                garmentIndex: number
                garmentDate: string
                type: 'item' | 'outfit'
                id: number
            }> = []

            dayData.events.forEach((event) => {
                const garmentKey = findGarmentDateKey(event.associatedGarments, dateKey)
                const garments = event.associatedGarments?.[garmentKey] || []
                garments.forEach((garment, index) => {
                    if (!garment?.imageUrl && garment?.id) {
                        missingImages.push({
                            eventId: event.id,
                            garmentIndex: index,
                            garmentDate: garmentKey,
                            type: garment.type,
                            id: garment.id,
                        })
                    }
                })
            })

            if (missingImages.length === 0) {
                return
            }

            const hydratedResults = await Promise.all(
                missingImages.map(async (item) => {
                    const url =
                        item.type === 'outfit'
                            ? await getCachedOutfitImage(item.id)
                            : await getCachedItemImage(item.id)

                    return { ...item, url }
                })
            )

            if (isCancelled) {
                return
            }

            const validResults = hydratedResults.filter((result) => result.url)

            if (validResults.length === 0) {
                return
            }

            setCalendarData((prev) => {
                let hasChanges = false
                const updated = { ...prev }

                validResults.forEach(({ eventId, garmentDate, garmentIndex, url }) => {
                    if (!url) {
                        return
                    }

                    Object.keys(updated).forEach((key) => {
                        const day = updated[key]
                        if (!day?.events) {
                            return
                        }

                        let dayChanged = false

                        const newEvents = day.events.map((event) => {
                            if (event.id !== eventId) {
                                return event
                            }

                            const associatedGarments = {
                                ...(event.associatedGarments || {}),
                            }

                            const resolvedKey = findGarmentDateKey(event.associatedGarments, garmentDate)
                            const garmentsArray = [...(associatedGarments[resolvedKey] || [])]

                            if (!garmentsArray[garmentIndex]) {
                                return event
                            }

                            if (garmentsArray[garmentIndex].imageUrl === url) {
                                return event
                            }

                            dayChanged = true
                            hasChanges = true

                            garmentsArray[garmentIndex] = {
                                ...garmentsArray[garmentIndex],
                                imageUrl: url,
                            }

                            associatedGarments[resolvedKey] = garmentsArray

                            return {
                                ...event,
                                associatedGarments,
                            }
                        })

                        if (dayChanged) {
                            updated[key] = {
                                ...day,
                                events: newEvents,
                            }
                        }
                    })
                })

                return hasChanges ? updated : prev
            })
        }

        hydrateCurrentDayImages()

        return () => {
            isCancelled = true
        }
    }, [selectedDate, calendarData])

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
    }

    const handleAddData = (
        type: 'item' | 'outfit' | 'event',
        data: GarmentItem[] | Outfit | CalendarEvent
    ) => {
        const dateKey = toISODateString(selectedDate)

        if (type === 'item' && Array.isArray(data)) {
            const dayData = calendarData[dateKey] || {
                items: [],
                outfit: null,
                events: []
            }

            // Check for duplicate items
            const newItems = data.filter(newItem => {
                const isDuplicate = dayData.items.some(existingItem => existingItem.id === newItem.id)
                if (isDuplicate) {
                    showErrorToast(t('calendar.error.itemAlreadyExists'))
                }
                return !isDuplicate
            })

            if (newItems.length === 0) {
                setIsModalOpen(false)
                return
            }

            // Check maximum items limit (10 per day)
            const totalItems = dayData.items.length + newItems.length
            if (totalItems > 10) {
                showErrorToast(t('calendar.error.maxItemsReached', { max: 10, current: dayData.items.length }))
                setIsModalOpen(false)
                return
            }

            const updatedDayData = { ...dayData, items: [...dayData.items, ...newItems] }

            setCalendarData((prev) => ({
                ...prev,
                [dateKey]: updatedDayData
            }))
            setShouldShowSaveToast(true)
        } else if (type === 'outfit' && !Array.isArray(data)) {
            const dayData = calendarData[dateKey] || {
                items: [],
                outfit: null,
                events: []
            }

            // Check if outfit already exists
            if (dayData.outfit && dayData.outfit.id === (data as Outfit).id) {
                showErrorToast(t('calendar.error.outfitAlreadyExists'))
                setIsModalOpen(false)
                return
            }

            const updatedDayData = { ...dayData, outfit: data as Outfit }

            setCalendarData((prev) => ({
                ...prev,
                [dateKey]: updatedDayData
            }))
            setShouldShowSaveToast(true)
        } else if (type === 'event' && !Array.isArray(data)) {
            const event = data as CalendarEvent
            const startDate = new Date(event.startDate || dateKey)
            const endDate = new Date(event.endDate || dateKey)

            // Check if start date is before end date
            if (startDate > endDate) {
                showErrorToast(t('calendar.error.invalidDateRange') || 'End date must be after start date')
                setIsModalOpen(false)
                return
            }

            // Check if event already exists and max events limit in any day within the date range
            const checkDate = new Date(startDate)
            let eventExists = false
            let exceedsMaxEvents = false
            let exceedingDate = ''
            
            while (checkDate <= endDate) {
                const currentDateKey = toISODateString(checkDate)
                const dayData = calendarData[currentDateKey]
                
                // Check for duplicate
                if (dayData?.events?.some(e => e.id === event.id)) {
                    eventExists = true
                    break
                }
                
                // Check max events limit (10 per day)
                const currentEventCount = dayData?.events?.length || 0
                if (currentEventCount >= 5) {
                    exceedsMaxEvents = true
                    exceedingDate = checkDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })
                    break
                }
                
                checkDate.setDate(checkDate.getDate() + 1)
            }

            if (eventExists) {
                showErrorToast(t('calendar.error.eventAlreadyExists'))
                setIsModalOpen(false)
                return
            }
            
            if (exceedsMaxEvents) {
                showErrorToast(t('calendar.error.maxEventsReached', { max: 10, date: exceedingDate }))
                setIsModalOpen(false)
                return
            }

            const updatedCalendarData = { ...calendarData }
            const addDate = new Date(startDate)

            while (addDate <= endDate) {
                const currentDateKey = toISODateString(addDate)

                const dayData = updatedCalendarData[currentDateKey] || {
                    items: [],
                    outfit: null,
                    events: []
                }

                updatedCalendarData[currentDateKey] = {
                    ...dayData,
                    events: [...dayData.events, event]
                }

                addDate.setDate(addDate.getDate() + 1)
            }

            setCalendarData(updatedCalendarData)
            setShouldShowSaveToast(true)
        }

        setIsModalOpen(false)
    }

    const handleUpdateEvent = (eventId: number, updatedEvent: CalendarEvent) => {
        const updatedCalendarData = { ...calendarData }

        // Update the event in all days where it appears
        Object.keys(updatedCalendarData).forEach((dateKey) => {
            const dayData = updatedCalendarData[dateKey]

            dayData.events = dayData.events.map((ev) =>
                ev.id === eventId ? updatedEvent : ev
            )
        })

        setCalendarData(updatedCalendarData)
        setShouldShowSaveToast(true)
    }

    // Delete handlers
    const handleDeleteItem = (itemId: number) => {
        const dateKey = toISODateString(selectedDate)
        const dayData = calendarData[dateKey]

        if (dayData) {
            const updatedItems = dayData.items.filter((item) => item.id !== itemId)

            setCalendarData((prev) => ({
                ...prev,
                [dateKey]: { ...dayData, items: updatedItems }
            }))
            setShouldShowSaveToast(true)
        }
    }

    const handleDeleteOutfit = () => {
        const dateKey = toISODateString(selectedDate)
        const dayData = calendarData[dateKey]

        if (dayData) {
            setCalendarData((prev) => ({
                ...prev,
                [dateKey]: { ...dayData, outfit: null }
            }))
            setShouldShowSaveToast(true)
        }
    }

    const handleDeleteEvent = (eventId: number) => {
        const updatedCalendarData = { ...calendarData }

        Object.keys(updatedCalendarData).forEach((dateKey) => {
            const dayData = updatedCalendarData[dateKey]

            dayData.events = dayData.events.filter((ev) => ev.id !== eventId)
        })

        setCalendarData(updatedCalendarData)
        setShouldShowSaveToast(true)
    }

    // Auto-save with debounce (only after initial load and when user makes changes)
    useEffect(() => {
        if (isLoading || !hasInitialLoad || Object.keys(calendarData).length === 0) {
            return
        }

        const saveTimeout = setTimeout(async () => {
            try {
                setIsSaving(true)
                await calendarService.updateUserCalendar(calendarData)
                // Only show toast if it was triggered by user action (not auto-save)
                if (shouldShowSaveToast) {
                    showSuccessToast(t('calendar.success.save') || 'Calendar saved successfully')
                    setShouldShowSaveToast(false)
                }
            } catch (error) {
                showErrorToast(t('calendar.error.saveCalendar') || 'Failed to save calendar')
                setShouldShowSaveToast(false)
            } finally {
                setIsSaving(false)
            }
        }, 500)

        // Cleanup the timeout if component unmounts or calendarData changes again
        return () => clearTimeout(saveTimeout)
    }, [calendarData, isLoading, hasInitialLoad, shouldShowSaveToast, t])

    const handleRefreshCalendar = async () => {
        try {
            setIsRefreshing(true)
            const freshData = await calendarService.fetchUserCalendar()

            setCalendarData(freshData)
        } catch (error) {
            if (
                error instanceof Error &&
                !error.message.includes('session') &&
                !error.message.includes('Unauthorized')
            ) {
                // Error handled silently
            }
        } finally {
            setIsRefreshing(false)
        }
    }

    const selectedDayData = useMemo(() => {
        const dateKey = toISODateString(selectedDate)

        return calendarData[dateKey] || { items: [], outfit: null, events: [] }
    }, [selectedDate, calendarData])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
            }}
        >
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <Box component='main' sx={{ flex: 1, overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Loading State */}
                    {isLoading && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100vh'
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CircularProgress size={48} sx={{ mb: 2 }} />
                                <Typography variant='h6' sx={{ color: 'text.secondary' }}>
                                    {t('calendar.loading')}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Saving Indicator */}
                    {isSaving && !isLoading && (
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 16,
                                right: 16,
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1.5,
                                boxShadow: theme.shadows[8],
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                zIndex: 1300
                            }}
                        >
                            <CircularProgress size={16} />
                            <Typography variant='body2'>{t('calendar.saving')}</Typography>
                        </Box>
                    )}

                    {!isLoading && (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                py: { xs: 1.5, sm: 2 },
                                px: { xs: 1.5, sm: 2, md: 2.5 },
                                overflow: 'hidden'
                            }}
                        >
                                    {/* Page Header */}
                            <Box sx={{ mb: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 1
                                    }}
                                >
                                    <Typography
                                        variant='h5'
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                                            lineHeight: 1.2
                                        }}
                                    >
                                                {t('calendar.title')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {/* Refresh Button */}
                                        <IconButton
                                                    onClick={handleRefreshCalendar}
                                                    disabled={isRefreshing}
                                            size='small'
                                            sx={{
                                                color: 'text.primary',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                                    title={t('calendar.refreshTitle')}
                                                >
                                                    <RefreshCw
                                                size={18}
                                                style={{
                                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                                                }}
                                                    />
                                        </IconButton>
                                        {/* Temperature Display - Top Right */}
                                                {currentForecast && (
                                            <Chip
                                                icon={<Cloud size={16} />}
                                                size='small'
                                                label={
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant='caption' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                                            {Math.round(currentForecast.maxTemperature)}°C
                                                        </Typography>
                                                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block' }}>
                                                                {selectedDate.toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{
                                                    bgcolor: 'action.selected',
                                                    height: 'auto',
                                                    py: 0.5,
                                                    '& .MuiChip-icon': {
                                                        color: 'text.secondary',
                                                        marginLeft: 0.5
                                                    }
                                                }}
                                            />
                                                )}
                                    </Box>
                                </Box>
                            </Box>

                                    {/* Main Layout - Two Columns: Content Left, Calendar Right */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', lg: 'row' },
                                    gap: { xs: 1.5, sm: 2 },
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                {/* Left Column - Item, Outfit, Event Panels */}
                                <Box 
                                    sx={{ 
                                        flex: { lg: '0 0 70%' },
                                        maxWidth: { lg: '70%' },
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            pr: { lg: 2 },
                                            '&::-webkit-scrollbar': {
                                                width: '8px',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                bgcolor: 'divider',
                                                borderRadius: '4px',
                                            },
                                        }}
                                    >
                                            <DayContentGrid
                                                selectedDayData={selectedDayData}
                                                selectedDate={selectedDate}
                                                onOpenModal={() => setIsModalOpen(true)}
                                                onDeleteItem={handleDeleteItem}
                                                onDeleteOutfit={handleDeleteOutfit}
                                                onDeleteEvent={handleDeleteEvent}
                                                onUpdateEvent={handleUpdateEvent}
                                                getEventDisplayTime={getEventDisplayTime}
                                            />
                                    </Box>
                                </Box>

                                {/* Right Column - Calendar & Upcoming */}
                                <Box
                                    sx={{
                                        width: { xs: '100%', lg: 400 },
                                        flexShrink: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: { lg: 'fit-content' },
                                        maxHeight: { lg: 'calc(100vh - 140px)' },
                                        overflow: { lg: 'hidden' },
                                        minWidth: { lg: 400 }
                                    }}
                                >
                                            <CalendarWithUpcoming
                                                selectedDate={selectedDate}
                                                onDateSelect={handleDateSelect}
                                                calendarData={calendarData}
                                                onForecastUpdate={setCurrentForecast}
                                            />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Floating Action Button - Only show on mobile/tablet */}
            <Fab
                onClick={() => setIsModalOpen(true)}
                color='primary'
                size='medium'
                sx={{
                    position: 'fixed',
                    bottom: { xs: 16, sm: 24 },
                    right: { xs: 16, sm: 24 },
                    zIndex: 1300,
                    display: { xs: 'flex', lg: 'none' }
                }}
                aria-label='Add new item, outfit, or event'
            >
                <Plus size={20} />
            </Fab>

            {/* Add Data Modal */}
            {isModalOpen && (
                <AddDataModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAddData={handleAddData}
                    selectedDate={selectedDate}
                />
            )}
        </Box>
    )
}
