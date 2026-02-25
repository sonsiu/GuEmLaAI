'use client'

import React, { useState, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { ClientApi } from '@/services/client-api.service'
import PublicCollectionPreviewModal from './PublicCollectionPreviewModal'

interface PublicOutfitCard {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive?: boolean
  displayOrder?: number
  seasons?: string[]
  createdAt?: string
  updatedAt?: string | null
  items?: Array<{
    id: number
    name: string
    imageUrl: string
    color?: string | null
    displayOrder: number
  }>
}

interface CollectionWithOutfits {
  id: number
  name: string
  description?: string | null
  imageCoverUrl?: string | null
  outfitCount: number
  isPublic: boolean
  currentImageIndex: number
  outfits: PublicOutfitCard[]
}

const PublicCollectionsSection: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')) // 600-900px
  const isMedium = useMediaQuery(theme.breakpoints.between('md', 'lg')) // 900-1200px
  
  // Determine cards per view based on screen size
  const cardsPerView = isMobile ? 1 : isTablet ? 2 : isMedium ? 3 : 5
  
  const [collections, setCollections] = useState<CollectionWithOutfits[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutfit, setSelectedOutfit] = useState<PublicOutfitCard | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch public outfits (backend returns { data: [...] })
  useEffect(() => {
    const fetchPublicOutfits = async () => {
      try {
        setLoading(true)


        const response = await ClientApi.get<any>('/PublicCollection/outfits?pageNumber=1&pageSize=50')

        const raw = response.getRaw()

        const payload = raw?.data

        const outfits: PublicOutfitCard[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []

        if (!outfits || outfits.length === 0) {
          setCollections([])
          setLoading(false)
          return
        }

        // Map outfits to card-friendly collection shape
        const mapped = outfits.map(outfit => ({
          id: outfit.id,
          name: outfit.name,
          description: outfit.description ?? null,
          imageCoverUrl: outfit.imageUrl ?? null,
          outfitCount: 1,
          isPublic: true,
          currentImageIndex: 0,
          outfits: [
            {
              ...outfit,
              imageUrl: outfit.imageUrl ?? null
            }
          ]
        }))

        setCollections(mapped)
      } catch {
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    fetchPublicOutfits()
  }, [])

  // Note: Slideshow removed since we're not loading outfit details upfront
  // Slideshow will be handled in the preview modal if needed

  const handleCollectionClick = (outfit: PublicOutfitCard) => {
    setSelectedOutfit(outfit)
    setShowPreviewModal(true)
  }

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false)
    setSelectedOutfit(null)
  }

  // Filter collections by search query
  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // For infinite loop carousel - duplicate collections
  const duplicatedCollections = filteredCollections.length > 0 
    ? [...filteredCollections, ...filteredCollections, ...filteredCollections] 
    : []

  // Initialize carousel at the middle section
  useEffect(() => {
    if (filteredCollections.length > 0 && currentIndex === 0) {
      setCurrentIndex(filteredCollections.length)
    }
  }, [filteredCollections.length])

  // Auto-scroll carousel - move one card at a time
  useEffect(() => {
    if (!isAutoPlaying || filteredCollections.length === 0) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => prev + 1)
    }, 3000) // Move to next card every 3 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, filteredCollections.length])

  // Reset to middle section when reaching boundaries for infinite loop effect
  useEffect(() => {
    if (filteredCollections.length === 0) return

    const totalOriginalCards = filteredCollections.length
    
    // If we've scrolled past the second set, jump back to the first set
    if (currentIndex >= totalOriginalCards * 2) {
      setIsTransitioning(false)
      setTimeout(() => {
        setCurrentIndex(totalOriginalCards)
        setTimeout(() => setIsTransitioning(true), 50)
      }, 500) // Wait for transition to complete
    }
    // If we've scrolled before the first set, jump to the second set
    else if (currentIndex < totalOriginalCards) {
      setIsTransitioning(false)
      setTimeout(() => {
        setCurrentIndex(totalOriginalCards)
        setTimeout(() => setIsTransitioning(true), 50)
      }, 500)
    }
  }, [currentIndex, filteredCollections.length])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(prev => prev - 1)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(prev => prev + 1)
  }

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(filteredCollections.length + index) // Jump to middle section
  }

  if (loading) {
    return (
      <div id='public-collections' className='w-full border-b border-primary'>
        <div className='w-full px-2 sm:px-3 lg:px-4 py-6 sm:py-8 lg:py-1'>
          <div className='mb-8'>
            <h2 className='text-2xl font-bold mb-1 text-primary'>{t('home.publicCollections.title')}</h2>
            <p className='text-sm mb-6' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              {t('home.publicCollections.subtitle')}
            </p>
            <TextField
              fullWidth
              placeholder={t('home.publicCollections.searchPlaceholder')}
              disabled
              size='small'
              sx={{ maxWidth: '28rem' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                  </InputAdornment>
                )
              }}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
            {[1, 2, 3, 4, 5].map(i => (
              <Box
                key={i}
                className='rounded-2xl shadow-sm overflow-hidden'
                sx={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
              >
                <Skeleton variant='rectangular' width='100%' height={200} />
                <Box className='p-4 space-y-2'>
                  <Skeleton variant='text' width='75%' />
                  <Skeleton variant='text' width='50%' />
                </Box>
              </Box>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id='public-collections'
      className='w-full border-b border-primary'
    >
      <div className='w-full px-2 sm:px-3 lg:px-4 py-6 sm:py-8 lg:py-10'>
        {/* Header Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-bold mb-1 text-primary'>{t('home.publicCollections.title')}</h2>
              <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                {t('home.publicCollections.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length > 0 ? (
          <div className='relative'>
            {/* Navigation Buttons */}
            {filteredCollections.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevious}
                  sx={{
                    position: 'absolute',
                    left: { xs: 4, sm: -20 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <i className='tabler-chevron-left' />
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: { xs: 4, sm: -20 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <i className='tabler-chevron-right' />
                </IconButton>
              </>
            )}

            {/* Carousel Container */}
            <div className='overflow-hidden' ref={carouselRef}>
              <div
                className='flex'
                style={{
                  transform: `translateX(calc(-${currentIndex * (100 / cardsPerView)}%))`,
                  transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none'
                }}
              >
                {/* Display duplicated collections for infinite loop */}
                {duplicatedCollections.map((collection, index) => (
                  <div
                    key={`${collection.id}-${index}`}
                    className='flex-shrink-0'
                    style={{ width: `calc(100% / ${cardsPerView})` }}
                  >
                    <div className='px-3'>
                      <div
                        onClick={() => handleCollectionClick(collection.outfits[0])}
                        className='rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer group overflow-hidden'
                        style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}
                      >
                        {/* Items Grid (2x2) */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 0,
                            aspectRatio: '1',
                            overflow: 'hidden',
                            background: 'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))'
                          }}
                        >
                          {/* Show up to 4 items in 2x2 grid */}
                          {[...Array(4)].map((_, idx) => {
                            const outfit = collection.outfits[0]
                            const item = outfit?.items?.[idx]
                            return (
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRight: idx % 2 === 0 ? '1px solid' : 'none',
                                  borderBottom: idx < 2 ? '1px solid' : 'none',
                                  borderColor: 'var(--mui-palette-divider)',
                                  backgroundColor: 'var(--mui-palette-background-paper)'
                                }}
                              >
                                {item ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%',
                                      height: '100%',
                                      color: 'var(--mui-palette-action-disabled)'
                                    }}
                                  >
                                    <i className='tabler-photo-off' style={{ fontSize: '1.5rem' }} />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Collection Info */}
                        <div className='p-4'>
                          <h3
                            className='font-bold truncate mb-1 group-hover:text-primary transition-colors'
                            style={{ color: 'var(--mui-palette-text-primary)' }}
                          >
                            {collection.name}
                          </h3>
                          {collection.description && (
                            <p className='text-xs line-clamp-2 mb-2' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                              {collection.description}
                            </p>
                          )}
                          <div className='flex items-center gap-2'>
                            <span
                              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold'
                              style={{
                                backgroundColor: 'var(--mui-palette-primary-lighterOpacity)',
                                color: 'var(--mui-palette-primary-main)'
                              }}
                            >
                              Public
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Navigation */}
            {filteredCollections.length > 1 && (
              <div className='flex justify-center gap-2 mt-6'>
                {filteredCollections.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className='transition-all'
                    style={{
                      width: (currentIndex % filteredCollections.length) === index ? '32px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: (currentIndex % filteredCollections.length) === index 
                        ? 'var(--mui-palette-primary-main)' 
                        : 'var(--mui-palette-action-disabled)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-12'>
            <i
              className='tabler-layers text-6xl mx-auto mb-4 block'
              style={{ color: 'var(--mui-palette-action-disabled)' }}
            ></i>
            <p className='text-lg' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              {searchQuery ? t('home.publicCollections.noResultsSearch') : t('home.publicCollections.noCollectionsAvailable')}
            </p>
          </div>
        )}

        {/* Public Collection Preview Modal */}
        <PublicCollectionPreviewModal
          open={showPreviewModal}
          onClose={handleClosePreviewModal}
          outfit={selectedOutfit}
        />
      </div>
    </div>
  )
}

export default PublicCollectionsSection
