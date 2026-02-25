'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { useTheme } from '@mui/material/styles'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarData, DailyForecast, UpcomingEvent, ForecastResponse } from '@/types/calendar.type'
import { calendarService } from '@/services/calendar.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface CalendarWithUpcomingProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    calendarData: CalendarData
    onForecastUpdate?: (forecast: DailyForecast | undefined) => void
}

type UpcomingFilter = 'item' | 'outfit' | 'event'

const CalendarWithUpcoming: React.FC<CalendarWithUpcomingProps> = ({
    selectedDate,
    onDateSelect,
    calendarData,
    onForecastUpdate,
}) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const [displayDate, setDisplayDate] = useState(selectedDate)
    const [forecast, setForecast] = useState<ForecastResponse | null>(null)
    const [isLoadingForecast, setIsLoadingForecast] = useState(false)
    const [activeFilters, setActiveFilters] = useState<Record<UpcomingFilter, boolean>>({
        item: true,
        outfit: true,
        event: true,
    })

    // Sync displayDate with selectedDate when selectedDate changes
    useEffect(() => {
        setDisplayDate(selectedDate)
        // Update forecast for selected date
        if (onForecastUpdate && forecast) {
            const selectedForecast = getForecastForDate(selectedDate)
            onForecastUpdate(selectedForecast)
        }
    }, [selectedDate, onForecastUpdate, forecast])

    // Load forecast data on component mount
    useEffect(() => {
        const loadForecast = async () => {
            try {
                setIsLoadingForecast(true)
                const position = await calendarService.getUserLocation()
                const { latitude, longitude } = position.coords

                const forecastData = await calendarService.getForecastByLocation(latitude, longitude)

                setForecast(forecastData)
            } catch (error) {
                // Error handled silently
            } finally {
                setIsLoadingForecast(false)
            }
        }

        loadForecast()
    }, [])

    // Get all days in the current month organized by weeks (rows)
    const calendarWeeks = useMemo(() => {
        const year = displayDate.getFullYear()
        const month = displayDate.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const dates: (Date | null)[] = []

        // Add days from previous month
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i)
            dates.push(date)
        }

        // Add days from current month
        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(new Date(year, month, i))
        }

        // Add days from next month to complete 6 weeks (42 days)
        const remainingDays = 42 - dates.length
        for (let i = 1; i <= remainingDays; i++) {
            dates.push(new Date(year, month + 1, i))
        }

        // Group into weeks (7 days per row)
        const weeks: (Date | null)[][] = []
        for (let i = 0; i < dates.length; i += 7) {
            weeks.push(dates.slice(i, i + 7))
        }

        return weeks
    }, [displayDate])

    // Get upcoming events
    const upcomingEvents = useMemo(() => {
        const events: UpcomingEvent[] = []
        const today = new Date(selectedDate)
        today.setHours(0, 0, 0, 0)

        for (let i = 1; i <= 7; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)

            const year = date.getFullYear()
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const day = date.getDate().toString().padStart(2, '0')
            const dateKey = `${year}-${month}-${day}`

            const dayData = calendarData[dateKey]

            if (dayData) {
                if (dayData.items.length > 0) {
                    events.push({ date, content: 'New item added', type: 'item' })
                }
                if (dayData.outfit) {
                    events.push({ date, content: 'Outfit planned', type: 'outfit' })
                }
                dayData.events.forEach((event) => {
                    events.push({
                        date,
                        content: `${event.name}`,
                        type: 'event',
                    })
                })
            }
        }

        const filteredEvents = events.filter((event) => activeFilters[event.type])
        return filteredEvents.slice(0, 5)
    }, [calendarData, selectedDate, activeFilters])

    const changeMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(displayDate)
        newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1))
        setDisplayDate(newDate)
    }

    const handleDaySelection = (date: Date) => {
        onDateSelect(date)
        setDisplayDate(date)
    }

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()

    const isToday = (date: Date) => {
        const today = new Date()
        return isSameDay(date, today)
    }

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === displayDate.getMonth()
    }

    const formatDateForComparison = (date: Date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getForecastForDate = (date: Date): DailyForecast | undefined => {
        if (!forecast) {
            return undefined
        }
        const dateStr = formatDateForComparison(date)

        const matchedForecast = forecast.dailyForecasts?.find((f: DailyForecast) => {
            const forecastDate = f.date.split('T')[0]
            return forecastDate === dateStr
        })

        return matchedForecast
    }

    const toggleFilter = (filter: UpcomingFilter) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filter]: !prev[filter],
        }))
    }

    const hasContentOnDate = (date: Date): boolean => {
        const dateStr = formatDateForComparison(date)
        const dayData = calendarData[dateStr]

        if (!dayData) return false

        return (
            dayData.items.length > 0 ||
            dayData.outfit !== null ||
            dayData.events.length > 0
        )
    }

    const getContentIndicators = (date: Date): { hasItems: boolean; hasOutfit: boolean; hasEvents: boolean } => {
        const dateStr = formatDateForComparison(date)
        const dayData = calendarData[dateStr]

        if (!dayData) return { hasItems: false, hasOutfit: false, hasEvents: false }

        return {
            hasItems: dayData.items.length > 0,
            hasOutfit: dayData.outfit !== null,
            hasEvents: dayData.events.length > 0,
        }
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthYear = displayDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    })

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                gap: 0,
                p: 1,
                bgcolor: 'action.selected',
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                width: '100%',
            }}
        >
            {/* Calendar Section - Top */}
            <Box sx={{ flexShrink: 0, minWidth: 0, display: 'flex', flexDirection: 'column', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <IconButton
                        onClick={() => changeMonth('prev')}
                        size='small'
                        sx={{
                            color: 'text.primary',
                            p: 0.5,
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                        title='Previous month'
                    >
                        <ChevronLeft size={16} />
                    </IconButton>

                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            flex: 1,
                            fontSize: '0.8125rem',
                            lineHeight: 1.2,
                        }}
                    >
                        {monthYear}
                    </Typography>

                    <IconButton
                        onClick={() => changeMonth('next')}
                        size='small'
                        sx={{
                            color: 'text.primary',
                            p: 0.5,
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                        title='Next month'
                    >
                        <ChevronRight size={16} />
                    </IconButton>
                </Box>

                {/* Calendar Table */}
                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        overflow: 'hidden',
                        width: '100%',
                    }}
                >
                    <Table
                        sx={{
                            width: '100%',
                            tableLayout: 'fixed',
                            borderCollapse: 'collapse',
                            '& .MuiTableCell-root': {
                                border: 1,
                                borderColor: 'divider',
                                p: 0.5,
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                position: 'relative',
                                width: '14.28%', // 100% / 7 columns
                            },
                        }}
                    >
                    {/* Weekday Headers */}
                        <TableHead
                            sx={{
                                bgcolor: 'action.selected',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <TableRow>
                        {weekDays.map((day) => (
                                    <TableCell
                                key={day}
                                        sx={{
                                            py: 0.75,
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            color: 'text.primary',
                                            textAlign: 'center',
                                            verticalAlign: 'middle',
                                        }}
                            >
                                {day}
                                    </TableCell>
                        ))}
                            </TableRow>
                        </TableHead>

                        {/* Calendar Days */}
                        <TableBody>
                            {calendarWeeks.map((week, weekIndex) => (
                                <TableRow key={weekIndex}>
                                    {week.map((date, dayIndex) => {
                                        if (!date)
                                            return (
                                            <TableCell
                                                key={dayIndex}
                                                sx={{
                                                    height: 48,
                                                    p: 0.5,
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle',
                                                    bgcolor: 'background.paper',
                                                }}
                                            />
                                            )

                                        const isSelected = isSameDay(date, selectedDate)
                                        const isTodayDate = isToday(date)
                                        const isNotCurrentMonth = !isCurrentMonth(date)
                                        const contentIndicators = getContentIndicators(date)
                                        const hasContent = hasContentOnDate(date)

                            return (
                                            <TableCell
                                                key={`${weekIndex}-${dayIndex}`}
                                                sx={{
                                                    height: 48,
                                                    p: 0.5,
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle',
                                                    position: 'relative',
                                                    ...(isSelected
                                                        ? {
                                                              bgcolor: 'primary.main',
                                                              color: 'primary.contrastText',
                                                              borderColor: 'primary.main',
                                                              borderWidth: 2,
                                                              boxShadow: theme.shadows[4],
                                                          }
                                                        : isTodayDate
                                                          ? {
                                                                bgcolor: 'primary.lightOpacity',
                                                                color: 'text.primary',
                                                                borderColor: 'primary.main',
                                                                borderWidth: 2,
                                                                borderStyle: 'dashed',
                                                                boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}20`,
                                                            }
                                                          : isNotCurrentMonth
                                                            ? {
                                                                  bgcolor: 'action.selected',
                                                                  color: 'text.disabled',
                                                                  opacity: 0.75,
                                                              }
                                                            : {
                                                                  bgcolor: 'background.paper',
                                                                  color: 'text.primary',
                                                              }),
                                                }}
                                            >
                                                <Button
                                                    onClick={() => handleDaySelection(date)}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        minHeight: 0,
                                                        maxWidth: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 0.5,
                                                        borderRadius: 0,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'none',
                                                        p: 0.5,
                                                        m: 0,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        boxSizing: 'border-box',
                                                        border: 'none',
                                                        position: 'relative',
                                                        '&::before, &::after': {
                                                            display: 'none',
                                                        },
                                                        ...(isSelected
                                                            ? {
                                                                  bgcolor: 'transparent',
                                                                  color: 'primary.contrastText',
                                                                  '&:hover': {
                                                                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                                  },
                                                              }
                                            : isTodayDate
                                                              ? {
                                                                    bgcolor: 'transparent',
                                                                    color: 'text.primary',
                                                                    '&:hover': {
                                                                        bgcolor: 'action.hover',
                                                                    },
                                                                }
                                                : isNotCurrentMonth
                                                                ? {
                                                                      bgcolor: 'transparent',
                                                                      color: 'text.disabled',
                                                                      '&:hover': {
                                                                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                                                                      },
                                                                  }
                                                                : {
                                                                      bgcolor: 'transparent',
                                                                      color: 'text.primary',
                                                                      '&:hover': {
                                                                          bgcolor: 'action.hover',
                                                                      },
                                                                  }),
                                                    }}
                                                    aria-current={isSelected ? 'date' : undefined}
                                                    title={date.toDateString()}
                                >
                                    {/* Date number */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '100%',
                                                            flex: '0 0 auto',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant='body2'
                                                            sx={{
                                                                fontWeight: 700,
                                                                lineHeight: 1,
                                                                fontSize: '0.8125rem',
                                                                textAlign: 'center',
                                                                margin: 0,
                                                                padding: 0,
                                                                width: '100%',
                                                                color: isSelected ? 'primary.contrastText' : 'inherit',
                                                            }}
                                                        >
                                        {date.getDate()}
                                                        </Typography>
                                                    </Box>

                                    {/* Content Indicator Dots */}
                                    {hasContent && (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                gap: 0.25,
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                flex: '0 0 auto',
                                                                margin: 0,
                                                                padding: 0,
                                                            }}
                                                        >
                                            {contentIndicators.hasItems && (
                                                                <Box
                                                                    sx={{
                                                                        width: 5,
                                                                        height: 5,
                                                                        borderRadius: '50%',
                                                                        bgcolor: isSelected
                                                                            ? 'primary.contrastText'
                                                                            : isTodayDate
                                                                              ? 'info.main'
                                                                              : isNotCurrentMonth
                                                                                ? 'info.light'
                                                                                : 'info.main',
                                                                        opacity: isSelected ? 0.9 : isNotCurrentMonth ? 0.6 : 1,
                                                                    }}
                                                                    title='Has items'
                                                />
                                            )}
                                            {contentIndicators.hasOutfit && (
                                                                <Box
                                                                    sx={{
                                                                        width: 5,
                                                                        height: 5,
                                                                        borderRadius: '50%',
                                                                        bgcolor: isSelected
                                                                            ? 'primary.contrastText'
                                                                            : isTodayDate
                                                                              ? 'info.light'
                                                                              : isNotCurrentMonth
                                                                                ? 'secondary.light'
                                                                                : 'secondary.main',
                                                                        opacity: isSelected ? 0.9 : isNotCurrentMonth ? 0.6 : 1,
                                                                    }}
                                                                    title='Has outfit'
                                                />
                                            )}
                                            {contentIndicators.hasEvents && (
                                                                <Box
                                                                    sx={{
                                                                        width: 5,
                                                                        height: 5,
                                                                        borderRadius: '50%',
                                                                        bgcolor: isSelected
                                                                            ? 'primary.contrastText'
                                                                            : isTodayDate
                                                                              ? 'success.main'
                                                                              : isNotCurrentMonth
                                                                                ? 'success.light'
                                                                                : 'success.main',
                                                                        opacity: isSelected ? 0.9 : isNotCurrentMonth ? 0.6 : 1,
                                                                    }}
                                                                    title='Has events'
                                                />
                                            )}
                                                        </Box>
                                    )}
                                                </Button>
                                            </TableCell>
                                        )
                        })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </Box>

            {/* Upcoming Section - Bottom */}
            <Card
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                    mt: { xs: 1.5, sm: 2 },
                    flex: { xs: 'none', lg: '0 0 auto' },
                    minHeight: { xs: 180, sm: 200 },
                    maxHeight: { lg: 'none' },
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: { xs: 1.5, sm: 2 },
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant='subtitle1' sx={{ fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Upcoming
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {(['item', 'outfit', 'event'] as UpcomingFilter[]).map((filter) => (
                            <Chip
                                key={filter}
                                onClick={() => toggleFilter(filter)}
                                label={filter[0].toUpperCase()}
                                size='small'
                                sx={{
                                    textTransform: 'capitalize',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    ...(activeFilters[filter]
                                        ? {
                                              bgcolor: 'primary.main',
                                              color: 'primary.contrastText',
                                          }
                                        : {
                                              bgcolor: 'action.selected',
                                              color: 'text.secondary',
                                              '&:hover': {
                                                  bgcolor: 'action.hover',
                                              },
                                          }),
                                }}
                                aria-pressed={activeFilters[filter]}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Upcoming Events List */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: { xs: 1, sm: 1.5 },
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: 'divider',
                            borderRadius: '3px',
                        },
                    }}
                >
                    {upcomingEvents.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.25 } }}>
                            {upcomingEvents.map((item, index) => (
                                <Button
                                    key={`upcoming-${item.date.getTime()}-${index}-${item.content}`}
                                    onClick={() => onDateSelect(item.date)}
                                    sx={{
                                        width: '100%',
                                        textAlign: 'left',
                                        p: { xs: 1, sm: 1.25 },
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        bgcolor: 'background.paper',
                                        textTransform: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: 1, sm: 1.25 },
                                        '&:hover': {
                                            bgcolor: 'primary.lightOpacity',
                                            borderColor: 'primary.main',
                                            boxShadow: theme.shadows[2],
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flexShrink: 0,
                                            width: { xs: 28, sm: 32 },
                                            height: { xs: 28, sm: 32 },
                                            borderRadius: '50%',
                                            bgcolor: 'primary.lightOpacity',
                                            color: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                            fontWeight: 700,
                                            border: 1,
                                            borderColor: 'primary.main',
                                        }}
                                    >
                                        {item.date.getDate()}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant='body2'
                                            sx={{
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                            }}
                                        >
                                            {item.content}
                                        </Typography>
                                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                            {item.date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={item.type}
                                        size='small'
                                        sx={{
                                            flexShrink: 0,
                                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            height: { xs: 20, sm: 24 },
                                            ...(item.type === 'item'
                                                ? {
                                                      bgcolor: 'info.light',
                                                      color: 'info.dark',
                                                  }
                                                : item.type === 'outfit'
                                                  ? {
                                                        bgcolor: 'secondary.light',
                                                        color: 'secondary.dark',
                                                    }
                                                  : {
                                                        bgcolor: 'success.light',
                                                        color: 'success.dark',
                                                    }),
                                        }}
                                    />
                                </Button>
                            ))}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                textAlign: 'center',
                                color: 'text.disabled',
                            }}
                        >
                            <Typography variant='body2' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>No upcoming events</Typography>
                        </Box>
                    )}
                </Box>
            </Card>
        </Card>
    )
}

export default CalendarWithUpcoming
