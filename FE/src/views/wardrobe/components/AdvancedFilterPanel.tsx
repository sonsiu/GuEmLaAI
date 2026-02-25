'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Badge from '@mui/material/Badge'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { loadItemData, getColorDisplayName } from '@/utils/itemData'
import type { WardrobeFilters } from '@/types/wardrobe.filter'
import { FILTER_DEFAULTS, getActiveFilterCount } from '@/types/wardrobe.filter'

interface AdvancedFilterPanelProps {
  filters: WardrobeFilters
  onFiltersChange: (filters: WardrobeFilters) => void
  onApplyFilters: (filters: WardrobeFilters) => void
  onReset: () => void
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onReset
}) => {
  const theme = useTheme()
  const { t, lang } = useTranslation()
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('category')
  const [isExpanded, setIsExpanded] = useState(false)
  const [tempSearch, setTempSearch] = useState(filters.searchQuery || '')
  const [itemData, setItemData] = useState<any>(null)

  // Load item data for color localization
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadItemData()
        setItemData(data)
      } catch (error) {
        // console.error('Failed to load item data:', error)
      }
    }
    loadData()
  }, [])

  // Helper functions for localized labels
  const getColorLabel = (color: string) => {
    if (!itemData) return color
    return getColorDisplayName(itemData, color, lang)
  }

  const getSeasonLabel = (season: string) => t(`tryOn.wardrobe.addItem.seasons.${season}`) || season

  const getOccasionLabel = (occasion: string) => t(`tryOn.wardrobe.addItem.occasions.${occasion}`) || occasion

  const handleCategoryChange = (event: any) => {
    const value = event.target.value
    onFiltersChange({
      ...filters,
      category: value === '' ? undefined : value
    })
  }

  const handleColorsChange = (color: string) => {
    const currentColors = filters.colors || []
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color]
    
    onFiltersChange({
      ...filters,
      colors: newColors.length > 0 ? newColors : undefined
    })
  }

  const handleOccasionsChange = (occasion: string) => {
    const currentOccasions = filters.occasions || []
    const newOccasions = currentOccasions.includes(occasion)
      ? currentOccasions.filter(o => o !== occasion)
      : [...currentOccasions, occasion]
    
    onFiltersChange({
      ...filters,
      occasions: newOccasions.length > 0 ? newOccasions : undefined
    })
  }

  const handleSizesChange = (size: string) => {
    const currentSizes = filters.sizes || []
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size]
    
    onFiltersChange({
      ...filters,
      sizes: newSizes.length > 0 ? newSizes : undefined
    })
  }

  const handleSeasonsChange = (season: string) => {
    const currentSeasons = filters.seasons || []
    const newSeasons = currentSeasons.includes(season)
      ? currentSeasons.filter(s => s !== season)
      : [...currentSeasons, season]
    
    onFiltersChange({
      ...filters,
      seasons: newSeasons.length > 0 ? newSeasons : undefined
    })
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    // console.log('✏️ [AdvancedFilterPanel] Search field changed:', value)
    setTempSearch(value)
  }

  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleApplyFilters()
    }
  }

  const handleApplyFilters = () => {
    const newFilters = {
      ...filters,
      searchQuery: tempSearch === '' ? undefined : tempSearch
    }
    
    // console.log('🔍 [AdvancedFilterPanel] handleApplyFilters called')
    // console.log('📝 [AdvancedFilterPanel] tempSearch value:', tempSearch)
    // console.log('🎯 [AdvancedFilterPanel] Full filters object:', newFilters)
    
    onFiltersChange(newFilters)
    onApplyFilters(newFilters)
  }

  const handleReset = () => {
    setTempSearch('')
    onReset()
    setIsExpanded(false)
  }

  const activeFilterCount = getActiveFilterCount(filters)
  const isDarkMode = theme.palette.mode === 'dark'

  return (
    <>
      {/* Toggle Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant={isExpanded ? 'contained' : 'outlined'}
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={<i className="tabler-filter" />}
          sx={{ textTransform: 'none' }}
        >
          Filters
          {activeFilterCount > 0 && (
            <Badge
              badgeContent={activeFilterCount}
              color="primary"
              sx={{ ml: 1.5 }}
            />
          )}
        </Button>
      </Box>

      {/* Filter Panel - Collapsible */}
      {isExpanded && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${theme.palette.divider}`,
            mb: 3
          }}
        >
          {/* Header with reset button */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Advanced Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleReset}
                sx={{ textTransform: 'none' }}
              >
                Reset All
              </Button>
            )}
          </Stack>

          {/* Search Input with Submit */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name..."
              value={tempSearch}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <i className="tabler-search" style={{ marginRight: 8, fontSize: 18 }} />
                )
              }}
            />
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              sx={{ textTransform: 'none', minWidth: 100 }}
            >
              Search
            </Button>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Category Filter */}
          <Accordion
            expanded={expandedAccordion === 'category'}
            onChange={() =>
              setExpandedAccordion(expandedAccordion === 'category' ? false : 'category')
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Category
              </Typography>
              {filters.category && (
                <Chip label={filters.category} size="small" sx={{ mr: 1 }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.category || ''}
                  onChange={handleCategoryChange}
                  displayEmpty
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {FILTER_DEFAULTS.CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          {/* Colors Filter - As Tags */}
          <Accordion
            expanded={expandedAccordion === 'colors'}
            onChange={() =>
              setExpandedAccordion(expandedAccordion === 'colors' ? false : 'colors')
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Colors
              </Typography>
              {filters.colors && filters.colors.length > 0 && (
                <Chip label={`+${filters.colors.length}`} size="small" sx={{ mr: 1 }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {FILTER_DEFAULTS.COLORS.map((color) => (
                  <Chip
                    key={color}
                    label={getColorLabel(color)}
                    onClick={() => handleColorsChange(color)}
                    onDelete={
                      filters.colors?.includes(color) ? () => handleColorsChange(color) : undefined
                    }
                    variant={filters.colors?.includes(color) ? 'filled' : 'outlined'}
                    color={filters.colors?.includes(color) ? 'primary' : 'default'}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: filters.colors?.includes(color) ? 600 : 400
                    }}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Sizes Filter */}
          <Accordion
            expanded={expandedAccordion === 'sizes'}
            onChange={() =>
              setExpandedAccordion(expandedAccordion === 'sizes' ? false : 'sizes')
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Sizes
              </Typography>
              {filters.sizes && filters.sizes.length > 0 && (
                <Chip label={`+${filters.sizes.length}`} size="small" sx={{ mr: 1 }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  {FILTER_DEFAULTS.SIZES.map((size) => (
                    <FormControlLabel
                      key={size}
                      control={
                        <Checkbox
                          checked={filters.sizes?.includes(size) || false}
                          onChange={() => handleSizesChange(size)}
                          size="small"
                        />
                      }
                      label={size}
                      sx={{ minWidth: '80px' }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Seasons Filter */}
          <Accordion
            expanded={expandedAccordion === 'seasons'}
            onChange={() =>
              setExpandedAccordion(expandedAccordion === 'seasons' ? false : 'seasons')
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Seasons
              </Typography>
              {filters.seasons && filters.seasons.length > 0 && (
                <Chip label={`+${filters.seasons.length}`} size="small" sx={{ mr: 1 }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  {FILTER_DEFAULTS.SEASONS.map((season) => (
                    <FormControlLabel
                      key={season}
                      control={
                        <Checkbox
                          checked={filters.seasons?.includes(season) || false}
                          onChange={() => handleSeasonsChange(season)}
                          size="small"
                        />
                      }
                      label={getSeasonLabel(season)}
                      sx={{ minWidth: '120px' }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Occasions Filter - As Tags */}
          <Accordion
            expanded={expandedAccordion === 'occasions'}
            onChange={() =>
              setExpandedAccordion(expandedAccordion === 'occasions' ? false : 'occasions')
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                Occasions
              </Typography>
              {filters.occasions && filters.occasions.length > 0 && (
                <Chip label={`+${filters.occasions.length}`} size="small" sx={{ mr: 1 }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {FILTER_DEFAULTS.OCCASIONS.map((occasion) => (
                  <Chip
                    key={occasion}
                    label={getOccasionLabel(occasion)}
                    onClick={() => handleOccasionsChange(occasion)}
                    onDelete={
                      filters.occasions?.includes(occasion) ? () => handleOccasionsChange(occasion) : undefined
                    }
                    variant={filters.occasions?.includes(occasion) ? 'filled' : 'outlined'}
                    color={filters.occasions?.includes(occasion) ? 'primary' : 'default'}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: filters.occasions?.includes(occasion) ? 600 : 400
                    }}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </>
  )
}

export default AdvancedFilterPanel
