'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface SaveOutfitModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    name?: string
    comment?: string
    isPublic: boolean
    isFavorite: boolean
    seasons: string[]
  }) => void
  isEditMode?: boolean
  seasonData: string[]
  initialData?: {
    name?: string
    comment?: string
    isPublic?: boolean
    isFavorite?: boolean
    seasons?: string[]
  }
}

const SaveOutfitModal: React.FC<SaveOutfitModalProps> = ({
  open,
  onClose,
  onSave,
  isEditMode = false,
  seasonData,
  initialData
}) => {
  const { t } = useTranslation()

  const [name, setName] = useState(initialData?.name || '')
  const [comment, setComment] = useState(initialData?.comment || '')
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false)
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false)
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialData?.seasons || [])
  const [seasonMenuAnchor, setSeasonMenuAnchor] = useState<null | HTMLElement>(null)

  // Sync state với initialData khi modal mở hoặc initialData thay đổi
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '')
      setComment(initialData.comment || '')
      setIsPublic(initialData.isPublic ?? false)
      setIsFavorite(initialData.isFavorite ?? false)
      setSelectedSeasons(initialData.seasons || [])
    }
  }, [open, initialData])

  const handleSave = () => {
    onSave({
      name: name.trim() || undefined,
      comment: comment.trim() || undefined,
      isPublic,
      isFavorite,
      seasons: selectedSeasons
    })
  }

  const toggleSeason = (season: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    )
  }

  const removeSeason = (season: string) => {
    setSelectedSeasons((prev) => prev.filter((s) => s !== season))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className="tabler-device-floppy" style={{ fontSize: 24 }} />
          <Typography variant="h6">
            {isEditMode ? t('tryOn.wardrobe.outfitBuilder.saveModal.updateTitle') : t('tryOn.wardrobe.outfitBuilder.saveModal.saveTitle')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label={t('tryOn.wardrobe.outfitBuilder.saveModal.nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('tryOn.wardrobe.outfitBuilder.saveModal.namePlaceholder')}
            fullWidth
          />

          <TextField
            label={t('tryOn.wardrobe.outfitBuilder.saveModal.commentLabel')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('tryOn.wardrobe.outfitBuilder.saveModal.commentPlaceholder')}
            multiline
            rows={3}
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            }
            label={t('tryOn.wardrobe.outfitBuilder.saveModal.isPublic')}
          />

          <FormControlLabel
            control={
              <Checkbox checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} />
            }
            label={t('tryOn.wardrobe.outfitBuilder.saveModal.isFavorite')}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('tryOn.wardrobe.outfitBuilder.saveModal.seasonsLabel')}
            </Typography>

            {selectedSeasons.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedSeasons.map((season) => (
                  <Chip
                    key={season}
                    label={season}
                    onDelete={() => removeSeason(season)}
                    size="small"
                  />
                ))}
              </Box>
            )}

            <Button
              variant="outlined"
              onClick={(e) => setSeasonMenuAnchor(e.currentTarget)}
              startIcon={<i className="tabler-calendar" />}
              fullWidth
            >
              {selectedSeasons.length > 0
                ? t('tryOn.wardrobe.outfitBuilder.saveModal.seasonsSelected', { count: selectedSeasons.length })
                : t('tryOn.wardrobe.outfitBuilder.saveModal.selectSeasons')}
            </Button>

            <Menu
              anchorEl={seasonMenuAnchor}
              open={Boolean(seasonMenuAnchor)}
              onClose={() => setSeasonMenuAnchor(null)}
            >
              {seasonData.map((season) => (
                <MenuItem
                  key={season}
                  onClick={() => {
                    toggleSeason(season)
                    setSeasonMenuAnchor(null)
                  }}
                  selected={selectedSeasons.includes(season)}
                >
                  {season}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<i className="tabler-check" />}>
          {isEditMode ? t('common.update') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SaveOutfitModal

