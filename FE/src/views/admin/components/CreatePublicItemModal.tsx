'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAuth } from '@/@core/contexts/AuthContext'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { useItemProcessing } from '@/hooks/useItemProcessing'
import ImageCropperModal from '@/views/wardrobe/add-item/components/ImageCropperModal'
import SaveItemModal from '@/views/wardrobe/add-item/components/SaveItemModal'
import {
  loadItemData,
  flattenCategoryData,
  getColorHex,
  getColorDisplayName,
  getCategoryVietnameseName
} from '@/utils/itemData'

type SizeData = {
  clothing: string[]
  footwear: string[]
  freeSize: string[]
}

interface CreatePublicItemModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CreatePublicItemModal: React.FC<CreatePublicItemModalProps> = ({ open, onClose, onSuccess }) => {
  const { t, lang } = useTranslation()
  const { user } = useAuth()
  const theme = useTheme()

  // Item processing hook
  const itemProcessing = useItemProcessing(t)

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
  const [loadingItemData, setLoadingItemData] = useState(false)

  // Modal states
  const [showCropper, setShowCropper] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const normalizeOccasionName = (occasion: any): string => {
    if (!occasion) return ''
    if (typeof occasion === 'string') return occasion
    if (typeof occasion.name === 'string') return occasion.name
    if (typeof occasion.name_vn === 'string') return occasion.name_vn
    return ''
  }

  // Load item data on mount
  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoadingItemData(true)
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

        const occasionNames: string[] = (data.occasions || [])
          .map((occasion: any) => normalizeOccasionName(occasion))
          .filter((name: string) => !!name)

        setOccasionData(Array.from(new Set(occasionNames)).sort())
      } catch (error) {
       // console.error('Failed to load item data:', error)
        showErrorToast(t('tryOn.wardrobe.addItem.errors.loadDataFailed') || 'Failed to load item data')
      } finally {
        setLoadingItemData(false)
      }
    }

    loadData()
  }, [open, t])

  const handleClose = () => {
    itemProcessing.clearPhoto()
    onClose()
  }

  const handleCrop = (croppedImageUrl: string) => {
    itemProcessing.handleCrop(croppedImageUrl)
    setShowCropper(false)
  }

  const handleSavePublicItem = async (saveData: {
    categoryCode: string
    size: string
    sizes: string[]
    itemName: string
    description: string
    colors: string[]
    seasons: string[]
    occasions: string[]
  }) => {
    const imageToSave = itemProcessing.segmentedOutput || itemProcessing.capturedImage
    if (!imageToSave) {
      showErrorToast(
        t('tryOn.wardrobe.addItem.errors.noImage') || 'No processed image to save. Please upload an image first.'
      )
      return
    }

    try {
      const response = await fetch(imageToSave)
      const blob = await response.blob()
      const file = new File([blob], `public-item-${Date.now()}.png`, { type: 'image/png' })

      // Create public item with userId: -1 and isPublic: true
      await wardrobeService.createItem({
        userId: -1, // Public item not owned by anyone
        categoryName: saveData.categoryCode,
        imageFile: file,
        isPublic: true, // Set as public
        isFavorite: false,
        comment: saveData.itemName,
        description: saveData.description,
        size: saveData.size,
        sizes: saveData.sizes.length > 0 ? saveData.sizes : undefined,
        colors: saveData.colors.length > 0 ? saveData.colors : undefined,
        seasons: saveData.seasons.length > 0 ? saveData.seasons : undefined,
        occasions: saveData.occasions.length > 0 ? saveData.occasions : undefined
      })

      showSuccessToast(t('admin.createPublicItem.success') || 'Public item created successfully!')
      setShowSaveModal(false)
      itemProcessing.clearPhoto()

      if (onSuccess) {
        onSuccess()
      }

      handleClose()
    } catch (err) {
     // console.error('Error saving public item:', err)
      const errorMessage = err instanceof Error ? err.message : t('admin.createPublicItem.error') || 'Failed to create public item'
      showErrorToast(errorMessage)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('admin.createPublicItem.title') || 'Create Public Item'}</span>
            <IconButton onClick={handleClose} size="small">
              <i className="tabler-x" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '80vh', overflow: 'auto' }}>
          {loadingItemData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Error Alert */}
              {itemProcessing.aiError && (
                <Alert severity="error">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {t('tryOn.wardrobe.addItem.errors.title') || 'Error'}
                  </Typography>
                  <Typography variant="body2">{itemProcessing.aiError}</Typography>
                </Alert>
              )}

              {/* No Image */}
              {!itemProcessing.capturedImage && (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        color: 'white',
                        mb: 2
                      }}
                    >
                      <i className="tabler-photo" style={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {t('admin.createPublicItem.uploadImage') || 'Upload Item Image'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {t('admin.createPublicItem.uploadHint') || 'Upload a clear image of the item for processing'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => itemProcessing.fileInputRef.current?.click()}
                      startIcon={<i className="tabler-upload" />}
                    >
                      {t('admin.createPublicItem.chooseFile') || 'Choose File'}
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* Image Captured - Not Processed */}
              {itemProcessing.capturedImage && !itemProcessing.segmentedOutput && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      component="img"
                      src={itemProcessing.capturedImage}
                      alt="Captured"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        border: 2,
                        borderColor: 'divider'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={() => itemProcessing.clearPhoto()}
                      startIcon={<i className="tabler-trash" />}
                    >
                      {t('admin.createPublicItem.clearImage') || 'Clear'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setShowCropper(true)}
                      startIcon={<i className="tabler-crop" />}
                    >
                      {t('admin.createPublicItem.cropImage') || 'Crop'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => itemProcessing.startAISegmentation(itemData, t, user?.id)}
                      disabled={itemProcessing.isAIProcessing}
                      startIcon={
                        itemProcessing.isAIProcessing ? (
                          <CircularProgress size={20} />
                        ) : (
                          <i className="tabler-wand" />
                        )
                      }
                    >
                      {itemProcessing.isAIProcessing
                        ? t('admin.createPublicItem.processing') || 'Processing...'
                        : t('admin.createPublicItem.aiProcess') || 'AI Process'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Image Processed */}
              {itemProcessing.segmentedOutput && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {itemProcessing.segmentStatus && (
                    <Alert severity="success">
                      <Typography variant="body2">{itemProcessing.segmentStatus}</Typography>
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      component="img"
                      src={itemProcessing.segmentedOutput}
                      alt="Processed"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        border: 2,
                        borderColor: 'success.main'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={() => itemProcessing.clearPhoto()}
                      startIcon={<i className="tabler-trash" />}
                    >
                      {t('admin.createPublicItem.clearImage') || 'Clear'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setShowCropper(true)}
                      startIcon={<i className="tabler-crop" />}
                    >
                      {t('admin.createPublicItem.cropImage') || 'Crop'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setShowSaveModal(true)}
                      startIcon={<i className="tabler-device-floppy" />}
                    >
                      {t('admin.createPublicItem.saveItem') || 'Save Item'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      {showCropper && (itemProcessing.segmentedOutput || itemProcessing.capturedImage) && (
        <ImageCropperModal
          open={showCropper}
          onClose={() => setShowCropper(false)}
          imageUrl={itemProcessing.segmentedOutput || itemProcessing.capturedImage || ''}
          onCrop={handleCrop}
        />
      )}

      {/* Save Item Modal */}
      {showSaveModal && (itemProcessing.segmentedOutput || itemProcessing.capturedImage) && itemData && (
        <SaveItemModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSavePublicItem}
          imageUrl={itemProcessing.segmentedOutput || itemProcessing.capturedImage || ''}
          categoryData={categoryData}
          sizeData={sizeData}
          colorData={colorData}
          seasonData={seasonData}
          getColorHex={(colorName: string) => getColorHex(itemData, colorName)}
          getColorDisplayName={(colorName: string) => getColorDisplayName(itemData, colorName, lang)}
          getCategoryVietnameseName={(categoryCode: string) => getCategoryVietnameseName(itemData, categoryCode)}
          occasionData={occasionData}
        />
      )}

      {/* File Input */}
      <input
        ref={itemProcessing.fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => itemProcessing.handleImageUpload(e)}
        style={{ display: 'none' }}
      />
    </>
  )
}

export default CreatePublicItemModal
