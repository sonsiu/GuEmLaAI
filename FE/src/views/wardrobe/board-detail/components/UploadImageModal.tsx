'use client'

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'

interface UploadImageModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  boardId: number
}

const UploadImageModal: React.FC<UploadImageModalProps> = ({
  open,
  onClose,
  onSuccess,
  boardId
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [originalSize, setOriginalSize] = useState<number>(0)
  const [compressing, setCompressing] = useState(false)

  const compressImage = async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const maxDimension = 2048
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.webp'),
                  {
                    type: 'image/webp',
                    lastModified: Date.now()
                  }
                )
                resolve(compressedFile)
              } else {
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      const jpegFile = new File([jpegBlob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                      })
                      resolve(jpegFile)
                    } else {
                      resolve(file)
                    }
                  },
                  'image/jpeg',
                  quality
                )
              }
            },
            'image/webp',
            quality
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('tryOn.wardrobe.boardDetail.invalidImageFile') || 'Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('tryOn.wardrobe.boardDetail.fileTooLarge') || 'File size must be less than 10MB')
      return
    }

    setError(null)
    setOriginalSize(file.size)
    setCompressing(true)

    try {
      const compressedFile = await compressImage(file)
      setSelectedFile(compressedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Error processing image:', err)
      setError(t('tryOn.wardrobe.boardDetail.processError') || 'Failed to process image. Please try again.')
    } finally {
      setCompressing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !boardId) {
      setError(t('tryOn.wardrobe.boardDetail.selectFile') || 'Please select a file first')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await wardrobeService.uploadBoardImage(boardId, selectedFile)

      setSelectedFile(null)
      setPreview(null)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : t('tryOn.wardrobe.boardDetail.uploadError') || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading && !compressing) {
      setSelectedFile(null)
      setPreview(null)
      setError(null)
      setOriginalSize(0)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6'>
            {t('tryOn.wardrobe.boardDetail.uploadImage') || 'Upload Image'}
          </Typography>
          <IconButton onClick={handleClose} disabled={uploading || compressing} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!preview ? (
          <Box
            sx={{
              border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id='file-input'
              type='file'
              accept='image/*'
              onChange={handleInputChange}
              disabled={uploading || compressing}
              style={{ display: 'none' }}
            />
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <i className='tabler-upload' style={{ fontSize: '32px', opacity: 0.5 }} />
            </Box>
            <Typography variant='body1' sx={{ mb: 1, fontWeight: 600 }}>
              {t('tryOn.wardrobe.boardDetail.dropImage') || 'Drop your image here, or click to browse'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('tryOn.wardrobe.boardDetail.imageFormats') || 'Supports: JPG, PNG, GIF (max 10MB)'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
              }}
            >
              <Box
                component='img'
                src={preview || '/placeholder.png'}
                alt='Preview'
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target.src && !target.src.includes('/placeholder.png')) {
                    target.src = '/placeholder.png'
                  }
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
            {selectedFile && originalSize > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <i className='tabler-file' style={{ fontSize: '20px', opacity: 0.7 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {selectedFile.name}
                  </Typography>
                  {compressing ? (
                    <Typography variant='caption' color='primary'>
                      {t('tryOn.wardrobe.boardDetail.compressing') || 'Compressing image...'}
                    </Typography>
                  ) : (
                    <Typography variant='caption' color='text.secondary'>
                      {(originalSize / 1024).toFixed(2)}KB → {(selectedFile.size / 1024).toFixed(2)}KB
                      {originalSize > selectedFile.size && (
                        <Typography component='span' color='success.main' sx={{ ml: 1 }}>
                          ({Math.round(((originalSize - selectedFile.size) / originalSize) * 100)}% smaller)
                        </Typography>
                      )}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                  }}
                  disabled={uploading || compressing}
                  size='small'
                >
                  <i className='tabler-x' />
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant='body2' color='error.main'>
              {error}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading || compressing}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || compressing}
          variant='contained'
          startIcon={uploading ? <CircularProgress size={16} /> : <i className='tabler-upload' />}
        >
          {uploading ? t('tryOn.wardrobe.boardDetail.uploading') || 'Uploading...' : t('common.upload') || 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadImageModal

