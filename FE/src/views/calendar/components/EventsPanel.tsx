'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useTheme } from '@mui/material/styles'
import { Trash2, Plus, Clock, Edit2, Check, X } from 'lucide-react'
import type { Event as CalendarEvent } from '@/types/calendar.type'
import EventGarmentCarousel from './EventGarmentCarousel'
import SelectGarmentModal from './SelectGarmentModal'
import { showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface EventsPanelProps {
    events: CalendarEvent[]
    currentDate: Date
    onGetDisplayTime?: (event: CalendarEvent, dateStr: string) => string
    onUpdateEvent?: (eventId: number, updatedEvent: CalendarEvent) => void
    onDeleteEvent?: (eventId: number) => void
    onAddEvent?: () => void
}

const getGarmentsForDate = (event: CalendarEvent, dateKey: string) => {
    if (!event.associatedGarments) {
        return { key: dateKey, garments: [] as NonNullable<CalendarEvent['associatedGarments']>[string] }
    }

    if (event.associatedGarments[dateKey]) {
        return { key: dateKey, garments: event.associatedGarments[dateKey] }
    }

    const fallbackKey = Object.keys(event.associatedGarments).find((key) => key.startsWith(dateKey))

    if (fallbackKey) {
        return { key: fallbackKey, garments: event.associatedGarments[fallbackKey] }
    }

    const firstNonEmptyEntry = Object.entries(event.associatedGarments).find(([, garments]) => garments?.length)

    if (firstNonEmptyEntry) {
        return { key: firstNonEmptyEntry[0], garments: firstNonEmptyEntry[1] || [] }
    }

    return { key: dateKey, garments: [] }
}

const EventsPanel: React.FC<EventsPanelProps> = ({
    events,
    currentDate,
    onGetDisplayTime,
    onUpdateEvent,
    onDeleteEvent,
    onAddEvent,
}) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
    const [editingEventId, setEditingEventId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null)

    const handleAddGarmentClick = (eventId: number) => {
        setSelectedEventId(eventId)
        setIsSelectModalOpen(true)
    }

    const handleGarmentSelect = (
        type: 'item' | 'outfit',
        id: number,
        imageUrl: string,
        imageFilename?: string,
        name?: string,
        categoryName?: string
    ) => {
        if (selectedEventId === null || !onUpdateEvent) return

        const eventToUpdate = events.find((e) => e.id === selectedEventId)

        if (!eventToUpdate) {
            return
        }

        const dateKey = currentDate.toISOString().split('T')[0]
        const { key: resolvedKey, garments: currentGarments } = getGarmentsForDate(eventToUpdate, dateKey)

        // Check if garment already exists in this event
        const isDuplicate = currentGarments.some(
            garment => garment.id === id && garment.type === type
        )

        if (isDuplicate) {
            showErrorToast(t('calendar.error.garmentAlreadyInEvent'))
            setIsSelectModalOpen(false)
            setSelectedEventId(null)
            return
        }

        // Create new garment object
        const newGarment = {
            type,
            id,
            imageUrl,
            imageFilename,
            name,
            categoryName,
        }


        // Update event
        const updatedEvent = {
            ...eventToUpdate,
            associatedGarments: {
                ...eventToUpdate.associatedGarments,
                [resolvedKey]: [...currentGarments, newGarment],
            },
        }

        onUpdateEvent(selectedEventId, updatedEvent)
        setIsSelectModalOpen(false)
        setSelectedEventId(null)
    }

    const handleRemoveGarment = (eventId: number, garmentIndex: number) => {
        if (!onUpdateEvent) return

        const eventToUpdate = events.find((e) => e.id === eventId)

        if (!eventToUpdate) {
            return
        }

        const dateKey = currentDate.toISOString().split('T')[0]
        const { key: resolvedKey, garments: currentGarments } = getGarmentsForDate(eventToUpdate, dateKey)

        const updatedGarments = [...currentGarments]
        updatedGarments.splice(garmentIndex, 1)

        const updatedEvent = {
            ...eventToUpdate,
            associatedGarments: {
                ...eventToUpdate.associatedGarments,
                [resolvedKey]: updatedGarments,
            },
        }

        onUpdateEvent(eventId, updatedEvent)
    }

    const startEditing = (event: CalendarEvent) => {
        setEditingEventId(event.id)
        setEditName(event.name)
    }

    const saveEdit = (eventId: number) => {
        if (!onUpdateEvent) return

        const eventToUpdate = events.find((e) => e.id === eventId)

        if (!eventToUpdate) {
            return
        }

        if (!editName.trim()) {
            showErrorToast(t('calendar.error.eventNameEmpty'))
            return
        }

        onUpdateEvent(eventId, { ...eventToUpdate, name: editName })
        setEditingEventId(null)
    }

    const cancelEdit = () => {
        setEditingEventId(null)
        setEditName('')
    }

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
            {/* Header with Add Event Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {t('calendar.panel.events')}
                </Typography>
                {onAddEvent && (
                    <Button
                        variant='contained'
                        size='small'
                        onClick={onAddEvent}
                        startIcon={<Plus size={14} />}
                        title='Add new event'
                    >
                        {t('calendar.panel.addEvent')}
                    </Button>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                {events.map((event, index) => {
                    const dateKey = currentDate.toISOString().split('T')[0]
                    const { key: resolvedKey, garments } = getGarmentsForDate(event, dateKey)
                    const displayTime = onGetDisplayTime ? onGetDisplayTime(event, dateKey) : event.time
                    return (
                        <Card
                            key={`event-${event.id}-${index}-${dateKey}`}
                            sx={{
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                boxShadow: theme.shadows[1],
                            }}
                        >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: { xs: 1, sm: 2 } }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                            <Clock size={12} style={{ color: theme.palette.primary.main }} />
                                            <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                {displayTime}
                                            </Typography>
                                        </Box>

                                        {editingEventId === event.id ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                <TextField
                                                    size='small'
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    sx={{ flex: 1, maxWidth: 300 }}
                                                    autoFocus
                                                />
                                                <IconButton
                                                    onClick={() => saveEdit(event.id)}
                                                    color='success'
                                                    size='small'
                                                >
                                                    <Check size={14} />
                                                </IconButton>
                                                <IconButton onClick={cancelEdit} size='small'>
                                                    <X size={14} />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    '&:hover .edit-button': {
                                                        opacity: 1,
                                                    },
                                                }}
                                            >
                                                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                                                    {event.name}
                                                </Typography>
                                                <IconButton
                                                    className='edit-button'
                                                    onClick={() => startEditing(event)}
                                                    size='small'
                                                    sx={{
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        color: 'text.secondary',
                                                        '&:hover': {
                                                            color: 'primary.main',
                                                        },
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Delete Button */}
                                    {onDeleteEvent && (
                                        <IconButton
                                            onClick={() => setDeleteConfirmationId(event.id)}
                                            sx={{
                                                color: 'text.secondary',
                                                '&:hover': {
                                                    color: 'error.main',
                                                },
                                            }}
                                            size='small'
                                            title='Delete event'
                                        >
                                            <Trash2 size={18} />
                                        </IconButton>
                                    )}
                                </Box>

                                {/* Garments Carousel */}
                                {garments.length > 0 ? (
                                    <EventGarmentCarousel
                                        garments={garments}
                                        eventId={event.id}
                                        onRemoveGarment={handleRemoveGarment}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 2,
                                            borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('calendar.error.noAssociatedItems')}
                    </Typography>
                </Box>
                                )}


                                {/* Add Garment Button */}
                                <Button
                                    onClick={() => handleAddGarmentClick(event.id)}
                                    variant='outlined'
                                    startIcon={<Plus size={16} />}
                                    sx={{
                                        mt: 1.5,
                                        width: '100%',
                                        borderStyle: 'dashed',
                                        borderColor: 'primary.main',
                                        color: 'primary.main',
                                        bgcolor: 'primary.lightOpacity',
                                        '&:hover': {
                                            bgcolor: 'primary.lightOpacity',
                                            borderColor: 'primary.dark',
                                        },
                                    }}
                                >
                                    {t('calendar.event.addGarment')}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </Box>

            {/* Select Garment Modal */}
            <SelectGarmentModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                onSelect={handleGarmentSelect}
            />

            {/* Delete Confirmation Dialog */}

            <Dialog
                open={deleteConfirmationId !== null}
                onClose={() => setDeleteConfirmationId(null)}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>
                    {t('calendar.event.deleteTitle')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        {t('calendar.event.deleteConfirm')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmationId(null)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            if (onDeleteEvent && deleteConfirmationId !== null) {
                                onDeleteEvent(deleteConfirmationId)
                            }

                            setDeleteConfirmationId(null)
                        }}
                        color='error'
                        variant='contained'
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    )
}

export default EventsPanel
