'use client'

import React, { useState, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import ConfirmDialog from '@/@core/components/dialogs/comfirm-dialog'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { Collection } from '@/types/wardrobe.type'

interface EditCollectionModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  collection: Collection
}

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  open,
  onClose,
  onSuccess,
  collection
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description || '')
  const [isPublic, setIsPublic] = useState(collection.isPublic)
  const [imageCoverFile, setImageCoverFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    collection.imageCoverUrl || null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setName(collection.name)
      setDescription(collection.description || '')
      setIsPublic(collection.isPublic)
      setImagePreview(collection.imageCoverUrl || null)
      setImageCoverFile(null)
      setError(null)
    }
  }, [open, collection])

  const handleClose = () => {
    if (!loading && !deleting) {
      setError(null)
      onClose()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh phải nhỏ hơn 5MB')
        return
      }

      setImageCoverFile(file)
      setError(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageCoverFile(null)
    setImagePreview(collection.imageCoverUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('tryOn.wardrobe.modals.createCollection.nameRequired'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await wardrobeService.updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        imageCoverFile: imageCoverFile || undefined,
        isPublic
      })

      showSuccessToast(t('tryOn.wardrobe.success.updateCollection'))
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật collection'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await wardrobeService.deleteCollection(collection.id)
      showSuccessToast('Xóa collection thành công!')
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa collection'
      showErrorToast(errorMessage)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tryOn.wardrobe.modals.editCollection.title')}</DialogTitle>
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
            label={t('tryOn.wardrobe.modals.createCollection.name')}
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            disabled={loading || deleting}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label={t('tryOn.wardrobe.modals.createCollection.description')}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading || deleting}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={loading || deleting}
            />
            {imagePreview ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mb: 1
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                  disabled={loading || deleting}
                >
                  <i className="tabler-x" />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<i className="tabler-upload" />}
                disabled={loading || deleting}
                fullWidth
                sx={{ mb: 1 }}
              >
                {t('tryOn.wardrobe.modals.createCollection.imageCover')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </Button>
            )}
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading || deleting}
              />
            }
            label={t('tryOn.wardrobe.modals.createCollection.public')}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            color="error"
            disabled={loading || deleting}
          >
            {t('tryOn.wardrobe.modals.editCollection.delete')}
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
            {loading ? t('tryOn.wardrobe.modals.editCollection.updating') : t('tryOn.wardrobe.modals.editCollection.update')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        setOpen={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={t('tryOn.wardrobe.modals.editCollection.deleteConfirm.title')}
        description={t('tryOn.wardrobe.modals.editCollection.deleteConfirm.description')}
        confirmLabel={t('tryOn.wardrobe.modals.editCollection.delete')}
        rejectLabel={t('common.cancel')}
      />
    </>
  )
}

export default EditCollectionModal

