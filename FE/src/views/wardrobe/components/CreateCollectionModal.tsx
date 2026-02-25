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

interface CreateCollectionModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [imageCoverFile, setImageCoverFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setIsPublic(false)
      setImageCoverFile(null)
      setImagePreview(null)
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
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Tên collection là bắt buộc')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await wardrobeService.createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        imageCoverFile: imageCoverFile || undefined,
        isPublic
      })

      showSuccessToast('Tạo collection thành công!')
      
      if (onSuccess) {
        await onSuccess()
      }

      handleClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo collection'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tạo Collection Mới</DialogTitle>
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
          label="Tên Collection"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          disabled={loading}
          error={!!error && !name.trim()}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Mô tả (tùy chọn)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            disabled={loading}
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
                disabled={loading}
              >
                <i className="tabler-x" />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={<i className="tabler-upload" />}
              disabled={loading}
              fullWidth
              sx={{ mb: 1 }}
            >
              Tải ảnh cover (tùy chọn)
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
              disabled={loading}
            />
          }
          label="Công khai"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Đang tạo...' : 'Tạo Collection'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateCollectionModal

