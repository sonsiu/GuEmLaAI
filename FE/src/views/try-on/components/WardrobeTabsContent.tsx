'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import type { WardrobeItem, Outfit } from '@/types/wardrobe.type'
import { wardrobeService } from '@/services/wardrobe.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { ClientApi } from '@/services/client-api.service'

interface PublicOutfitItem {
  id: number
  name: string
  imageUrl: string
  buyLink?: string | null
  color?: string | null
  displayOrder: number
}

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
  items?: PublicOutfitItem[]
}

interface WardrobeTabsContentProps {
  userId?: number | string
  onItemSelect?: (item: WardrobeItem) => void
  onOutfitSelect?: (outfit: Outfit) => void
  onPublicCollectionSelect?: (collection: PublicOutfitCard) => void
  showUploadButton?: boolean
  compactMode?: boolean
  selectedItems?: WardrobeItem[]
  defaultTab?: 0 | 1
  isLoading?: boolean
}

export default function WardrobeTabsContent({
  userId,
  onItemSelect,
  onOutfitSelect,
  onPublicCollectionSelect,
  showUploadButton = false,
  compactMode = false,
  selectedItems = [],
  defaultTab = 0,
  isLoading = false
}: WardrobeTabsContentProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<0 | 1>(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [publicSearchQuery, setPublicSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [publicOutfits, setPublicOutfits] = useState<PublicOutfitCard[]>([])
  const [allPublicOutfits, setAllPublicOutfits] = useState<PublicOutfitCard[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination states
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsTotalPages, setItemsTotalPages] = useState(1)
  const [outfitsPage, setOutfitsPage] = useState(1)
  const [outfitsTotalPages, setOutfitsTotalPages] = useState(1)
  const [publicOutfitsPage, setPublicOutfitsPage] = useState(1)
  const [publicOutfitsTotalPages, setPublicOutfitsTotalPages] = useState(1)
  const pageSize = 6

  useEffect(() => {
    if (userId) {
      fetchItems(1, selectedCategory, searchQuery)
      fetchOutfits(1)
    } else {
      setLoading(false)
    }
    fetchPublicOutfits()
  }, [userId])

  const handleApplyFilters = () => {
    setItemsPage(1)
    fetchItems(1, selectedCategory, searchQuery)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setItemsPage(1)
    fetchItems(1, '', '')
  }

  const fetchItems = async (page: number = 1, category?: string, search?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      const filters = {
        ...(category && { category }),
        ...(search && { searchQuery: search })
      }

      const response = await wardrobeService.getUserItems(Number(userId), page, pageSize, filters)

      if (response?.data) {
        setItems(response.data)
        setItemsPage(response.pagination?.currentPage || 1)
        setItemsTotalPages(response.pagination?.totalPages || 1)
      } else {
        setItems([])
      }
    } catch (err) {
      // console.error('Error fetching items:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOutfits = async (page: number = 1) => {
    if (!userId) return

    try {
      const response = await wardrobeService.getUserOutfits(Number(userId), page, pageSize)

      if (response?.data) {
        setOutfits(response.data)
        setOutfitsPage(response.pagination?.currentPage || 1)
        setOutfitsTotalPages(response.pagination?.totalPages || 1)
      } else {
        setOutfits([])
      }
    } catch (err) {
      // console.error('Error fetching outfits:', err)
      setOutfits([])
    }
  }

  const fetchPublicOutfits = async () => {
    try {
      const response = await ClientApi.get<any>('/PublicCollection/outfits')
      const raw = response.getRaw()
      const payload = raw?.data

      const outfits: PublicOutfitCard[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []

      setAllPublicOutfits(outfits || [])
      
      // Apply search filter and pagination
      applyPublicOutfitsFilter(outfits, '')
    } catch (err) {
      // console.error('Error fetching public outfits:', err)
      setAllPublicOutfits([])
      setPublicOutfits([])
    }
  }

  const applyPublicOutfitsFilter = (outfits: PublicOutfitCard[], query: string) => {
    // Filter outfits by search query
    const filtered = query.trim()
      ? outfits.filter(outfit => 
          outfit.name?.toLowerCase().includes(query.toLowerCase()) ||
          outfit.description?.toLowerCase().includes(query.toLowerCase())
        )
      : outfits
    
    // Calculate total pages based on filtered results
    const totalPages = Math.ceil((filtered?.length || 0) / pageSize)
    setPublicOutfitsTotalPages(totalPages)
    
    // Reset to page 1 and display first page of filtered results
    setPublicOutfitsPage(1)
    const startIndex = 0
    const endIndex = pageSize
    setPublicOutfits(filtered.slice(startIndex, endIndex))
  }

  const handlePublicOutfitsPageChange = (page: number) => {
    setPublicOutfitsPage(page)
    
    // Apply current search filter
    const filtered = publicSearchQuery.trim()
      ? allPublicOutfits.filter(outfit => 
          outfit.name?.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
          outfit.description?.toLowerCase().includes(publicSearchQuery.toLowerCase())
        )
      : allPublicOutfits
    
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPublicOutfits(filtered.slice(startIndex, endIndex))
  }

  const handlePublicSearch = (query: string) => {
    setPublicSearchQuery(query)
    applyPublicOutfitsFilter(allPublicOutfits, query)
  }

  const filteredItems = items  // Items are already filtered by API

  const filteredOutfits = outfits.filter(outfit => {
    if (!searchQuery.trim()) return true
    return outfit.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <Box
      id='intro-wardrobe-container'
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={t('tryOn.wardrobe.items')} />
          <Tab label={t('tryOn.wardrobe.publicCollection')} />
        </Tabs>
      </Box>

      {/* Search & Filter Bar - Items tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, flexShrink: 0 }}>
          {/* Search and Filter Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size='small'
              placeholder={t('tryOn.wardrobe.search.placeholder') || 'Search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i
                      className='tabler-search'
                      style={{ fontSize: '1.25rem', color: 'var(--mui-palette-text-secondary)' }}
                    ></i>
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant='contained'
              onClick={handleApplyFilters}
              sx={{ minWidth: 80 }}
              size='small'
            >
              {t('tryOn.wardrobe.search.button') || 'Search'}
            </Button>
          </Box>

          {/* Category Dropdown and Reset */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{t('tryOn.wardrobe.categories.name') || 'Category'}</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  const newCategory = e.target.value
                  setSelectedCategory(newCategory)
                  setItemsPage(1)
                  fetchItems(1, newCategory, searchQuery)
                }}
                label={t('tryOn.wardrobe.categories.name') || 'Category'}
              >
                <MenuItem value=''>{t('tryOn.wardrobe.categories.all') || 'All Categories'}</MenuItem>
                <MenuItem value='Top'>{t('tryOn.wardrobe.categories.top') || 'Top'}</MenuItem>
                <MenuItem value='Bottom'>{t('tryOn.wardrobe.categories.bottom') || 'Bottom'}</MenuItem>
                <MenuItem value='Outerwear'>{t('tryOn.wardrobe.categories.outerWear') || 'Outerwear'}</MenuItem>
                <MenuItem value='Footwear'>{t('tryOn.wardrobe.categories.footWear') || 'Footwear'}</MenuItem>
                <MenuItem value='Bag'>{t('tryOn.wardrobe.categories.bag') || 'Bag'}</MenuItem>
                <MenuItem value='Accessory'>{t('tryOn.wardrobe.categories.accessories') || 'Accessories'}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      {/* Search Bar - Public Collection tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexShrink: 0 }}>
          <TextField
            fullWidth
            size='small'
            placeholder={t('tryOn.wardrobe.search.publicPlaceholder') || 'Search collections...'}
            value={publicSearchQuery}
            onChange={e => handlePublicSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i
                    className='tabler-search'
                    style={{ fontSize: '1.25rem', color: 'var(--mui-palette-text-secondary)' }}
                  ></i>
                </InputAdornment>
              )
            }}
          />
        </Box>
      )}

      {/* Pagination - Top */}
      {!loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          {activeTab === 0 && itemsTotalPages > 1 && (
            <Pagination
              count={itemsTotalPages}
              page={itemsPage}
              onChange={(_, page) => fetchItems(page, selectedCategory, searchQuery)}
              size='small'
              siblingCount={0}
              boundaryCount={1}
            />
          )}
          {activeTab === 1 && publicOutfitsTotalPages > 1 && (
            <Pagination
              count={publicOutfitsTotalPages}
              page={publicOutfitsPage}
              onChange={(_, page) => handlePublicOutfitsPageChange(page)}
              size='small'
              siblingCount={0}
              boundaryCount={1}
            />
          )}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <>
                {filteredItems.length > 0 ? (
                  <>
                    <Box id='intro-wardrobe-items' sx={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(2, 1fr)'
                          },
                          gap: 2,
                          p: 1
                        }}
                      >
                        {filteredItems.map(item => {
                          const isSelected = selectedItems.some(s => s.id === item.id)

                          return (
                            <Box
                              key={item.id}
                              onClick={() => {
                                if (!isLoading) {
                                  onItemSelect?.(item)
                                }
                              }}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                border: '2px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'primary.lighterOpacity' : 'background.paper',
                                borderRadius: 2,
                                overflow: 'hidden',
                                opacity: isLoading ? 0.6 : 1,
                                pointerEvents: isLoading ? 'none' : 'auto',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected ? 4 : 2,
                                '&:hover': {
                                  boxShadow: isLoading ? 2 : 6,
                                  borderColor: isLoading ? 'divider' : 'primary.main',
                                  transform: isLoading ? 'translateY(0)' : 'translateY(-2px)'
                                }
                              }}
                            >
                              <Box
                                component='img'
                                src={item.imageUrl || item.imagePreview}
                                alt={item.categoryName}
                                sx={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  objectFit: 'cover',
                                  bgcolor: 'background.default'
                                }}
                              />
                              <Box sx={{ p: 1.5 }}>
                                <Typography
                                  variant='subtitle2'
                                  fontWeight={600}
                                  noWrap
                                  sx={{
                                    color: 'text.primary'
                                  }}
                                >
                                  {item.comment || item.categoryName || `Item #${item.id}`}
                                </Typography>
                                {item.categoryName && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {item.categoryName}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant='h6' color='text.secondary'>
                      {t('tryOn.wardrobe.noItems')}
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {activeTab === 1 && (
              <>
                {publicOutfits.length > 0 ? (
                  <>
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(2, 1fr)'
                          },
                          gap: 2,
                          p: 1
                        }}
                      >
                        {publicOutfits.map(outfit => (
                          <Box
                            key={outfit.id}
                            onClick={() => {
                              if (!isLoading) {
                                onPublicCollectionSelect?.(outfit)
                              }
                            }}
                            sx={{
                              borderRadius: 2,
                              overflow: 'hidden',
                              bgcolor: 'background.paper',
                              boxShadow: 2,
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              opacity: isLoading ? 0.6 : 1,
                              pointerEvents: isLoading ? 'none' : 'auto',
                              '&:hover': {
                                boxShadow: isLoading ? 2 : 6,
                                transform: isLoading ? 'translateY(0)' : 'translateY(-2px)'
                              }
                            }}
                          >
                            {/* 2x2 Items Grid */}
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 0,
                                aspectRatio: '1',
                                overflow: 'hidden',
                                background: 'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))'
                              }}
                            >
                              {[...Array(4)].map((_, idx) => {
                                const item = outfit.items?.[idx]
                                return (
                                  <Box
                                    key={idx}
                                    sx={{
                                      position: 'relative',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRight: idx % 2 === 0 ? '1px solid' : 'none',
                                      borderBottom: idx < 2 ? '1px solid' : 'none',
                                      borderColor: 'divider',
                                      bgcolor: 'background.paper'
                                    }}
                                  >
                                    {item ? (
                                      <Box
                                        component='img'
                                        src={item.imageUrl}
                                        alt={item.name}
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                      />
                                    ) : (
                                      <i
                                        className='tabler-photo-off'
                                        style={{
                                          fontSize: '1.5rem',
                                          color: 'var(--mui-palette-action-disabled)'
                                        }}
                                      ></i>
                                    )}
                                  </Box>
                                )
                              })}
                            </Box>

                            {/* Outfit Info */}
                            <Box sx={{ p: 1.5 }}>
                              <Typography
                                variant='subtitle2'
                                fontWeight={600}
                                noWrap
                                sx={{
                                  mb: 0.5,
                                  color: 'text.primary'
                                }}
                              >
                                {outfit.name}
                              </Typography>
                              {outfit.description && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {outfit.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant='h6' color='text.secondary'>
                      {t('tryOn.wardrobe.noOutfits')}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

