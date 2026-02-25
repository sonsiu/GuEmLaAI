'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import { ClientApi } from '@/services/client-api.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import OutfitDetailModal from './OutfitDetailModal'
import { wardrobeService } from '@/services/wardrobe.service'
import type { Outfit } from '@/types/wardrobe.type'

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

interface SuggestionTabProps {
  userId: number | null
}

const PAGE_SIZE = 8

const SuggestionTab: React.FC<SuggestionTabProps> = ({ userId }) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<OutfitSuggestionResponse | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isLoadingOutfit, setIsLoadingOutfit] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Load cached suggestions on mount
  useEffect(() => {
    if (!userId) return

    const cachedData = localStorage.getItem(CACHE_KEY)

    if (cachedData) {
      try {
        const cached: CachedSuggestions = JSON.parse(cachedData)
        const now = Date.now()

        // Check if cache is still valid and belongs to current user
        if (cached.userId === String(userId) && now - cached.timestamp < CACHE_EXPIRY_MS) {
          setSuggestions(cached.data)
        } else {
          localStorage.removeItem(CACHE_KEY)
        }
      } catch {
        localStorage.removeItem(CACHE_KEY)
      }
    }
  }, [userId])

  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(t('tryOn.wardrobe.suggestion.errors.geolocationNotSupported') || 'Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error(t('tryOn.wardrobe.suggestion.errors.permissionDenied') || 'Location permission denied. Please enable location access.'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new Error(t('tryOn.wardrobe.suggestion.errors.positionUnavailable') || 'Location information is unavailable.'))
              break
            case error.TIMEOUT:
              reject(new Error(t('tryOn.wardrobe.suggestion.errors.timeout') || 'Location request timed out.'))
              break
            default:
              reject(new Error(t('tryOn.wardrobe.suggestion.errors.unknown') || 'An unknown error occurred.'))
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

    if (!accessToken || !userId) {
      setError(t('tryOn.wardrobe.suggestion.errors.loginRequired') || 'Please log in to get outfit suggestions')
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
          userId: String(userId)
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      }).onError(err => {
        setError(err.message || t('tryOn.wardrobe.suggestion.errors.fetchFailed') || 'Failed to get suggestions')
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t('tryOn.wardrobe.suggestion.errors.fetchFailed') || 'Failed to get suggestions')
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSuggestions(null)
    setError(null)
    setCurrentPage(1)
    localStorage.removeItem(CACHE_KEY)
  }

  const handleOutfitClick = async (outfit: SuggestedOutfit) => {
    setShowDetailModal(true)
    setIsLoadingOutfit(true)
    
    try {
      const outfitDetail = await wardrobeService.getOutfit(outfit.id)
      setSelectedOutfit(outfitDetail)
    } catch (err) {
      // console.error('Failed to fetch outfit details:', err)
      // Close modal if fetch fails
      setShowDetailModal(false)
    } finally {
      setIsLoadingOutfit(false)
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedOutfit(null)
  }

  const handleDeleteSuccess = (outfitId: number) => {
    // Remove the deleted outfit from suggestions
    if (suggestions) {
      const updatedOutfits = suggestions.suggestedOutfits.filter(o => o.id !== outfitId)
      setSuggestions({
        ...suggestions,
        suggestedOutfits: updatedOutfits
      })
      // Update cache
      const cacheData: CachedSuggestions = {
        data: { ...suggestions, suggestedOutfits: updatedOutfits },
        timestamp: Date.now(),
        userId: String(userId)
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      
      // Reset to page 1 if current page is out of bounds
      const totalPages = Math.ceil(updatedOutfits.length / PAGE_SIZE)
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages)
      }
    }
  }

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    if (!suggestions) return { outfits: [], totalPages: 0 }
    
    const allOutfits = suggestions.suggestedOutfits
    const totalPages = Math.ceil(allOutfits.length / PAGE_SIZE)
    const startIdx = (currentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const outfits = allOutfits.slice(startIdx, endIdx)
    
    return { outfits, totalPages }
  }, [suggestions, currentPage])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getWeatherIcon = (weatherText: string, hasPrecipitation: boolean) => {
    if (hasPrecipitation) {
      if (weatherText.toLowerCase().includes('snow')) {
        return <i className='tabler-snowflake' style={{ fontSize: '2rem', color: 'white' }}></i>
      }
      return <i className='tabler-cloud-rain' style={{ fontSize: '2rem', color: 'white' }}></i>
    }

    if (weatherText.toLowerCase().includes('sun') || weatherText.toLowerCase().includes('clear')) {
      return <i className='tabler-sun' style={{ fontSize: '2rem', color: 'white' }}></i>
    }

    return <i className='tabler-cloud' style={{ fontSize: '2rem', color: 'white' }}></i>
  }

  // Show suggestions view
  if (suggestions) {
    return (
      <Box>
        {/* Header with Weather Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
                background: 'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))'
              }}
            >
              {getWeatherIcon(suggestions.weatherContext.weatherText, suggestions.weatherContext.hasPrecipitation)}
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={700} color='primary'>
                {t('tryOn.wardrobe.suggestion.title') || 'Your Outfit Suggestions'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <i className='tabler-map-pin' style={{ fontSize: '1rem', color: 'var(--mui-palette-text-secondary)' }}></i>
                <Typography variant='body2' color='text.secondary'>
                  {suggestions.weatherContext.locationName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>•</Typography>
                <Typography variant='body2' fontWeight={600} color='primary'>
                  {suggestions.weatherContext.temperature}°{suggestions.weatherContext.temperatureUnit}
                </Typography>
                <Typography variant='body2' color='text.secondary'>•</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {suggestions.weatherContext.weatherText}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Button
            variant='outlined'
            onClick={handleReset}
            startIcon={<i className='tabler-refresh'></i>}
          >
            {t('tryOn.wardrobe.suggestion.tryAnother') || 'Try Another Location'}
          </Button>
        </Box>

        {/* Weather Recommendation Card */}
        <Card
          sx={{
            mb: 4,
            background: 'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-info-lighterOpacity))',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))',
                  boxShadow: 2
                }}
              >
                <i className='tabler-cloud' style={{ fontSize: '1.5rem', color: 'white' }}></i>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant='h6' fontWeight={700} color='text.primary'>
                  {t('tryOn.wardrobe.suggestion.weatherRecommendation') || 'Weather Recommendation'}
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
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <i className='tabler-sparkles' style={{ fontSize: '1.25rem', color: 'var(--mui-palette-primary-main)' }}></i>
            <Typography variant='h6' fontWeight={700} color='primary'>
              {t('tryOn.wardrobe.suggestion.recommendedOutfits') || 'Recommended Outfits'}
            </Typography>
            <Chip
              label={suggestions.suggestedOutfits.length}
              size='small'
              sx={{
                backgroundColor: 'var(--mui-palette-primary-lighterOpacity)',
                color: 'var(--mui-palette-primary-main)',
                fontWeight: 600
              }}
            />
            {paginatedData.totalPages > 1 && (
              <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
                {t('tryOn.wardrobe.suggestion.pageInfo') || `Page ${currentPage} of ${paginatedData.totalPages}`}
              </Typography>
            )}
          </Box>

          {paginatedData.outfits.length > 0 ? (
            <>
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
                {paginatedData.outfits.map(outfit => (
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
                      boxShadow: 6,
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
                          boxShadow: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className='tabler-heart-filled' style={{ fontSize: '1.25rem', color: 'white' }}></i>
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
                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Typography variant='subtitle1' fontWeight={700} color='text.primary' noWrap>
                      {outfit.name || t('tryOn.wardrobe.suggestion.untitledOutfit') || 'Untitled Outfit'}
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
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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

            {/* Pagination Controls */}
            {paginatedData.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                <Pagination
                  count={paginatedData.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color='primary'
                  size='large'
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
            </>
          ) : (
            <Card sx={{ textAlign: 'center', py: 8, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <i className='tabler-cloud' style={{ fontSize: '4rem', color: 'var(--mui-palette-action-disabled)', marginBottom: '1rem', display: 'block' }}></i>
                <Typography variant='h6' fontWeight={600} color='text.secondary' gutterBottom>
                  {t('tryOn.wardrobe.suggestion.noOutfitsFound') || 'No outfits found for current weather'}
                </Typography>
                <Typography variant='body2' color='text.disabled' sx={{ mb: 3 }}>
                  {t('tryOn.wardrobe.suggestion.addOutfitsTip') || 'Try adding outfits with season tags to your wardrobe!'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Outfit Detail Modal */}
        <OutfitDetailModal
          open={showDetailModal}
          onClose={handleCloseDetailModal}
          outfit={selectedOutfit}
          loading={isLoadingOutfit}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </Box>
    )
  }

  // Initial view (before suggestions are loaded)
  return (
    <Box>
      {/* Main Card */}
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-info-lighterOpacity))'
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 256,
            height: 256,
            borderRadius: '50%',
            filter: 'blur(48px)',
            backgroundColor: 'var(--mui-palette-primary-lightOpacity)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 256,
            height: 256,
            borderRadius: '50%',
            filter: 'blur(48px)',
            backgroundColor: 'var(--mui-palette-info-lightOpacity)'
          }}
        />

        <CardContent sx={{ position: 'relative', p: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 4, lg: 6 },
              alignItems: 'center'
            }}
          >
            {/* Left: Icon and Text */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: { xs: 'center', lg: 'left' } }}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', lg: 'flex-start' } }}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 3,
                    background: 'linear-gradient(to bottom right, var(--mui-palette-primary-main), var(--mui-palette-info-main))'
                  }}
                >
                  <i className='tabler-cloud' style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant='h4' fontWeight={700} color='text.primary'>
                  {t('tryOn.wardrobe.suggestion.whatToWear') || 'What Should I Wear Today?'}
                </Typography>
                <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.7 }}>
                  {t('tryOn.wardrobe.suggestion.description') || 'Let AI analyze current weather conditions at your location and suggest the perfect outfits from your wardrobe. Smart, personalized, and weather-aware.'}
                </Typography>
              </Box>

              {/* Features List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
                {[
                  { icon: 'tabler-map-pin', text: t('tryOn.wardrobe.suggestion.feature1') || 'Uses your current location' },
                  { icon: 'tabler-cloud', text: t('tryOn.wardrobe.suggestion.feature2') || 'Real-time weather analysis' },
                  { icon: 'tabler-sparkles', text: t('tryOn.wardrobe.suggestion.feature3') || 'AI-powered recommendations' }
                ].map((feature, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--mui-palette-primary-lighterOpacity)'
                      }}
                    >
                      <i className={feature.icon} style={{ color: 'var(--mui-palette-primary-main)' }}></i>
                    </Box>
                    <Typography variant='body2' color='text.secondary'>
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: CTA */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card
                sx={{
                  p: 4,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Button */}
                  <Button
                    variant='contained'
                    onClick={handleGetSuggestions}
                    disabled={isLoading || !userId}
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
                      background: 'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-info-main))',
                      '&:hover': {
                        background: 'linear-gradient(to right, var(--mui-palette-primary-dark), var(--mui-palette-info-dark))'
                      },
                      py: 1.5
                    }}
                  >
                    {isLoading 
                      ? (t('tryOn.wardrobe.suggestion.gettingSuggestions') || 'Getting suggestions...') 
                      : (t('tryOn.wardrobe.suggestion.getOutfitSuggestions') || 'Get Outfit Suggestions')
                    }
                  </Button>

                  {/* Error Message */}
                  {error && (
                    <Alert severity='error' sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Login Prompt */}
                  {!userId && (
                    <Alert severity='warning' sx={{ borderRadius: 2 }}>
                      {t('tryOn.wardrobe.suggestion.loginPrompt') || 'Please log in to get personalized outfit suggestions'}
                    </Alert>
                  )}

                  {/* Info */}
                  <Typography variant='caption' color='text.disabled' textAlign='center'>
                    {t('tryOn.wardrobe.suggestion.locationPermission') || "We'll request your location permission to provide accurate weather data"}
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SuggestionTab
