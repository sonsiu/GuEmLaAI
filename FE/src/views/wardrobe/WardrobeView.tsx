'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast } from '@/services/toast.service'
import type {
  WardrobeItem,
  Board,
  Outfit,
  PaginatedResponse
} from '@/types/wardrobe.type'
import type { WardrobeFilters } from '@/types/wardrobe.filter'
import ItemsTab from './components/ItemsTab'
import OutfitsTab from './components/OutfitsTab'
import BoardsTab from './components/BoardsTab'
import SuggestionTab from './components/SuggestionTab'
import AdvancedFilterPanel from './components/AdvancedFilterPanel'
import CategoryFilterBar from './components/CategoryFilterBar'
import CreateBoardModal from './components/CreateBoardModal'
import EditBoardModal from './components/EditBoardModal'
import EditItemModal from './components/EditItemModal'
import EditOutfitModal from './components/EditOutfitModal'
import OutfitDetailModal from './components/OutfitDetailModal'

type TabValue = 'items' | 'outfits' | 'boards' | 'suggestion'
type FilterType = 'all' | 'favorite' | 'public'

const WardrobeView: React.FC = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const { t, lang } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabValue>('items')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  // Advanced filter state
  const [itemFilters, setItemFilters] = useState<WardrobeFilters>({})
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(false)
  const [outfitSearchQuery, setOutfitSearchQuery] = useState('')
  const [outfitIsFavoriteOnly, setOutfitIsFavoriteOnly] = useState(false)

  // Data states
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [historyBoard, setHistoryBoard] = useState<any>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [outfitsLoading, setOutfitsLoading] = useState(false)

  // Pagination states
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsTotalPages, setItemsTotalPages] = useState(1)
  const [itemsTotalItems, setItemsTotalItems] = useState(0)
  const [outfitsPage, setOutfitsPage] = useState(1)
  const [outfitsTotalPages, setOutfitsTotalPages] = useState(1)
  const [outfitsTotalItems, setOutfitsTotalItems] = useState(0)
  const pageSize = 12

  // Modal states
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false)
  const [showEditBoardModal, setShowEditBoardModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [showEditOutfitModal, setShowEditOutfitModal] = useState(false)
  const [showOutfitModal, setShowOutfitModal] = useState(false)
  const [outfitDetailLoading, setOutfitDetailLoading] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)

  // Get user ID
  const userId = user?.id ? Number(user.id) : null

  // Handle query params
  useEffect(() => {
    const tab = searchParams.get('tab')

    if (tab === 'items' || tab === 'outfits' || tab === 'boards' || tab === 'suggestion') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Helper function to calculate time ago with i18n
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffDays === 0) return t('tryOn.wardrobe.timeAgo.today')
    if (diffDays === 1) return t('tryOn.wardrobe.timeAgo.daysAgo', { count: 1 })
    if (diffDays < 7) return t('tryOn.wardrobe.timeAgo.daysAgo', { count: diffDays })
    if (diffWeeks === 1) return t('tryOn.wardrobe.timeAgo.weeksAgo', { count: 1 })
    if (diffWeeks < 4) return t('tryOn.wardrobe.timeAgo.weeksAgo', { count: diffWeeks })

    const diffMonths = Math.floor(diffDays / 30)

    if (diffMonths === 1) return t('tryOn.wardrobe.timeAgo.monthsAgo', { count: 1 })
    if (diffMonths < 12) return t('tryOn.wardrobe.timeAgo.monthsAgo', { count: diffMonths })

    const diffYears = Math.floor(diffDays / 365)

    return t('tryOn.wardrobe.timeAgo.yearsAgo', { count: diffYears })
  }

  // Fetch items
  const fetchItems = async (page: number = 1, filtersOverride?: WardrobeFilters) => {
    if (!userId) return

    setItemsLoading(true)

    // Use override filters if provided, otherwise use state filters
    const activeFilters = filtersOverride || itemFilters

    // console.log('🌐 [WardrobeView] fetchItems called - Page:', page)
    // console.log('🔍 [WardrobeView] Active filters:', activeFilters)
    // console.log('🔎 [WardrobeView] Search param in filters:', activeFilters.searchQuery)

    try {
      const response = await wardrobeService.getUserItems(userId, page, pageSize, activeFilters)

      // console.log('✅ [WardrobeView] API response received:', response)

      if (response && response.data) {
        setItems(response.data)
        setItemsPage(response.pagination?.currentPage || 1)
        setItemsTotalPages(response.pagination?.totalPages || 1)
        setItemsTotalItems(response.pagination?.totalItems || 0)
      } else {
        setItems([])
        setItemsPage(1)
        setItemsTotalPages(1)
        setItemsTotalItems(0)
      }
    } catch (err) {
      // console.error('❌ [WardrobeView] Error fetching items:', err)
      showErrorToast(t('tryOn.wardrobe.errors.fetchItems'))
      setItems([])
      setItemsPage(1)
      setItemsTotalPages(1)
      setItemsTotalItems(0)
    } finally {
      setItemsLoading(false)
    }
  }

  // Fetch outfits
  const fetchOutfits = async (page: number = 1, filtersOverride?: { searchQuery?: string }) => {
    if (!userId) return

    setOutfitsLoading(true)

    // Use override filters if provided, otherwise use state filters
    const activeFilters = filtersOverride || (outfitSearchQuery ? { searchQuery: outfitSearchQuery } : {})

    try {
      const response = await wardrobeService.getUserOutfits(userId, page, pageSize, activeFilters)

      if (response && response.data) {
        setOutfits(response.data)
        setOutfitsPage(response.pagination?.currentPage || 1)
        setOutfitsTotalPages(response.pagination?.totalPages || 1)
        setOutfitsTotalItems(response.pagination?.totalItems || 0)
      } else {
        setOutfits([])
        setOutfitsPage(1)
        setOutfitsTotalPages(1)
        setOutfitsTotalItems(0)
      }
    } catch (err) {
      // console.error('Error fetching outfits:', err)
      showErrorToast(t('tryOn.wardrobe.errors.fetchOutfits'))
      setOutfits([])
      setOutfitsPage(1)
      setOutfitsTotalPages(1)
      setOutfitsTotalItems(0)
    } finally {
      setOutfitsLoading(false)
    }
  }

  // Fetch boards
  const fetchBoards = async () => {
    if (!userId) return

    try {
      const data = await wardrobeService.getUserBoards(userId)

      if (data) {
        setBoards(data.boards || [])
        setHistoryBoard(data.historyBoard || null)
      } else {
        setBoards([])
        setHistoryBoard(null)
      }
    } catch (err) {
      // console.error('Error fetching boards:', err)
      showErrorToast(t('tryOn.wardrobe.errors.fetchBoards'))
      setBoards([])
      setHistoryBoard(null)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      setLoading(true)
      Promise.all([fetchItems(), fetchOutfits(), fetchBoards()]).finally(() => setLoading(false))
    }
  }, [userId])

  // Handle tab change with URL update
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue)
    const newUrl = `/${lang}/wardrobe?tab=${newValue}`

    router.push(newUrl)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: WardrobeFilters) => {
    setItemFilters(newFilters)
  }

  // Handle apply filters (triggered by submit button or Enter key)
  const handleApplyFilters = (newFilters: WardrobeFilters) => {
    // console.log('🚀 [WardrobeView] handleApplyFilters called')
    // console.log('📋 [WardrobeView] Received filters:', newFilters)
    // console.log('🔎 [WardrobeView] Search value:', newFilters.searchQuery)

    setItemFilters(newFilters)
    setItemsPage(1)
    // Pass filters directly to avoid async state update delay
    void fetchItems(1, newFilters)
  }

  // Handle category filter change
  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category)
    setItemsPage(1)

    // Merge category with existing filters
    const updatedFilters: WardrobeFilters = {
      ...itemFilters,
      category: category
    }

    setItemFilters(updatedFilters)
    void fetchItems(1, updatedFilters)
  }

  // Handle favorite filter toggle
  const handleFavoriteFilterToggle = () => {
    setItemsPage(1)
    const newIsFavoriteOnly = !isFavoriteOnly
    setIsFavoriteOnly(newIsFavoriteOnly)

    // Update filters with isFavorite parameter
    const updatedFilters: WardrobeFilters = {
      ...itemFilters,
      isFavorite: newIsFavoriteOnly ? true : undefined
    }

    setItemFilters(updatedFilters)
    void fetchItems(1, updatedFilters)
  }

  const handleOutfitFavoriteFilterToggle = () => {
    setOutfitsPage(1)
    setOutfitIsFavoriteOnly(!outfitIsFavoriteOnly)
    void fetchOutfits(1)
  }

  // Handle filter reset
  const handleFilterReset = () => {
    const emptyFilters: WardrobeFilters = {}
    setItemFilters(emptyFilters)
    setSelectedCategory(undefined)
    setIsFavoriteOnly(false)
    setItemsPage(1)
    // Pass empty filters directly to avoid async state update delay
    void fetchItems(1, emptyFilters)
  }

  // Handle outfit search
  const handleOutfitSearch = (searchQuery: string) => {
    setOutfitSearchQuery(searchQuery)
    setOutfitsPage(1)
    void fetchOutfits(1, { searchQuery: searchQuery === '' ? undefined : searchQuery })
  }

  // Filter and search functions
  const filteredItems = items.filter(item => {
    if (filterType === 'favorite' && !item.isFavorite) return false
    if (filterType === 'public' && !item.isPublic) return false

    return true
  })

  const filteredOutfits = outfits.filter(outfit => {
    if (filterType === 'favorite' && !outfit.isFavorite) return false
    if (filterType === 'public' && !outfit.isPublic) return false
    
    // Apply favorite filter from button
    if (outfitIsFavoriteOnly && !outfit.isFavorite) return false

    return true
  })

  const filteredBoards = boards.filter(board => {
    return true
  })

  // Modal handlers
  const handleBoardCreated = async () => {
    await fetchBoards()
  }

  const handleEditBoard = (board: Board) => {
    setSelectedBoard(board)
    setShowEditBoardModal(true)
  }

  const handleAddItems = () => {
    router.push(`/${lang}/wardrobe/additem`)
  }

  const handleCreateOutfit = () => {
    router.push(`/${lang}/wardrobe/outfit`)
  }

  const handleCreateBoardClick = () => {
    setShowCreateBoardModal(true)
  }

  const handleOutfitCardClick = async (outfit: Outfit) => {
    try {
      setOutfitDetailLoading(true)
      // console.log('🔄 Fetching outfit details before opening modal:', outfit.id)
      const detail = await wardrobeService.getOutfit(outfit.id)
      // console.log('✅ Outfit details loaded:', detail)
      // console.log('✅ poseImages in WardrobeView:', detail?.poseImages)
      // console.log('✅ About to set selected outfit with poseImages:', detail?.poseImages)
      setSelectedOutfit(detail)
      setShowOutfitModal(true)
    } catch (err) {
      // console.error('Error fetching outfit detail:', err)
      showErrorToast(t('tryOn.wardrobe.errors.fetchOutfitDetail') || 'Failed to load outfit details')
      // Fallback: show modal with initial data if fetch fails
      setSelectedOutfit(outfit)
      setShowOutfitModal(true)
    } finally {
      setOutfitDetailLoading(false)
    }
  }

  const handleEditOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit)
    setShowOutfitModal(false)
    setShowEditOutfitModal(true)
  }

  const handleToggleFavorite = async (itemId: number) => {
    try {
      const item = items.find(i => i.id === itemId)

      if (!item) return

      // Toggle favorite status
      await wardrobeService.updateItem(itemId, {
        categoryName: item.categoryName,
        size: item.size,
        isFavorite: !item.isFavorite,
        itemName: item.comment || '',
        description: item.description || undefined,
        colors: item.itemColors,
        seasons: item.itemSeasons
      })

      // Refresh items list
      await fetchItems(itemsPage)
    } catch (error) {
      // console.error('Error toggling favorite:', error)
      showErrorToast(t('tryOn.wardrobe.errors.toggleFavorite') || 'Failed to toggle favorite')
    }
  }

  const handleToggleOutfitFavorite = async (outfitId: number) => {
    try {
      const outfit = outfits.find(o => o.id === outfitId)

      if (!outfit) return

      // Toggle favorite status
      await wardrobeService.updateOutfit(outfitId, {
        name: outfit.name || '',
        isFavorite: !outfit.isFavorite,
        seasons: outfit.outfitSeasons
      })

      // Refresh outfits list
      await fetchOutfits(outfitsPage)
    } catch (error) {
      // console.error('Error toggling outfit favorite:', error)
      showErrorToast(t('tryOn.wardrobe.errors.toggleFavorite') || 'Failed to toggle favorite')
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        {t('tryOn.wardrobe.title')}
      </Typography>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('tryOn.wardrobe.items')} value="items" />
        <Tab label={t('tryOn.wardrobe.outfits')} value="outfits" />
        <Tab label={t('tryOn.wardrobe.boards')} value="boards" />
        <Tab label={t('tryOn.wardrobe.suggestion.tabTitle') || 'Suggestion'} value="suggestion" />
      </Tabs>



      {/* Content */}
      {activeTab === 'items' && (
        <>
          {/* Filter and Action Bar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {/* Category Filter Bar */}
            <CategoryFilterBar
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />

            {/* Advanced Filter Panel and Add Items Button */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <AdvancedFilterPanel
                  filters={itemFilters}
                  onFiltersChange={handleFilterChange}
                  onApplyFilters={handleApplyFilters}
                  onReset={handleFilterReset}
                />
              </Box>
              <Button
                variant={isFavoriteOnly ? 'contained' : 'outlined'}
                color={isFavoriteOnly ? 'error' : 'inherit'}
                startIcon={<i className={isFavoriteOnly ? 'tabler-heart-filled' : 'tabler-heart'} />}
                onClick={handleFavoriteFilterToggle}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                {t('tryOn.wardrobe.favorites') || 'Favorites'}
              </Button>
              <Button
                variant="contained"
                startIcon={<i className="tabler-plus" />}
                onClick={handleAddItems}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                {t('tryOn.wardrobe.create.addItems') || 'Add Items'}
              </Button>
            </Box>
          </Box>

          {/* Items Tab */}
          <ItemsTab
            items={filteredItems}
            loading={itemsLoading}
            page={itemsPage}
            totalPages={itemsTotalPages}
            onPageChange={fetchItems}
            onItemClick={(item) => {
              setSelectedItem(item)
              setShowEditItemModal(true)
            }}
            onToggleFavorite={handleToggleFavorite}
            onAddItems={handleAddItems}
            getTimeAgo={getTimeAgo}
          />
        </>
      )}

      {activeTab === 'outfits' && (
        <>
          {/* Search and Action Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder={t('tryOn.wardrobe.search.placeholder') || 'Search outfits...'}
              size="small"
              value={outfitSearchQuery}
              onChange={(e) => setOutfitSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleOutfitSearch(outfitSearchQuery)
                }
              }}
              sx={{ flex: 1, minWidth: '200px' }}
            />
            <Button
              variant="contained"
              onClick={() => handleOutfitSearch(outfitSearchQuery)}
              startIcon={<i className="tabler-search" />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('tryOn.wardrobe.search.button') || 'Search'}
            </Button>
            {/* <Button
              variant="outlined"
              onClick={() => handleOutfitSearch('')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('tryOn.wardrobe.search.clear') || 'Clear'}
            </Button> */}
            <Button
              variant={outfitIsFavoriteOnly ? 'contained' : 'outlined'}
              color={outfitIsFavoriteOnly ? 'error' : 'inherit'}
              startIcon={<i className={outfitIsFavoriteOnly ? 'tabler-heart-filled' : 'tabler-heart'} />}
              onClick={handleOutfitFavoriteFilterToggle}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('tryOn.wardrobe.favorites') || 'Favorites'}
            </Button>
          </Box>

          <OutfitsTab
            outfits={filteredOutfits}
            loading={outfitsLoading}
            page={outfitsPage}
            totalPages={outfitsTotalPages}
            onPageChange={fetchOutfits}
            onOutfitClick={handleOutfitCardClick}
            onToggleFavorite={handleToggleOutfitFavorite}
            onCreateOutfit={handleCreateOutfit}
          />
        </>
      )}

      {activeTab === 'boards' && (
        <BoardsTab
          boards={filteredBoards}
          historyBoard={historyBoard}
          onBoardClick={(boardId) => {
            router.push(`/${lang}/wardrobe/${boardId}`)
          }}
          onBoardEdit={handleEditBoard}
          onCreateBoard={handleCreateBoardClick}
          onHistoryBoardClick={() => {
            router.push(`/${lang}/wardrobe/history`)
          }}
          getTimeAgo={getTimeAgo}
        />
      )}

      {activeTab === 'suggestion' && (
        <SuggestionTab userId={userId} />
      )}

      {/* Modals */}
      <CreateBoardModal
        open={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onSuccess={handleBoardCreated}
      />

      {selectedBoard && (
        <EditBoardModal
          open={showEditBoardModal}
          onClose={() => {
            setShowEditBoardModal(false)
            setSelectedBoard(null)
          }}
          onSuccess={handleBoardCreated}
          board={selectedBoard}
        />
      )}

      {selectedItem && (
        <EditItemModal
          item={selectedItem}
          open={showEditItemModal}
          onClose={() => {
            setShowEditItemModal(false)
            setSelectedItem(null)
          }}
          onUpdate={async () => {
            await fetchItems(itemsPage)
          }}
        />
      )}

      {selectedOutfit && (
        <>
          <OutfitDetailModal
            open={showOutfitModal}
            loading={outfitDetailLoading}
            onClose={() => {
              setShowOutfitModal(false)
              setSelectedOutfit(null)
            }}
            outfit={selectedOutfit}
            onDeleteSuccess={async () => {
              await fetchOutfits(outfitsPage)
            }}
            onEditClick={handleEditOutfit}
          />
          <EditOutfitModal
            outfit={selectedOutfit}
            open={showEditOutfitModal}
            onClose={() => {
              setShowEditOutfitModal(false)
            }}
            onUpdate={async () => {
              await fetchOutfits(outfitsPage)
              // Refresh outfit detail if we want to go back to detail modal
              if (selectedOutfit) {
                const detail = await wardrobeService.getOutfit(selectedOutfit.id)
                setSelectedOutfit(detail)
              }
            }}
          />
        </>
      )}
    </Box>
  )
}

export default WardrobeView
