'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { loadItemData } from '@/utils/itemData'
import type { Outfit } from '@/types/wardrobe.type'

interface EditOutfitModalProps {
  outfit: Outfit
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

const EditOutfitModal: React.FC<EditOutfitModalProps> = ({ outfit, open, onClose, onUpdate }) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Form states
  const [outfitName, setOutfitName] = useState(outfit.name || '')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(outfit.outfitSeasons || [])
  const [isFavorite, setIsFavorite] = useState(outfit.isFavorite || false)
  const [seasonData, setSeasonData] = useState<string[]>([])

  // Loading states
  const [isSaving, setIsSaving] = useState(false)

  // Load season data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadItemData()
        setSeasonData(data.seasons || [])
      } catch (error) {
        // console.error('Failed to load season data:', error)
      }
    }
    loadData()
  }, [])

  // Reset form when outfit changes
  useEffect(() => {
    if (outfit) {
      setOutfitName(outfit.name || '')
      setSelectedSeasons(outfit.outfitSeasons || [])
      setIsFavorite(outfit.isFavorite || false)
    }
  }, [outfit])

  // Handle season toggle
  const handleSeasonToggle = (season: string) => {
    setSelectedSeasons(prev =>
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    )
  }

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    const newFavoriteStatus = !isFavorite
    setIsFavorite(newFavoriteStatus)
    
    try {
      await wardrobeService.updateOutfit(outfit.id, {
        name: outfitName,
        isFavorite: newFavoriteStatus,
        seasons: selectedSeasons
      })
      showSuccessToast(
        newFavoriteStatus 
          ? t('tryOn.wardrobe.addedToFavorites') || 'Added to favorites'
          : t('tryOn.wardrobe.removedFromFavorites') || 'Removed from favorites'
      )
      onUpdate()
    } catch (error) {
      // console.error('Error toggling favorite:', error)
      setIsFavorite(!newFavoriteStatus) // Revert on error
      showErrorToast(t('tryOn.wardrobe.errors.toggleFavorite') || 'Failed to update favorite status')
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validate outfit name
    if (!outfitName.trim()) {
      showErrorToast(t('tryOn.wardrobe.errors.nameRequired') || 'Outfit name is required')
      return
    }

    if (outfitName.trim().length > 50) {
      showErrorToast(t('tryOn.wardrobe.errors.nameTooLong') || 'Outfit name must not exceed 50 characters')
      return
    }

    // Validate seasons
    if (selectedSeasons.length === 0) {
      showErrorToast(t('tryOn.wardrobe.errors.seasonRequired') || 'Please select at least one season')
      return
    }

    setIsSaving(true)
    try {
      await wardrobeService.updateOutfit(outfit.id, {
        name: outfitName,
        isFavorite: isFavorite,
        seasons: selectedSeasons
      })
      
      showSuccessToast(t('tryOn.wardrobe.outfitUpdated') || 'Outfit updated successfully')
      onUpdate()
      onClose()
    } catch (error) {
      // console.error('Error updating outfit:', error)
      showErrorToast(t('tryOn.wardrobe.errors.updateOutfit') || 'Failed to update outfit')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          {t('tryOn.wardrobe.editOutfit') || 'Edit Outfit'}
        </Typography>
        <IconButton
          onClick={handleFavoriteToggle}
          sx={{
            color: isFavorite ? 'error.main' : 'action.disabled',
            '&:hover': {
              color: 'error.main',
              bgcolor: 'error.lighterOpacity'
            }
          }}
        >
          <i className={isFavorite ? 'tabler-heart-filled' : 'tabler-heart'} style={{ fontSize: '1.5rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Outfit Image Preview */}
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {outfit.imageUrl ? (
              <Box
                component="img"
                src={outfit.imageUrl}
                alt={outfit.name || 'Outfit image'}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <i className="tabler-photo-off" style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)' }} />
            )}
          </Box>

          {/* Outfit Name */}
          <TextField
            label={t('tryOn.wardrobe.outfitName') || 'Outfit Name'}
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
            fullWidth
            required
            placeholder={t('tryOn.wardrobe.outfitNamePlaceholder') || 'Enter outfit name'}
          />

          {/* Seasons */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              {t('tryOn.wardrobe.seasons') || 'Seasons'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {seasonData.map((season) => (
                <Chip
                  key={season}
                  label={season}
                  onClick={() => handleSeasonToggle(season)}
                  color={selectedSeasons.includes(season) ? 'primary' : 'default'}
                  variant={selectedSeasons.includes(season) ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: selectedSeasons.includes(season) ? 'primary.dark' : 'action.hover'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
        >
          {isSaving ? t('common.saving') || 'Saving...' : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditOutfitModal
