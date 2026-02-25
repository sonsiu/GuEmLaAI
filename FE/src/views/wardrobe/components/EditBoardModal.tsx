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
import ConfirmDialog from '@/@core/components/dialogs/comfirm-dialog'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { Board } from '@/types/wardrobe.type'

interface EditBoardModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  board: Board
}

const EditBoardModal: React.FC<EditBoardModalProps> = ({
  open,
  onClose,
  onSuccess,
  board
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState(board.title)
  const [description, setDescription] = useState(board.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  React.useEffect(() => {
    if (open) {
      setName(board.title)
      setDescription(board.description || '')
      setError(null)
    }
  }, [open, board])

  const handleClose = () => {
    if (!loading && !deleting) {
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
      await wardrobeService.updateBoard(board.id, {
        title: name.trim(),
        description: description.trim() || null
      })

      showSuccessToast(t('tryOn.wardrobe.success.updateBoard'))
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('tryOn.wardrobe.errors.updateBoard')
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await wardrobeService.deleteBoard(board.id)
      showSuccessToast(t('tryOn.wardrobe.success.deleteBoard'))
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('tryOn.wardrobe.errors.deleteBoard')
      showErrorToast(errorMessage)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tryOn.wardrobe.modals.editBoard.title')}</DialogTitle>
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
            label="Tên Board"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            disabled={loading || deleting}
            error={!!error && !name.trim()}
            helperText={`${name.length}/100 ${t('common.characters')}`}
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
            disabled={loading || deleting}
            helperText={`${description.length}/500 ${t('common.characters')}`}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            color="error"
            disabled={loading || deleting}
          >
            {t('tryOn.wardrobe.modals.editBoard.delete')}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose} disabled={loading || deleting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || deleting || !name.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? t('tryOn.wardrobe.modals.editBoard.updating') : t('tryOn.wardrobe.modals.editBoard.update')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        setOpen={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={t('tryOn.wardrobe.modals.editBoard.deleteConfirm.title')}
        description={t('tryOn.wardrobe.modals.editBoard.deleteConfirm.description')}
        confirmLabel={t('tryOn.wardrobe.modals.editBoard.delete')}
        rejectLabel={t('common.cancel')}
      />
    </>
  )
}

export default EditBoardModal

