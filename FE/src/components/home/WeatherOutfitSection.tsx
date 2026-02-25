'use client'

import React, { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { ClientApi } from '@/services/client-api.service'
import OutfitPreviewModal from './OutfitPreviewModal'
import { useAuth } from '@/@core/contexts/AuthContext'

// Cache key and expiration time (1 hour)
const CACHE_KEY = 'weatherOutfitSuggestions'
const CACHE_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

interface WeatherContext {
  locationName: string
  temperature: number
  temperatureUnit: string
  weatherText: string
  seasonRecommendation: string
  hasPrecipitation: boolean
  precipitationType?: string | null
}

interface SuggestedOutfit {
  id: number
  name?: string
  imagePreviewUrl: string
  isFavorite: boolean
  matchReason: string
  seasons: string[]
  comment?: string
}


interface OutfitSuggestionResponse {
  weatherContext: WeatherContext
  suggestedOutfits: SuggestedOutfit[]
  recommendationReason: string
}

interface CachedSuggestions {
  data: OutfitSuggestionResponse
  timestamp: number
  userId: string
}

const WeatherOutfitSection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<OutfitSuggestionResponse | null>(null)
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState<SuggestedOutfit | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Get user from context
  const { user } = useAuth()

  // Load cached suggestions on mount
  useEffect(() => {
    if (!user?.id) return

    const cachedData = localStorage.getItem(CACHE_KEY)

    if (cachedData) {
      try {
        const cached: CachedSuggestions = JSON.parse(cachedData)
        const now = Date.now()

        // Check if cache is still valid and belongs to current user
        if (cached.userId === String(user.id) && now - cached.timestamp < CACHE_EXPIRY_MS) {
          setSuggestions(cached.data)
        } else {
          localStorage.removeItem(CACHE_KEY)
        }
      } catch {
        localStorage.removeItem(CACHE_KEY)
      }
    }
  }, [user])

  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable location access.'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'))
              break
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'))
              break
            default:
              reject(new Error('An unknown error occurred.'))
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const handleGetSuggestions = async () => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken || !user?.id) {
      setError('Please log in to get outfit suggestions')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await getUserLocation()

      const { latitude, longitude } = position.coords

      ;(await ClientApi.get<OutfitSuggestionResponse>(
        `/Weather/suggest-outfits?latitude=${latitude}&longitude=${longitude}`
      )).onSuccess(data => {
        setSuggestions(data)


        // Cache the suggestions
        const cacheData: CachedSuggestions = {
          data,
          timestamp: Date.now(),
          userId: String(user.id)
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      }).onError(err => {
        setError(err.message || 'Failed to get suggestions')
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get suggestions'

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSuggestions(null)
    setError(null)

    // Clear cache when user resets
    localStorage.removeItem(CACHE_KEY)
  }

  const handleOutfitClick = (outfit: SuggestedOutfit) => {
    setSelectedOutfitId(outfit.id)
    setSelectedOutfit(outfit)
    setShowPreviewModal(true)
  }

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false)
    setSelectedOutfitId(null)
    setSelectedOutfit(null)
  }

  const getWeatherIcon = (weatherText: string, hasPrecipitation: boolean) => {
    if (hasPrecipitation) {
      if (weatherText.toLowerCase().includes('snow')) {
        return (
          <i className='tabler-snowflake text-3xl' style={{ fontSize: '2rem' }}></i>
        )
      }

      return (
        <i className='tabler-cloud-rain text-3xl' style={{ fontSize: '2rem' }}></i>
      )
    }

    if (weatherText.toLowerCase().includes('sun') || weatherText.toLowerCase().includes('clear')) {
      return <i className='tabler-sun text-3xl' style={{ fontSize: '2rem' }}></i>
    }

    return <i className='tabler-cloud text-3xl' style={{ fontSize: '2rem' }}></i>
  }

  // Show suggestions view (replaces the banner)
  if (suggestions) {
    return (
      <section className='w-full border-b border-primary py-12 sm:py-16 lg:py-20'>
        <div className='w-full px-4 sm:px-6 lg:px-8'>
          {/* Header with Weather Info */}
          <div className='flex items-center justify-between mb-8 flex-wrap gap-4'>
            <div className='flex items-center gap-4'>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg'
                style={{
                  background:
                    'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))'
                }}
              >
                {getWeatherIcon(suggestions.weatherContext.weatherText, suggestions.weatherContext.hasPrecipitation)}
              </div>
              <div>
                <h2 className='text-2xl sm:text-3xl font-bold text-primary'>
                  Your Outfit Suggestions
                </h2>
                <div className='flex items-center gap-2 text-sm flex-wrap' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  <i className='tabler-map-pin text-base'></i>
                  <span>{suggestions.weatherContext.locationName}</span>
                  <span>•</span>
                  <span className='font-semibold text-primary'>
                    {suggestions.weatherContext.temperature}°
                    {suggestions.weatherContext.temperatureUnit}
                  </span>
                  <span>•</span>
                  <span>{suggestions.weatherContext.weatherText}</span>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button variant='outlined' onClick={handleReset} startIcon={<i className='tabler-refresh'></i>}>
              <span className='hidden sm:inline'>Try Another Location</span>
              <span className='sm:hidden'>Reset</span>
            </Button>
          </div>

          {/* Weather Recommendation Card */}
          <Card
            sx={{
              mb: 4,
              background:
                'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-info-lighterOpacity))',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'visible',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                padding: '1px',
                background:
                  'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0.1
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background:
                      'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <i className='tabler-cloud text-white' style={{ fontSize: '2rem' }}></i>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant='h6' fontWeight={700} color='text.primary'>
                    Weather Recommendation
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
                    {suggestions.recommendationReason}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={suggestions.weatherContext.seasonRecommendation}
                      size='small'
                      sx={{
                        backgroundColor: 'var(--mui-palette-primary-lighterOpacity)',
                        color: 'var(--mui-palette-primary-main)',
                        border: '1px solid',
                        borderColor: 'var(--mui-palette-primary-lightOpacity)',
                        fontWeight: 600
                      }}
                    />
                    {suggestions.weatherContext.hasPrecipitation && (
                      <Chip
                        label={`${suggestions.weatherContext.precipitationType} expected`}
                        size='small'
                        sx={{
                          backgroundColor: 'var(--mui-palette-info-lighterOpacity)',
                          color: 'var(--mui-palette-info-main)',
                          border: '1px solid',
                          borderColor: 'var(--mui-palette-info-lightOpacity)',
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Suggested Outfits Grid */}
          <div>
            <div className='flex items-center gap-3 mb-6'>
              <i className='tabler-sparkles text-primary text-xl'></i>
              <h3 className='font-bold text-xl text-primary'>
                Recommended Outfits
              </h3>
              <span
                className='px-3 py-1 rounded-full text-sm font-medium'
                style={{
                  backgroundColor: 'var(--mui-palette-primary-lighterOpacity)',
                  color: 'var(--mui-palette-primary-main)'
                }}
              >
                {suggestions.suggestedOutfits.length}
              </span>
            </div>

            {suggestions.suggestedOutfits.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)'
                  },
                  gap: 3
                }}
              >
                {suggestions.suggestedOutfits.map(outfit => (
                  <Card
                    key={outfit.id}
                    onClick={() => handleOutfitClick(outfit)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                        borderColor: 'primary.main',
                        '& .outfit-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    {/* Outfit Image */}
                    <Box sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', bgcolor: 'action.hover' }}>
                      <CardMedia
                        component='img'
                        image={outfit.imagePreviewUrl}
                        alt={outfit.name || 'Outfit'}
                        className='outfit-image'
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      {outfit.isFavorite && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: 'error.main',
                            borderRadius: '50%',
                            p: 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className='tabler-heart-filled text-white' style={{ fontSize: '1.25rem' }}></i>
                        </Box>
                      )}
                      {/* Gradient Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '40%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
                          pointerEvents: 'none'
                        }}
                      />
                    </Box>

                    {/* Outfit Info */}
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                      <Typography variant='h6' fontWeight={700} color='text.primary' noWrap>
                        {outfit.name || 'Untitled Outfit'}
                      </Typography>

                      {/* Match Reason */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <i className='tabler-sparkles' style={{ color: 'var(--mui-palette-primary-main)', fontSize: '1rem', marginTop: '2px', flexShrink: 0 }}></i>
                        <Typography variant='body2' color='primary.main' fontWeight={600}>
                          {outfit.matchReason}
                        </Typography>
                      </Box>

                      {/* Seasons */}
                      {outfit.seasons.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {outfit.seasons.map(season => (
                            <Chip
                              key={season}
                              label={season}
                              size='small'
                              sx={{
                                bgcolor: 'action.hover',
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Comment */}
                      {outfit.comment && (
                        <Typography
                          variant='caption'
                          color='text.disabled'
                          sx={{
                            fontStyle: 'italic',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5
                          }}
                        >
                          "{outfit.comment}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Card
                sx={{
                  textAlign: 'center',
                  py: 8,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3
                }}
              >
                <CardContent>
                  <i className='tabler-cloud' style={{ fontSize: '4rem', color: 'var(--mui-palette-action-disabled)', marginBottom: '1rem', display: 'block' }}></i>
                  <Typography variant='h6' fontWeight={600} color='text.secondary' gutterBottom>
                    No outfits found for current weather
                  </Typography>
                  <Typography variant='body2' color='text.disabled' sx={{ mb: 3 }}>
                    Try adding outfits with season tags to your wardrobe!
                  </Typography>
                  <Button variant='contained' color='primary' size='small'>
                    Go to Wardrobe
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Outfit Preview Modal */}
          <OutfitPreviewModal
            open={showPreviewModal}
            onClose={handleClosePreviewModal}
            outfitId={selectedOutfitId}
            basicOutfitInfo={selectedOutfit || undefined}
            weatherContext={suggestions?.weatherContext}
          />
        </div>
      </section>
    )
  }

  // Initial banner view (before suggestions are loaded)
  return (
    <section className='w-full border-b border-primary py-12 sm:py-16 lg:py-20'>
      <div className='w-full px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-4'>
            <span
              className='bg-clip-text text-transparent'
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-info-main), var(--mui-palette-primary-main))'
              }}
            >
              Weather-Based
            </span>{' '}
            Outfit Suggestions
          </h2>
          <p className='text-lg max-w-2xl mx-auto' style={{ color: 'var(--mui-palette-text-secondary)' }}>
            Get personalized outfit recommendations based on your local weather conditions
          </p>
        </div>

        {/* Main Card */}
        <div
          className='relative overflow-hidden rounded-3xl border backdrop-blur'
          style={{
            background:
              'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-info-lighterOpacity), var(--mui-palette-primary-lighterOpacity))',
            borderColor: 'var(--mui-palette-divider)'
          }}
        >
          {/* Animated background elements */}
          <div
            className='absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl'
            style={{ backgroundColor: 'var(--mui-palette-primary-lightOpacity)' }}
          ></div>
          <div
            className='absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl'
            style={{ backgroundColor: 'var(--mui-palette-info-lightOpacity)' }}
          ></div>

          <div className='relative p-8 sm:p-12 lg:p-16'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
              {/* Left: Icon and Text */}
              <div className='space-y-6 text-center lg:text-left'>
                <div className='flex justify-center lg:justify-start'>
                  <div
                    className='w-24 h-24 rounded-full flex items-center justify-center shadow-lg'
                    style={{
                      background:
                        'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))'
                    }}
                  >
                    <i className='tabler-cloud text-white text-4xl'></i>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h3 className='text-2xl sm:text-3xl font-bold' style={{ color: 'var(--mui-palette-text-primary)' }}>
                    What Should I Wear Today?
                  </h3>
                  <p className='text-base sm:text-lg leading-relaxed' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                    Let AI analyze current weather conditions at your location and suggest the
                    perfect outfits from your wardrobe. Smart, personalized, and weather-aware.
                  </p>
                </div>

                {/* Features List */}
                <div className='space-y-3 pt-4'>
                  {[
                    { icon: 'tabler-map-pin', text: 'Uses your current location' },
                    { icon: 'tabler-cloud', text: 'Real-time weather analysis' },
                    { icon: 'tabler-sparkles', text: 'AI-powered recommendations' }
                  ].map((feature, idx) => (
                    <div key={idx} className='flex items-center gap-3' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                      <div
                        className='w-8 h-8 rounded-lg flex items-center justify-center'
                        style={{ backgroundColor: 'var(--mui-palette-primary-lighterOpacity)' }}
                      >
                        <i className={`${feature.icon} text-primary`}></i>
                      </div>
                      <span className='text-sm'>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: CTA */}
              <div className='space-y-6'>
                <div className='backdrop-blur rounded-2xl p-8 border' style={{
                  backgroundColor: 'var(--mui-palette-background-paper)',
                  borderColor: 'var(--mui-palette-divider)',
                  opacity: 0.9
                }}>
                  <div className='space-y-6'>
                    {/* Button */}
                    <Button
                      variant='contained'
                      onClick={handleGetSuggestions}
                      disabled={isLoading || !user}
                      fullWidth
                      size='large'
                      startIcon={
                        isLoading ? (
                          <CircularProgress size={20} color='inherit' />
                        ) : (
                          <i className='tabler-sparkles'></i>
                        )
                      }
                      sx={{
                        background:
                          'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-info-main))',
                        '&:hover': {
                          background:
                            'linear-gradient(to right, var(--mui-palette-primary-dark), var(--mui-palette-info-dark))'
                        },
                        py: 1.5
                      }}
                    >
                      {isLoading ? 'Getting suggestions...' : 'Get Outfit Suggestions'}
                    </Button>

                    {/* Error Message */}
                    {error && (
                      <Alert severity='error' sx={{ borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}

                    {/* Login Prompt */}
                    {!user && (
                      <Alert severity='warning' sx={{ borderRadius: 2 }}>
                        Please log in to get personalized outfit suggestions
                      </Alert>
                    )}

                    {/* Info */}
                    <p className='text-xs text-center' style={{ color: 'var(--mui-palette-text-disabled)' }}>
                      We'll request your location permission to provide accurate weather data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeatherOutfitSection
