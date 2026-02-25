'use client'

import React, { useState, useEffect } from 'react'
import { Box, Chip, Typography, CircularProgress } from '@mui/material'
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react'
import { calendarService } from '@/services/calendar.service'
import type { DailyForecast } from '@/types/calendar.type'

const WeatherWidget: React.FC = () => {
    const [forecast, setForecast] = useState<DailyForecast | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const loadTodaysForecast = async () => {
            try {
                setIsLoading(true)
                const position = await calendarService.getUserLocation()
                const { latitude, longitude } = position.coords

                const forecastData = await calendarService.getForecastByLocation(latitude, longitude)

                if (forecastData?.dailyForecasts && forecastData.dailyForecasts.length > 0) {
                    // Get today's forecast (first item)
                    const todayForecast = forecastData.dailyForecasts[0]
                    setForecast(todayForecast)
                }
                setError(false)
            } catch (err) {
                setError(true)
                //console.error('Failed to load weather forecast:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadTodaysForecast()
    }, [])

    const getWeatherIcon = (weatherText: string | undefined): React.ReactElement => {
        if (!weatherText) return <Cloud size={16} />

        const text = weatherText.toLowerCase()
        
        if (text.includes('snow')) return <CloudSnow size={16} />
        if (text.includes('rain')) return <CloudRain size={16} />
        if (text.includes('clear') || text.includes('sunny')) return <Sun size={16} />
        if (text.includes('cloud')) return <Cloud size={16} />
        if (text.includes('wind')) return <Wind size={16} />
        
        return <Cloud size={16} />
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
                <CircularProgress size={20} />
            </Box>
        )
    }

    if (error || !forecast) {
        return null
    }

    const maxTemp = Math.round(forecast.maxTemperature || 0)
    const weatherText = forecast.weatherText || ''

    return (
        <Chip
            icon={getWeatherIcon(weatherText)}
            label={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, textAlign: 'center' }}>
                    <Typography variant='caption' sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1 }}>
                        {maxTemp}°C
                    </Typography>
                    <Typography 
                        variant='caption' 
                        sx={{ 
                            fontSize: '0.65rem', 
                            color: 'inherit',
                            opacity: 0.8,
                            lineHeight: 1,
                            maxWidth: 60,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={weatherText}
                    >
                        {weatherText}
                    </Typography>
                </Box>
            }
            size='small'
            variant='outlined'
            sx={{
                height: 'auto',
                py: 0.5,
                px: 1,
                bgcolor: 'action.selected',
                borderColor: 'divider',
                '& .MuiChip-icon': {
                    color: 'text.secondary',
                    marginLeft: 0.5,
                    marginRight: -0.5
                },
                '& .MuiChip-label': {
                    px: 1
                },
                '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                },
                transition: 'all 0.2s ease'
            }}
        />
    )
}

export default WeatherWidget
