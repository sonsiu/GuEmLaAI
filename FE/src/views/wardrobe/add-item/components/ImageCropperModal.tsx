'use client'

import React, { useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface ImageCropperModalProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  onCrop: (croppedImageUrl: string) => void
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  onClose,
  imageUrl,
  onCrop
}) => {
  const { t } = useTranslation()
  const cropperRef = useRef<CropperRef>(null)

  const handleCrop = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas()
      if (canvas) {
        const croppedDataUrl = canvas.toDataURL('image/png')
        onCrop(croppedDataUrl)
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('tryOn.wardrobe.addItem.cropImage') || 'Crop Image'}</span>
          <IconButton onClick={onClose} size="small">
            <i className="tabler-x" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
            bgcolor: 'grey.100',
            borderRadius: 2,
            p: 2
          }}
        >
          {imageUrl ? (
            <Box
              sx={{
                width: '100%',
                height: 500,
                position: 'relative'
              }}
            >
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                className="cropper"
                stencilProps={{
                  grid: true
                }}
                backgroundProps={{
                  className: 'cropper-background'
                }}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body1">
                {t('tryOn.wardrobe.addItem.errors.noImage') || 'No image to crop'}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('tryOn.wardrobe.addItem.cropNote') ||
              'Note: This is a simple preview. For advanced cropping, please use an image editor.'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
        <Button variant="contained" onClick={handleCrop} disabled={!imageUrl}>
          {t('tryOn.wardrobe.addItem.applyCrop') || 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImageCropperModal
