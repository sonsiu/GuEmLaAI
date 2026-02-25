'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface DeleteImageConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}

const DeleteImageConfirmDialog: React.FC<DeleteImageConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  deleting
}) => {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6'>
            {t('tryOn.wardrobe.boardDetail.deleteImage') || 'Delete Image?'}
          </Typography>
          <IconButton onClick={onClose} disabled={deleting} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 2
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <i className='tabler-trash' style={{ fontSize: '32px', color: 'white' }} />
          </Box>
          <Typography variant='body1' sx={{ mb: 1, fontWeight: 600 }}>
            {t('tryOn.wardrobe.boardDetail.deleteConfirmTitle') || 'Are you sure you want to delete this image?'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.wardrobe.boardDetail.deleteConfirmDescription') ||
              'This action cannot be undone and the image will be permanently removed from your board.'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          variant='contained'
          color='error'
          startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-trash' />}
        >
          {deleting ? t('tryOn.wardrobe.boardDetail.deleting') || 'Deleting...' : t('common.delete') || 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteImageConfirmDialog

