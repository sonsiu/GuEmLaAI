'use client'

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface CreateBoardModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setError(null)
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('tryOn.wardrobe.modals.createBoard.nameRequired'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await wardrobeService.createBoard({
        title: name.trim(),
        description: description.trim() || null
      })

      showSuccessToast(t('tryOn.wardrobe.success.createBoard'))
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('tryOn.wardrobe.errors.createBoard')
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('tryOn.wardrobe.modals.createBoard.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'error.light',
              color: 'error.contrastText',
              borderRadius: 1
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        <TextField
          autoFocus
          margin="dense"
          label={t('tryOn.wardrobe.modals.createBoard.name')}
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          disabled={loading}
          error={!!error && !name.trim()}
          helperText={`${name.length}/100 ${t('common.characters') || 'ký tự'}`}
          inputProps={{ maxLength: 100 }}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label={t('tryOn.wardrobe.modals.createBoard.description')}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          helperText={`${description.length}/500 ${t('common.characters') || 'ký tự'}`}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? t('tryOn.wardrobe.modals.createBoard.creating') : t('tryOn.wardrobe.modals.createBoard.create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateBoardModal

