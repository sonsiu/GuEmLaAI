'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import MenuList from '@mui/material/MenuList'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { showErrorToast } from '@/services/toast.service'

type SizeData = {
  clothing: string[]
  footwear: string[]
  freeSize: string[]
}

interface CategoryData {
  name: string
  subcategories: { name: string; name_vn?: string; category_code: string }[]
}

interface SaveItemModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    categoryCode: string
    size: string
    sizes: string[]
    itemName: string
    description: string
    colors: string[]
    seasons: string[]
    occasions: string[]
  }) => void
  imageUrl: string
  categoryData: CategoryData[]
  sizeData: SizeData
  colorData: string[]
  seasonData: string[]
  occasionData: string[]
  getColorHex: (colorName: string) => string
  getColorDisplayName: (colorName: string) => string
  getCategoryVietnameseName: (categoryCode: string) => string
  initialValues?: {
    itemName?: string
    description?: string
    categoryCode?: string
    size?: string
    sizes?: string[]
    colors?: string[]
    seasons?: string[]
    occasions?: string[]
  }
}

const SaveItemModal: React.FC<SaveItemModalProps> = ({
  open,
  onClose,
  onSave,
  imageUrl,
  categoryData,
  sizeData,
  colorData,
  seasonData,
  occasionData,
  getColorHex,
  getColorDisplayName,
  getCategoryVietnameseName,
  initialValues
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [itemName, setItemName] = useState(initialValues?.itemName || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(initialValues?.categoryCode || '')
  const [selectedMainCategory, setSelectedMainCategory] = useState('')
  const [selectedCategoryDisplay, setSelectedCategoryDisplay] = useState('')
  const [aiMainCategory, setAiMainCategory] = useState('')
  const [pendingMainCategory, setPendingMainCategory] = useState<string | null>(null)
  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false)
  const [selectedSize, setSelectedSize] = useState(initialValues?.size || '')
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialValues?.sizes || [])
  const [selectedColors, setSelectedColors] = useState<string[]>(initialValues?.colors || [])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialValues?.seasons || [])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(initialValues?.occasions || [])
  const [isSaving, setIsSaving] = useState(false)
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null)
  const [availableSizes, setAvailableSizes] = useState<string[]>(sizeData.clothing || [])

  // Update state when initialValues change (e.g., when AI returns data)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.itemName) setItemName(initialValues.itemName)
      if (initialValues.description) setDescription(initialValues.description)
      if (initialValues.categoryCode) setSelectedCategoryCode(initialValues.categoryCode)
      if (initialValues.size) setSelectedSize(initialValues.size)
      if (initialValues.sizes) setSelectedSizes(initialValues.sizes)
      if (initialValues.colors) setSelectedColors(initialValues.colors)
      if (initialValues.seasons) setSelectedSeasons(initialValues.seasons)
      if (initialValues.occasions) setSelectedOccasions(initialValues.occasions)
    }
  }, [initialValues])

  // Update selectedCategoryDisplay when selectedCategoryCode changes
  useEffect(() => {
    if (selectedCategoryCode) {
      // Map subcategory code back to its top-level bucket
      const mainCategory = categoryData.find(cat =>
        cat.subcategories.some(sub => sub.category_code === selectedCategoryCode)
      )
      setSelectedMainCategory(mainCategory?.name || '')
      const vietnameseName = getCategoryVietnameseName(selectedCategoryCode)
      setSelectedCategoryDisplay(mainCategory?.name || vietnameseName)
    }
  }, [selectedCategoryCode, getCategoryVietnameseName, categoryData])

  // Capture the AI-suggested main category once (from initial values).
  useEffect(() => {
    if (!aiMainCategory && initialValues?.categoryCode) {
      const mainCategory = categoryData.find(cat =>
        cat.subcategories.some(sub => sub.category_code === initialValues.categoryCode)
      )
      if (mainCategory?.name) {
        setAiMainCategory(mainCategory.name)
      }
    }
  }, [aiMainCategory, initialValues?.categoryCode, categoryData])

  const resolveSizeOptions = (categoryName: string) => {
    const normalized = categoryName.trim().toLowerCase()
    if (normalized === 'footwear') return sizeData.footwear || []
    if (normalized === 'bag' || normalized === 'accessory') return sizeData.freeSize || []
    return sizeData.clothing || []
  }

  useEffect(() => {
    const categoryName = selectedMainCategory || aiMainCategory || ''
    const sizesForCategory = resolveSizeOptions(categoryName)
    setAvailableSizes(sizesForCategory)

    if (selectedSize && !sizesForCategory.includes(selectedSize)) {
      setSelectedSize('')
    }

    if (selectedSizes.length > 0) {
      const filteredSizes = selectedSizes.filter(size => sizesForCategory.includes(size))
      if (filteredSizes.length !== selectedSizes.length) {
        setSelectedSizes(filteredSizes)
      }
    }
  }, [selectedMainCategory, aiMainCategory, sizeData, selectedSize, selectedSizes])

  const handleClose = () => {
    if (!isSaving) {
      setItemName('')
      setDescription('')
      setSelectedCategoryCode('')
      setSelectedCategoryDisplay('')
      setSelectedSize('')
      setSelectedSizes([])
      setSelectedColors([])
      setSelectedSeasons([])
      setSelectedOccasions([])
      setAvailableSizes(sizeData.clothing || [])
      setCategoryMenuAnchor(null)
      onClose()
    }
  }

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryMenuAnchor(event.currentTarget)
  }

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null)
  }

  // Only expose top-level categories in the dropdown.
  const handleMainCategorySelect = (categoryName: string) => {
    // If user chooses a different top-level than AI suggestion, ask to confirm.
    if (aiMainCategory && categoryName !== aiMainCategory) {
      setPendingMainCategory(categoryName)
      setShowCategoryConfirm(true)
      return
    }
    applyMainCategory(categoryName, true)
  }

  const applyMainCategory = (categoryName: string, updateCode: boolean) => {
    setSelectedMainCategory(categoryName)
    setSelectedCategoryDisplay(categoryName)

    if (updateCode) {
      // Keep using a valid subcategory code under this main category (first item).
      const sub = categoryData
        .find(cat => cat.name === categoryName)
        ?.subcategories?.[0]

      if (sub?.category_code) {
        setSelectedCategoryCode(sub.category_code)
        const vietnameseName = getCategoryVietnameseName(sub.category_code)

        // Auto-fill item name if empty
        if (!itemName.trim()) {
          setItemName(vietnameseName)
        }
      }
    }

    handleCategoryMenuClose()
  }

  const removeColor = (color: string) => {
    setSelectedColors(prev => prev.filter(c => c !== color))
  }

  const removeSeason = (season: string) => {
    setSelectedSeasons(prev => prev.filter(s => s !== season))
  }

  const removeOccasion = (occasion: string) => {
    setSelectedOccasions(prev => prev.filter(o => o !== occasion))
  }

  const getOccasionLabel = (occasion: string) => t(`tryOn.wardrobe.addItem.occasions.${occasion}`) || occasion

  const getSeasonLabel = (season: string) => t(`tryOn.wardrobe.addItem.seasons.${season}`) || season

  // Resolve a human-readable name for the currently selected subcategory code
  const getSelectedCategoryName = () => {
    if (!selectedCategoryCode) return ''
    const match = categoryData
      .flatMap(cat => cat.subcategories)
      .find(sub => sub.category_code === selectedCategoryCode)
    return match?.name_vn || match?.name || selectedCategoryCode
  }

  const handleSave = async () => {
    // GuEmLaAI validation: category, name, colors, seasons, occasions are required
    if (
      !selectedCategoryCode ||
      !selectedSize ||
      !itemName.trim() ||
      selectedColors.length === 0 ||
      selectedSeasons.length === 0 ||
      selectedOccasions.length === 0
    ) {
      showErrorToast(
        t('tryOn.wardrobe.addItem.saveModal.validationError') ||
        'Please fill in all required fields (Category, Name, Colors, Seasons, and Occasions)'
      )
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        categoryCode: selectedCategoryCode,
        size: selectedSize,
        sizes: selectedSizes,
        itemName: itemName.trim(),
        description: description.trim() || itemName.trim(), // Use itemName as fallback
        colors: selectedColors, 
        seasons: selectedSeasons,
        occasions: selectedOccasions
      })
    } finally {
      setIsSaving(false)
    }
  }

  const canSave =
    selectedCategoryCode &&
    selectedSize &&
    itemName.trim() &&
    selectedColors.length > 0 &&
    selectedSeasons.length > 0 &&
    selectedOccasions.length > 0

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('tryOn.wardrobe.addItem.saveModal.title') || 'Add Item'}</span>
            <IconButton onClick={handleClose} size='small' disabled={isSaving}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Image Preview */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                component='img'
                src={imageUrl}
                alt='Preview'
                sx={{
                  width: { xs: 128, sm: 160, md: 192 },
                  height: { xs: 128, sm: 160, md: 192 },
                  objectFit: 'contain',
                  borderRadius: 2,
                  border: 2,
                  borderColor: 'divider'
                }}
              />
            </Box>

            {/* Name Input */}
            <TextField
              label={t('tryOn.wardrobe.addItem.saveModal.name') || 'Name'}
              required
              fullWidth
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder={t('tryOn.wardrobe.addItem.saveModal.namePlaceholder') || 'Enter item name...'}
              helperText={itemName ? `${itemName.length} characters` : ''}
            />

            {/* Description Input - Hidden from user but value still passed to API */}
            <TextField
              label={t('tryOn.wardrobe.addItem.saveModal.description') || 'Description'}
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('tryOn.wardrobe.addItem.saveModal.descriptionPlaceholder') || 'Enter item description...'}
              helperText={description ? `${description.length} characters` : ''}
              sx={{ display: 'none' }}
            />

            {/* Category Selection - show only top-level categories */}
            <FormControl fullWidth required>
              <InputLabel>{t('tryOn.wardrobe.addItem.saveModal.category') || 'Category'}</InputLabel>
              <Select
                value={selectedMainCategory || ''}
                onClick={handleCategoryMenuOpen}
                label={t('tryOn.wardrobe.addItem.saveModal.category') || 'Category'}
                renderValue={() =>
                  selectedCategoryDisplay || t('tryOn.wardrobe.addItem.saveModal.selectCategory') || 'Select category...'
                }
                open={false}
                MenuProps={{
                  anchorEl: categoryMenuAnchor,
                  open: Boolean(categoryMenuAnchor),
                  onClose: handleCategoryMenuClose,
                  PaperProps: {
                    sx: {
                      maxHeight: '30vh',
                      width: 'auto',
                      minWidth: 250
                    }
                  },
                  MenuListProps: {
                    sx: {
                      maxHeight: '30vh',
                      overflow: 'auto'
                    }
                  }
                }}
              />
              <Menu
                anchorEl={categoryMenuAnchor}
                open={Boolean(categoryMenuAnchor)}
                onClose={handleCategoryMenuClose}
                PaperProps={{
                  sx: {
                    maxHeight: '30vh',
                    width: 'auto',
                    minWidth: 250
                  }
                }}
              >
                <MenuList sx={{ maxHeight: '30vh', overflow: 'auto' }}>
                  {categoryData.map(category => (
                    <MenuItem
                      key={category.name}
                      onClick={() => handleMainCategorySelect(category.name)}
                      selected={selectedMainCategory === category.name}
                    >
                      <Typography variant='body2'>{category.name}</Typography>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              {/* Keep subcategory code hidden but carried through on save */}
              <input type='hidden' value={selectedCategoryCode} readOnly />
              <Typography variant='caption' color='text.secondary' sx={{ mt: 1 }}>
                {(t('tryOn.wardrobe.addItem.saveModal.categoryHint') ||
                  'Selected subcategory:') +
                  ' ' +
                  (getSelectedCategoryName() || selectedCategoryCode || 'Not set')}
              </Typography>
            </FormControl>

            {/* Size Selection */}
            <FormControl fullWidth required>
              <InputLabel>{t('tryOn.wardrobe.addItem.saveModal.size') || 'Size'}</InputLabel>
              <Select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                label={t('tryOn.wardrobe.addItem.saveModal.size') || 'Size'}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: '30vh'
                    }
                  },
                  MenuListProps: {
                    sx: {
                      maxHeight: '30vh',
                      overflow: 'auto'
                    }
                  }
                }}
              >
                {availableSizes.map(size => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Color Selection */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                {t('tryOn.wardrobe.addItem.saveModal.colors') || 'Colors (Optional)'}
              </Typography>
              {selectedColors.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedColors.map(color => (
                    <Chip
                      key={color}
                      label={getColorDisplayName(color)}
                      onDelete={() => removeColor(color)}
                      size='small'
                      sx={{
                        border: 2,
                        borderColor: getColorHex(color),
                        bgcolor: 'transparent',
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            color: theme.palette.text.primary
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
              <FormControl fullWidth>
                <Select
                  multiple
                  value={selectedColors}
                  onChange={e => {
                    const value = e.target.value as string[]

                    setSelectedColors(value)
                  }}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip
                          key={value}
                          label={getColorDisplayName(value)}
                          size='small'
                          sx={{
                            border: 2,
                            borderColor: getColorHex(value),
                            bgcolor: 'transparent',
                            color: theme.palette.text.primary,
                            fontWeight: 600
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '30vh'
                      }
                    },
                    MenuListProps: {
                      sx: {
                        maxHeight: '30vh',
                        overflow: 'auto'
                      }
                    }
                  }}
                >
                  {colorData.map(color => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: getColorHex(color) === 'transparent' ? 'grey.300' : getColorHex(color),
                            border: 1,
                            borderColor: 'divider'
                          }}
                        />
                        <span>{getColorDisplayName(color)}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Season Selection */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                {t('tryOn.wardrobe.addItem.saveModal.seasons') || 'Seasons (Optional)'}
              </Typography>
              {selectedSeasons.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedSeasons.map(season => (
                    <Chip
                      key={season}
                      label={getSeasonLabel(season)}
                      onDelete={() => removeSeason(season)}
                      size='small'
                      color='success'
                      variant='outlined'
                    />
                  ))}
                </Box>
              )}
              <FormControl fullWidth>
                <Select
                  multiple
                  value={selectedSeasons}
                  onChange={e => {
                    const value = e.target.value as string[]

                    setSelectedSeasons(value)
                  }}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={getSeasonLabel(value)} size='small' color='success' variant='outlined' />
                      ))}
                    </Box>
                  )}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '30vh'
                      }
                    },
                    MenuListProps: {
                      sx: {
                        maxHeight: '30vh',
                        overflow: 'auto'
                      }
                    }
                  }}
                >
                  {seasonData.map(season => (
                    <MenuItem key={season} value={season}>
                      {getSeasonLabel(season)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Occasion Selection */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                {t('tryOn.wardrobe.addItem.saveModal.occasions') || 'Occasions *'}
              </Typography>
              {selectedOccasions.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedOccasions.map(occasion => (
                    <Chip
                      key={occasion}
                      label={getOccasionLabel(occasion)}
                      onDelete={() => removeOccasion(occasion)}
                      size='small'
                      color='warning'
                      variant='outlined'
                    />
                  ))}
                </Box>
              )}
              <FormControl fullWidth required>
                <Select
                  multiple
                  value={selectedOccasions}
                  onChange={e => {
                    const value = e.target.value as string[]
                    setSelectedOccasions(value)
                  }}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip
                          key={value}
                          label={getOccasionLabel(value)}
                          size='small'
                          color='warning'
                          variant='outlined'
                        />
                      ))}
                    </Box>
                  )}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '30vh'
                      }
                    },
                    MenuListProps: {
                      sx: {
                        maxHeight: '30vh',
                        overflow: 'auto'
                      }
                    }
                  }}
                >
                  {occasionData.map(occasion => (
                    <MenuItem key={occasion} value={occasion}>
                      {getOccasionLabel(occasion)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSaving}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={!canSave || isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <i className='tabler-device-floppy' />}
          >
            {isSaving
              ? t('tryOn.wardrobe.addItem.saveModal.saving') || 'Saving...'
              : t('tryOn.wardrobe.addItem.saveModal.save') || 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showCategoryConfirm}
        onClose={() => {
          setShowCategoryConfirm(false)
          setPendingMainCategory(null)
        }}
      >
        <DialogTitle>
          {t('tryOn.wardrobe.addItem.saveModal.categoryConfirmTitle') || 'Confirm category?'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            {t('tryOn.wardrobe.addItem.saveModal.categoryConfirm') ||
              'You selected a different category than suggested. Do you want to change it?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCategoryConfirm(false)
              setPendingMainCategory(null)
            }}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            variant='contained'
            onClick={() => {
              if (pendingMainCategory) {
                // User confirmed changing the visible top-level category only.
                applyMainCategory(pendingMainCategory, false)
              }
              setShowCategoryConfirm(false)
              setPendingMainCategory(null)
            }}
          >
            {t('tryOn.wardrobe.addItem.saveModal.categoryConfirmAction') || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SaveItemModal
