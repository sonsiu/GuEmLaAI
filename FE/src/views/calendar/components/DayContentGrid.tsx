'use client'

import React from 'react'
import Box from '@mui/material/Box'
import { DayData, Event as CalendarEvent } from '@/types/calendar.type'
import ItemOutfitPanel from './ItemOutfitPanel'
import EventsPanel from './EventsPanel'
import EmptyDayPanel from './EmptyDayPanel'

interface DayContentGridProps {
    selectedDayData: DayData
    selectedDate: Date
    onOpenModal?: () => void
    onDeleteItem?: (itemId: number) => void
    onDeleteOutfit?: () => void
    onDeleteEvent?: (eventId: number) => void
    onUpdateEvent?: (eventId: number, updatedEvent: CalendarEvent) => void
    getEventDisplayTime?: (event: CalendarEvent, dateStr: string) => string
}

const DayContentGrid: React.FC<DayContentGridProps> = ({
    selectedDayData,
    selectedDate,
    onOpenModal,
    onDeleteItem,
    onDeleteOutfit,
    onDeleteEvent,
    onUpdateEvent,
    getEventDisplayTime,
}) => {
    const isEmpty =
        selectedDayData.items.length === 0 &&
        !selectedDayData.outfit &&
        selectedDayData.events.length === 0

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
            }}
        >
            {isEmpty ? (
                <EmptyDayPanel onAddData={onOpenModal} />
            ) : (
                <>
                    {/* Combined Items & Outfit Panel */}
                    {(selectedDayData.items.length > 0 || selectedDayData.outfit) && (
                        <ItemOutfitPanel
                            items={selectedDayData.items}
                            outfit={selectedDayData.outfit}
                            onDeleteItem={onDeleteItem}
                            onDeleteOutfit={onDeleteOutfit}
                            onAddItemOrOutfit={onOpenModal}
                        />
                    )}

                    {/* Events Panel - Only show if events exist */}
                    {selectedDayData.events.length > 0 && (
                        <EventsPanel
                            events={selectedDayData.events}
                            currentDate={selectedDate}
                            onGetDisplayTime={getEventDisplayTime}
                            onUpdateEvent={onUpdateEvent}
                            onDeleteEvent={onDeleteEvent}
                            onAddEvent={onOpenModal}
                        />
                    )}
                </>
            )}
        </Box>
    )
}

export default DayContentGrid
