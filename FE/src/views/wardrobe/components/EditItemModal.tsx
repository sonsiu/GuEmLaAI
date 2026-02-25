'use client'

import React, { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import {
  loadItemData,
  flattenCategoryData,
  getColorHex,
  getColorDisplayName,
  getCategoryVietnameseName
} from '@/utils/itemData'
import type { WardrobeItem } from '@/types/wardrobe.type'

type SizeData = {
  clothing: string[]
  footwear: string[]
  freeSize: string[]
}

interface EditItemModalProps {
  item: WardrobeItem
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, open, onClose, onUpdate }) => {
  const theme = useTheme()
  const { t, lang } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

  // Item data state
  const [itemData, setItemData] = useState<any>(null)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [colorData, setColorData] = useState<string[]>([])
  const [sizeData, setSizeData] = useState<SizeData>({
    clothing: [],
    footwear: [],
    freeSize: []
  })
  const [seasonData, setSeasonData] = useState<string[]>([])
  const [occasionData, setOccasionData] = useState<string[]>([])

  // Form states
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('')
  const [selectedSubCategoryVn, setSelectedSubCategoryVn] = useState('')
  const [itemName, setItemName] = useState(item.comment || '')
  const [description, setDescription] = useState(item.description || '')
  const [selectedSize, setSelectedSize] = useState(item.size || '')
  const [selectedColors, setSelectedColors] = useState<string[]>(item.itemColors || [])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(item.itemSeasons || [])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(item.itemOccasions || [])
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)

  // Load item data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadItemData()
        setItemData(data)
        setCategoryData(flattenCategoryData(data))
        setColorData(data.colors.map((c: any) => c.name))
        setSizeData({
          clothing: data.sizes?.clothing || [],
          footwear: data.sizes?.footwear || [],
          freeSize: data.sizes?.freeSize || []
        })
        setSeasonData(data.seasons)
        setOccasionData(data.occasions || [])
      } catch (error) {
        // console.error('Failed to load item data:', error)
        showErrorToast(t('tryOn.wardrobe.addItem.errors.loadDataFailed') || 'Failed to load item data')
      }
    }
    loadData()
  }, [t])

  // Initialize category based on item.categoryName
  useEffect(() => {
    if (!itemData || !item.categoryName) return

    const categoryCode = item.categoryName
    const category = categoryData.find((cat) =>
      cat.subcategories.some((sub: any) => sub.category_code === categoryCode)
    )

    if (category) {
      setSelectedCategory(category.name)
      setExpandedCategories([category.name])

      const subcategory = category.subcategories.find(
        (sub: any) => sub.category_code === categoryCode
      )
      if (subcategory) {
        const vietnameseName = getCategoryVietnameseName(itemData, categoryCode)
        setSelectedSubCategoryVn(vietnameseName)
        setSelectedSubCategory(subcategory.name)
        setSelectedCategoryCode(categoryCode)
      }
    }
  }, [itemData, categoryData, item.categoryName])

  const resolveSizeOptions = (categoryName: string) => {
    const normalized = categoryName.trim().toLowerCase()
    if (normalized === 'footwear') return sizeData.footwear || []
    if (normalized === 'bag' || normalized === 'accessory') return sizeData.freeSize || []
    return sizeData.clothing || []
  }

  useEffect(() => {
    let sizesForCategory = resolveSizeOptions(selectedCategory)
    if (selectedSize && !sizesForCategory.includes(selectedSize)) {
      sizesForCategory = [...sizesForCategory, selectedSize]
    }
    setAvailableSizes(sizesForCategory)
  }, [selectedCategory, sizeData, selectedSize])

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  // Handle category selection
  const handleCategorySelect = (
    categoryName: string,
    subcategory: string,
    categoryCode: string,
    subcategoryVn: string
  ) => {
    setSelectedCategory(categoryName)
    setSelectedSubCategory(subcategory)
    setSelectedCategoryCode(categoryCode)
    const displayName = lang === 'vi' ? subcategoryVn : subcategory
    setItemName(displayName)
    setSelectedSubCategoryVn(subcategoryVn)
  }

  // Color handlers
  const toggleColorSelection = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    )
  }

  const removeColor = (color: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== color))
  }

  // Season handlers
  const toggleSeasonSelection = (season: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    )
  }

  const removeSeason = (season: string) => {
    setSelectedSeasons((prev) => prev.filter((s) => s !== season))
  }

  // Occasion handlers
  const toggleOccasionSelection = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    )
  }

  const removeOccasion = (occasion: string) => {
    setSelectedOccasions((prev) => prev.filter((o) => o !== occasion))
  }

  const getSeasonLabel = (season: string) => t(`tryOn.wardrobe.addItem.seasons.${season}`) || season

  const getOccasionLabel = (occasion: string) => t(`tryOn.wardrobe.addItem.occasions.${occasion}`) || occasion

  // Handle update
  const handleUpdate = async () => {
    if (!selectedCategoryCode || !selectedSize || !itemName.trim()) {
      showErrorToast(
        t('tryOn.wardrobe.addItem.errors.fillRequiredFields') ||
        'Please fill in all required fields (Category, Size, and Name)'
      )
      return
    }

    setIsSaving(true)

    try {
      await wardrobeService.updateItem(item.id, {
        categoryName: selectedCategoryCode,
        size: selectedSize,
        isFavorite,
        itemName: itemName.trim(),
        description: description.trim() || undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        seasons: selectedSeasons.length > 0 ? selectedSeasons : undefined,
        occasions: selectedOccasions.length > 0 ? selectedOccasions : undefined
      })

      showSuccessToast(t('tryOn.wardrobe.editItem.success') || 'Item updated successfully!')
      onUpdate()
      onClose()
    } catch (error) {
      // console.error('Error updating item:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('tryOn.wardrobe.editItem.errors.updateFailed') || 'Failed to update item'
      showErrorToast(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await wardrobeService.deleteItem(item.id)
      showSuccessToast(t('tryOn.wardrobe.editItem.successDelete') || 'Item deleted successfully!')
      onUpdate()
      onClose()
    } catch (error) {
      // console.error('Error deleting item:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('tryOn.wardrobe.editItem.errors.deleteFailed') || 'Failed to delete item'
      showErrorToast(errorMessage)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h6"
            component="span"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700
            }}
          >
            {t('tryOn.wardrobe.editItem.title') || 'Edit Item'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <i className="tabler-x" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Item Preview */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <Box
            sx={{ position: 'relative', cursor: 'zoom-in' }}
            onMouseEnter={() => setShowImagePreview(true)}
            onMouseLeave={() => setShowImagePreview(false)}
          >
            <Box
              component="img"
              src={item.imageUrl || '/placeholder.png'}
              alt={item.categoryName}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                if (target.src && !target.src.includes('/placeholder.png')) {
                  target.src = '/placeholder.png'
                }
              }}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                borderRadius: 1,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)'
              }}
            />
            {/* Enlarged Preview on Hover */}
            {showImagePreview && (
              <Box
                sx={{
                  position: 'fixed',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  boxShadow: 24,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  border: 2,
                  borderColor: 'primary.main'
                }}
              >
                <Box
                  component="img"
                  src={item.imageUrl || '/placeholder.png'}
                  alt={item.categoryName}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src && !target.src.includes('/placeholder.png')) {
                      target.src = '/placeholder.png'
                    }
                  }}
                  sx={{
                    maxWidth: '500px',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              {itemData
                ? getCategoryVietnameseName(itemData, item.categoryName)
                : item.categoryName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500
              }}
            >
              {t('tryOn.wardrobe.editItem.itemId') || 'Item ID'}: {item.id}
            </Typography>
          </Box>
        </Box>

        {/* Favorite Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i
                className="tabler-heart"
                style={{
                  color: isFavorite ? theme.palette.error.main : 'inherit',
                  fill: isFavorite ? theme.palette.error.main : 'none'
                }}
              />
              <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {t('tryOn.wardrobe.editItem.markAsFavorite') || 'Mark as Favorite'}
              </span>
            </Box>
          }
          sx={{ mb: 3 }}
        />

        {/* Name Field */}
        <TextField
          fullWidth
          label={t('tryOn.wardrobe.addItem.saveModal.itemName') || 'Item Name'}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
          sx={{ mb: 3 }}
          helperText={`${itemName.length}/100`}
        />

        {/* Description Field */}
        <TextField
          fullWidth
          label={t('tryOn.wardrobe.addItem.saveModal.description') || 'Description'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          sx={{ display: 'none' }}
          placeholder={t('tryOn.wardrobe.addItem.saveModal.descriptionPlaceholder') || 'Enter item description...'}
          helperText={description ? `${description.length} characters` : ''}
          
        />

        {/* Category Selection */}
        {itemData && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600
              }}
            >
              {t('tryOn.wardrobe.addItem.saveModal.category') || 'Category'} *
            </Typography>
            <List
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                maxHeight: 300,
                overflow: 'auto'
              }}
            >
              {categoryData.map((category) => {
                const isExpanded = expandedCategories.includes(category.name)

                return (
                  <React.Fragment key={category.name}>
                    <ListItemButton
                      onClick={() => toggleCategoryExpansion(category.name)}
                      sx={{
                        pl: 3,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover
                        }
                      }}
                    >
                      <ListItemText
                        primary={category.name}
                        primaryTypographyProps={{
                          sx: {
                            color: theme.palette.text.primary,
                            fontWeight: 600
                          }
                        }}
                      />
                      <i className={`tabler-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: theme.palette.text.primary }} />
                    </ListItemButton>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {category.subcategories.map((subcategory: any) => (
                          <ListItemButton
                            key={subcategory.category_code}
                            selected={selectedCategoryCode === subcategory.category_code}
                            onClick={() =>
                              handleCategorySelect(
                                category.name,
                                subcategory.name,
                                subcategory.category_code,
                                subcategory.name_vn || subcategory.name
                              )
                            }
                            sx={{
                              pl: 6,
                              py: 0.5,
                              minHeight: '36px',
                              '&:hover': {
                                bgcolor: theme.palette.action.hover
                              },
                              '&.Mui-selected': {
                                bgcolor: theme.palette.primary.main + '20',
                                '&:hover': {
                                  bgcolor: theme.palette.primary.main + '30'
                                }
                              }
                            }}
                          >
                            <ListItemText
                              primary={lang === 'vi' ? (subcategory.name_vn || subcategory.name) : subcategory.name}
                              primaryTypographyProps={{
                                sx: {
                                  color: theme.palette.text.secondary,
                                  fontWeight: 400,
                                  fontSize: '0.875rem'
                                }
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                )
              })}
            </List>
            {selectedSubCategoryVn && (
              <Typography
                variant="caption"
                color="primary"
                sx={{
                  mt: 1,
                  display: 'block',
                  fontWeight: 600
                }}
              >
                {t('tryOn.wardrobe.addItem.saveModal.selected') || 'Selected'}:{' '}
                {selectedSubCategoryVn}
              </Typography>
            )}
          </Box>
        )}

        {/* Size Selection */}
        {itemData && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {t('tryOn.wardrobe.addItem.saveModal.size') || 'Size'}
            </InputLabel>
            <Select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              label={t('tryOn.wardrobe.addItem.saveModal.size') || 'Size'}
              required
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }}
            >
              {availableSizes.map((size) => (
                <MenuItem
                  key={size}
                  value={size}
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Color Selection */}
        {itemData && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {t('tryOn.wardrobe.addItem.saveModal.colors') || 'Colors (Optional)'}
            </InputLabel>
            <Select
              multiple
              value={selectedColors}
              onChange={(e) => {
                const value = e.target.value as string[]
                setSelectedColors(value)
              }}
              label={t('tryOn.wardrobe.addItem.saveModal.colors') || 'Colors (Optional)'}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((color) => (
                    <Chip
                      key={color}
                      label={getColorDisplayName(itemData, color, lang)}
                      size="small"
                      onDelete={() => removeColor(color)}
                      deleteIcon={<i className="tabler-x" style={{ fontSize: 16 }} />}
                      sx={{
                        border: 2,
                        borderColor: getColorHex(itemData, color),
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
            >
              {colorData.map((color) => (
                <MenuItem
                  key={color}
                  value={color}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: getColorHex(itemData, color),
                        border: 1,
                        borderColor: 'divider'
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{getColorDisplayName(itemData, color, lang)}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Season Selection */}
        {itemData && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {t('tryOn.wardrobe.addItem.saveModal.seasons') || 'Seasons (Optional)'}
            </InputLabel>
            <Select
              multiple
              value={selectedSeasons}
              onChange={(e) => {
                const value = e.target.value as string[]
                setSelectedSeasons(value)
              }}
              label={t('tryOn.wardrobe.addItem.saveModal.seasons') || 'Seasons (Optional)'}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((season) => (
                    <Chip
                      key={season}
                      label={getSeasonLabel(season)}
                      size="small"
                      onDelete={() => removeSeason(season)}
                      deleteIcon={<i className="tabler-x" style={{ fontSize: 16 }} />}
                      sx={{
                        fontWeight: 600
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {seasonData.map((season) => (
                <MenuItem
                  key={season}
                  value={season}
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  {getSeasonLabel(season)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Occasion Selection */}
        {itemData && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {t('tryOn.wardrobe.addItem.saveModal.occasions') || 'Occasions (Optional)'}
            </InputLabel>
            <Select
              multiple
              value={selectedOccasions}
              onChange={(e) => {
                const value = e.target.value as string[]
                setSelectedOccasions(value)
              }}
              label={t('tryOn.wardrobe.addItem.saveModal.occasions') || 'Occasions (Optional)'}
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((occasion) => (
                    <Chip
                      key={occasion}
                      label={getOccasionLabel(occasion)}
                      size="small"
                      onDelete={() => removeOccasion(occasion)}
                      deleteIcon={<i className="tabler-x" style={{ fontSize: 16 }} />}
                      sx={{
                        fontWeight: 600
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {occasionData.map((occasion) => (
                <MenuItem
                  key={occasion}
                  value={occasion}
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  {getOccasionLabel(occasion)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isSaving || isDeleting}
          color="error"
          startIcon={<i className="tabler-trash" />}
        >
          {t('tryOn.wardrobe.editItem.delete') || 'Delete'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={isSaving || isDeleting}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleUpdate}
          disabled={isSaving || isDeleting || !selectedCategoryCode || !selectedSize}
          variant="contained"
        >
          {isSaving
            ? t('tryOn.wardrobe.editItem.saving') || 'Saving...'
            : t('tryOn.wardrobe.editItem.save') || 'Save Changes'}
        </Button>
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>
          {t('tryOn.wardrobe.editItem.deleteConfirm.title') || 'Delete Item'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('tryOn.wardrobe.editItem.deleteConfirm.message') ||
              'Are you sure you want to delete this item? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            color="error"
            variant="contained"
            startIcon={isDeleting ? <CircularProgress size={16} /> : <i className="tabler-trash" />}
          >
            {isDeleting
              ? t('tryOn.wardrobe.editItem.deleting') || 'Deleting...'
              : t('tryOn.wardrobe.editItem.deleteConfirm.confirm') || 'Delete Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default EditItemModal

