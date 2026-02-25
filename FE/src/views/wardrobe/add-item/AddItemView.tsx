'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import ImageCropperModal from './components/ImageCropperModal'
import SaveItemModal from './components/SaveItemModal'
import PhotoGuideModal from './components/PhotoGuideModal'
import { useWebcam } from './hooks/useWebcam'
import { useImageSegmentation } from './hooks/useImageSegmentation'
import { useItemForm } from './hooks/useItemForm'
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

const AddItemView: React.FC = () => {
  const { t, lang } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  // Custom hooks
  const webcam = useWebcam()
  const segmentation = useImageSegmentation()
  const itemForm = useItemForm()

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

  const normalizeOccasionName = (occasion: any): string => {
    if (!occasion) return ''
    if (typeof occasion === 'string') return occasion
    if (typeof occasion.name === 'string') return occasion.name
    if (typeof occasion.name_vn === 'string') return occasion.name_vn
    return ''
  }

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const deviceCameraInputRef = useRef<HTMLInputElement>(null)

  // Modal states
  const [showCropper, setShowCropper] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPhotoGuide, setShowPhotoGuide] = useState(false)

  // Load item data on mount
  useEffect(() => {
    const loadData = async () => {
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

        // Deduplicate occasions - sometimes the JSON has duplicates
        const occasionNames: string[] = (data.occasions || [])
          .map((occasion: any) => normalizeOccasionName(occasion))
          .filter((name: string) => !!name)

        setOccasionData(Array.from(new Set(occasionNames)).sort())
      } catch (error) {
        // console.error('Failed to load item data:', error)
        showErrorToast(t('tryOn.wardrobe.addItem.errors.loadDataFailed') || 'Failed to load item data')
      }
    }
    loadData()
  }, [t])

  // Compress image if too large for API payload
  const compressImageIfNeeded = async (imageDataUrl: string, maxSizeMB: number = 4): Promise<string> => {
    // Calculate approximate base64 size (base64 is ~33% larger than binary)
    const base64Size = (imageDataUrl.length * 3) / 4 / (1024 * 1024) // Size in MB

    // console.log(`📏 Image base64 size: ${base64Size.toFixed(2)} MB`)

    if (base64Size <= maxSizeMB) {
      // console.log('✅ Image size is acceptable, no compression needed')
      return imageDataUrl
    }

    // console.log(`⚠️ Image too large (${base64Size.toFixed(2)} MB), compressing...`)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate scale factor to reduce size
        const scaleFactor = Math.sqrt(maxSizeMB / base64Size)
        width = Math.floor(width * scaleFactor)
        height = Math.floor(height * scaleFactor)

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with quality adjustment
        let quality = 0.85
        let compressed = canvas.toDataURL('image/jpeg', quality)

        // If still too large, reduce quality further
        while ((compressed.length * 3) / 4 / (1024 * 1024) > maxSizeMB && quality > 0.5) {
          quality -= 0.05
          compressed = canvas.toDataURL('image/jpeg', quality)
        }

        const finalSize = (compressed.length * 3) / 4 / (1024 * 1024)
        // console.log(`✅ Compressed to ${finalSize.toFixed(2)} MB (quality: ${(quality * 100).toFixed(0)}%)`)

        resolve(compressed)
      }
      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = imageDataUrl
    })
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      webcam.setError(t('tryOn.wardrobe.addItem.errors.invalidFile') || 'Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      webcam.setError(
        t('tryOn.wardrobe.addItem.errors.fileTooLarge') || 'Image file is too large. Please select an image under 10MB'
      )
      return
    }

    const reader = new FileReader()
    reader.onload = async event => {
      let imageUrl = event.target?.result as string

      // Compress if needed before setting
      try {
        imageUrl = await compressImageIfNeeded(imageUrl, 4) // 4MB limit for API payload
      } catch (error) {
        // console.error('Image compression failed:', error)
        webcam.setError('Failed to process image. Please try a different image.')
        return
      }

      webcam.setCapturedImage(imageUrl)
      segmentation.resetSegmentation()
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger file upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Clear photo
  const clearPhoto = () => {
    webcam.clearPhoto()
    segmentation.resetSegmentation()
    webcam.setError('')
  }

  // AI Segmentation (Generate Clean Garment)
  const startAISegmentation = async () => {
    if (!webcam.capturedImage) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.noImage') || 'Please capture or upload an image first')
      return
    }

    if (!user?.id) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.loginRequired') || 'Please login to use this feature')
      return
    }

    if (!itemData) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.loadDataFailed') || 'Item data not loaded. Please wait...')
      return
    }

    try {
      segmentation.setIsAIProcessing(true)
      segmentation.setAiError(null)

      // Compress image if needed before sending to API
      let imageBase64 = webcam.capturedImage

      try {
        imageBase64 = await compressImageIfNeeded(imageBase64, 4) // 4MB limit for API
      } catch (error) {
        // console.error('Failed to compress image:', error)
        throw new Error('Image is too large to process. Please use a smaller image.')
      }

      // console.log('🤖 Sending AI garment segmentation request...')

      const result = await wardrobeService.generateCleanGarment(imageBase64, itemData)

      if (result.imageBase64) {
        segmentation.setSegmentedOutput(`data:image/png;base64,${result.imageBase64}`)
        segmentation.setSegmentStatus(
          t('tryOn.wardrobe.addItem.aiProcessing.complete') || 'AI garment processing complete ✅'
        )
      } else {
        // If no processed image, use the original captured image
        segmentation.setSegmentedOutput(webcam.capturedImage)
      }

      // Process API responses for form - auto-fill form fields
      if (result.colors && Array.isArray(result.colors) && result.colors.length > 0 && itemData) {
        const validColors = result.colors.filter((apiColor: string) => {
          return itemData.colors.some((jsonColor: any) => jsonColor.name.toLowerCase() === apiColor.toLowerCase())
        })
        if (validColors.length > 0) {
          itemForm.setSelectedColors(validColors)
        } else {
          // console.warn('⚠️ AI returned colors not in our list:', result.colors)
        }
      }

      if (result.name) {
        itemForm.setItemName(result.name)
      }

      if (result.description) {
        itemForm.setItemDescription(result.description)
      }

      // Process categories
      if (result.categories && Array.isArray(result.categories) && result.categories.length > 0 && itemData) {
        // console.log('🔍 Processing AI categories:', result.categories)
        const validCategories: string[] = []
        for (const apiCategory of result.categories) {
          // console.log(`🔍 Checking category: "${apiCategory}"`)
          // Handle both "MainCategory - SubCategory" format and direct matches
          let categoryToCheck = apiCategory
          let mainCategoryHint = null

          // Check if it's in "MainCategory - SubCategory" format
          if (apiCategory.includes(' - ')) {
            const parts = apiCategory.split(' - ')
            if (parts.length === 2) {
              mainCategoryHint = parts[0].trim()
              categoryToCheck = parts[1].trim()
              // console.log(`🔍 Parsed as: main="${mainCategoryHint}", sub="${categoryToCheck}"`)
            }
          }

          let found = false
          for (const [mainCat, items] of Object.entries(itemData.category)) {
            // If we have a main category hint, prioritize that category
            if (mainCategoryHint && mainCat.toLowerCase() !== mainCategoryHint.toLowerCase()) {
              continue
            }

            const item = (items as any[]).find(
              (item: any) =>
                item.category_code.toLowerCase() === categoryToCheck.toLowerCase() ||
                item.name.toLowerCase() === categoryToCheck.toLowerCase() ||
                item.category_code.toLowerCase() === apiCategory.toLowerCase()
            )
            if (item) {
              // console.log(`✅ Found match: "${apiCategory}" -> "${item.name}" (${item.category_code})`)
              validCategories.push(item.category_code)
              found = true
              break
            }
          }
          if (!found) {
            // console.log(`❌ No match found for: "${apiCategory}"`)
          }
        }

        if (validCategories.length > 0) {
          const firstCategoryCode = validCategories[0]
          for (const [mainCat, items] of Object.entries(itemData.category)) {
            const item = (items as any[]).find((item: any) => item.category_code === firstCategoryCode)
            if (item) {
              itemForm.setSelectedCategory(mainCat)
              itemForm.setSelectedSubCategory(item.name)
              itemForm.setSelectedSubCategoryVn(item.name_vn || item.name)
              itemForm.setSelectedCategoryCode(firstCategoryCode)
              break
            }
          }
        }
      }

      // Process sizes
      if (result.sizes && Array.isArray(result.sizes) && result.sizes.length > 0 && itemData) {
        const validSizes = result.sizes.filter((apiSize: string) => {
          return [
            ...(itemData.sizes?.clothing || []),
            ...(itemData.sizes?.footwear || []),
            ...(itemData.sizes?.freeSize || [])
          ].includes(apiSize)
        })
        if (validSizes.length > 0) {
          itemForm.setSelectedSizes(validSizes)
          itemForm.setSelectedSize(validSizes[0])
        } else {
          // console.warn('⚠️ AI returned sizes not in our list:', result.sizes)
        }
      }

      // Process seasons
      if (result.seasons && Array.isArray(result.seasons) && result.seasons.length > 0 && itemData) {
        const validSeasons = result.seasons.filter((apiSeason: string) => {
          return itemData.seasons.includes(apiSeason)
        })
        if (validSeasons.length > 0) {
          itemForm.setSelectedSeasons(validSeasons)
        } else {
          // console.warn('⚠️ AI returned seasons not in our list:', result.seasons)
        }
      }

      // Process occasions
      if (result.occasions && Array.isArray(result.occasions) && result.occasions.length > 0 && itemData) {
        const itemOccasions = (itemData.occasions || [])
          .map((occasion: any) => normalizeOccasionName(occasion))
          .filter((name: string) => !!name)

        const validOccasions = result.occasions.filter((apiOccasion: string) => {
          return itemOccasions.some(
            (normalizedOccasion: string) => normalizedOccasion.toLowerCase() === apiOccasion.toLowerCase()
          )
        })
        if (validOccasions.length > 0) {
          itemForm.setSelectedOccasions(validOccasions)
        } else {
          // console.warn('⚠️ AI returned occasions not in our list:', result.occasions)
        }
      }
    } catch (error) {
      // console.error('Error in AI segmentation:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('tryOn.wardrobe.addItem.errors.aiProcessingFailed') || 'AI processing failed'
      segmentation.setAiError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      segmentation.setIsAIProcessing(false)
    }
  }

  // AI Remove Background
  const handleAIRemoveBackground = async () => {
    if (!webcam.capturedImage) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.noImage') || 'Please capture or upload an image first')
      return
    }

    if (!user?.id) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.loginRequired') || 'Please login to use this feature')
      return
    }

    segmentation.setIsAIProcessing(true)
    segmentation.setAiError(null)

    try {
      // Convert data URL to File
      const response = await fetch(webcam.capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'captured-image.png', { type: 'image/png' })

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
      const result = await wardrobeService.removeBackground(userId, file)

      if (result.imageBase64) {
        // Ensure base64 string doesn't already have data URI prefix
        let base64String = result.imageBase64.trim()

        // Remove existing data URI prefix if present
        if (base64String.startsWith('data:')) {
          const commaIndex = base64String.indexOf(',')
          if (commaIndex !== -1) {
            base64String = base64String.substring(commaIndex + 1)
          }
        }

        // Create proper data URI with PNG format
        const processedImage = `data:image/png;base64,${base64String}`

        // Update capturedImage (main image) and clear segmentedOutput to show main image
        webcam.setCapturedImage(processedImage)
        segmentation.setSegmentedOutput(null)
        showSuccessToast(t('tryOn.wardrobe.addItem.success.backgroundRemoved') || 'Background removed successfully!')
      }
    } catch (err) {
      // console.error('Error removing background:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('tryOn.wardrobe.addItem.errors.aiProcessingFailed') || 'AI processing failed'
      segmentation.setAiError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      segmentation.setIsAIProcessing(false)
    }
  }

  // Handle crop
  const handleCrop = (croppedImageUrl: string) => {
    if (segmentation.segmentedOutput) {
      segmentation.setSegmentedOutput(croppedImageUrl)
    } else {
      webcam.setCapturedImage(croppedImageUrl)
    }
    setShowCropper(false)
  }

  // Handle save item
  const handleSaveItem = async (saveData: {
    categoryCode: string
    size: string
    sizes: string[]
    itemName: string
    description: string
    colors: string[]
    seasons: string[]
    occasions: string[]
  }) => {
    if (!user?.id) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.loginRequired') || 'Please login to save items')
      return
    }

    // GuEmLaAI only uses segmentedOutput, no fallback to capturedImage
    const imageToSave = segmentation.segmentedOutput
    if (!imageToSave) {
      showErrorToast(
        t('tryOn.wardrobe.addItem.errors.noImage') || 'No processed image to save. Please use AI processing first.'
      )
      return
    }

    try {
      // Convert base64 to File
      const response = await fetch(imageToSave)
      const blob = await response.blob()
      const file = new File([blob], `item-${Date.now()}.png`, { type: 'image/png' })

      await wardrobeService.createItem({
        userId: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
        categoryName: saveData.categoryCode,
        imageFile: file,
        isPublic: false,
        isFavorite: false,
        comment: saveData.itemName, // GuEmLaAI uses itemName for Comment
        description: saveData.description,
        size: saveData.size,
        sizes: saveData.sizes.length > 0 ? saveData.sizes : undefined,
        colors: saveData.colors.length > 0 ? saveData.colors : undefined,
        seasons: saveData.seasons.length > 0 ? saveData.seasons : undefined,
        occasions: saveData.occasions.length > 0 ? saveData.occasions : undefined
      })

      showSuccessToast(t('tryOn.wardrobe.addItem.success.itemSaved') || 'Item saved successfully!')
      setShowSaveModal(false)
      webcam.clearPhoto()
      segmentation.resetSegmentation()
      itemForm.resetForm()

      // Navigate back to wardrobe
      router.push(`/${lang}/wardrobe?tab=items`)
    } catch (err) {
      // console.error('Error saving item:', err)
      const errorMessage =
        err instanceof Error ? err.message : t('tryOn.wardrobe.addItem.errors.saveFailed') || 'Failed to save item'
      showErrorToast(errorMessage)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
        {t('tryOn.wardrobe.addItem.title') || 'Add New Item'}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText'
              }}
            >
              <i className='tabler-camera' style={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant='h6'>{t('tryOn.wardrobe.addItem.webcamCapture') || 'Webcam Capture'}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('tryOn.wardrobe.addItem.subtitle') || 'Take a photo or upload an image'}
              </Typography>
            </Box>
          </Box>
          <Button variant='outlined' startIcon={<i className='tabler-help' />} onClick={() => setShowPhotoGuide(true)}>
            {t('tryOn.wardrobe.addItem.photoGuide.title') || 'Guide'}
          </Button>
        </Box>

        {/* Error message */}
        {webcam.error && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => webcam.setError('')}>
            {webcam.error}
          </Alert>
        )}

        {segmentation.aiError && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => segmentation.setAiError(null)}>
            {segmentation.aiError}
          </Alert>
        )}

        {/* Video display */}
        {!webcam.capturedImage && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                position: 'relative',
                bgcolor: 'grey.900',
                borderRadius: 2,
                overflow: 'hidden',
                maxWidth: '100%',
                mx: 'auto'
              }}
            >
              {webcam.isStreamActive ? (
                <>
                  <video
                    ref={webcam.videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      maxHeight: '600px',
                      minHeight: '400px',
                      display: 'block'
                    }}
                  />
                  {webcam.showFlash && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'white',
                        zIndex: 10,
                        animation: 'flash 0.2s'
                      }}
                    />
                  )}

                  {/* Control buttons overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                      px: 2
                    }}
                  >
                    {webcam.isMobile && (
                      <Button
                        variant='contained'
                        onClick={webcam.switchCamera}
                        disabled={webcam.isLoading}
                        sx={{
                          minWidth: 48,
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                        }}
                      >
                        <i className='tabler-refresh' />
                      </Button>
                    )}

                    <Button
                      variant='contained'
                      onClick={webcam.capturePhoto}
                      disabled={webcam.isLoading}
                      sx={{
                        minWidth: 64,
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: 'primary.main'
                      }}
                    >
                      <i className='tabler-camera' style={{ fontSize: 32 }} />
                    </Button>

                    <Button
                      variant='contained'
                      onClick={webcam.stopVideoStream}
                      sx={{
                        minWidth: 48,
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                      }}
                    >
                      <i className='tabler-x' />
                    </Button>
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    color: 'text.secondary'
                  }}
                >
                  <Typography>{t('tryOn.wardrobe.addItem.cameraNotActive') || 'Camera not active'}</Typography>
                </Box>
              )}
            </Box>

            {/* Control buttons */}
            {!webcam.isStreamActive && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant='contained'
                  onClick={() => webcam.enableVideoStream()}
                  disabled={webcam.isLoading}
                  startIcon={webcam.isLoading ? <CircularProgress size={20} /> : <i className='tabler-video' />}
                >
                  {t('tryOn.wardrobe.addItem.startWebcam') || 'Start Webcam'}
                </Button>
                <Button variant='contained' onClick={triggerFileUpload} startIcon={<i className='tabler-upload' />}>
                  {t('tryOn.wardrobe.addItem.uploadImage') || 'Upload Image'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Captured image display */}
        {webcam.capturedImage && !segmentation.segmentedOutput && (
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6'>{t('tryOn.wardrobe.addItem.photoCaptured') || 'Photo Captured'}</Typography>
                <Button size='small' onClick={clearPhoto} startIcon={<i className='tabler-x' />}>
                  {t('common.close') || 'Clear'}
                </Button>
              </Box>

              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2
                }}
              >
                <Box
                  component='img'
                  src={webcam.capturedImage}
                  alt='Captured'
                  key={webcam.capturedImage}
                  sx={{
                    width: '100%',
                    maxHeight: 600,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />

                {/* AI Processing Overlay */}
                {segmentation.isAIProcessing && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <CircularProgress size={60} />
                    <Typography variant='h6' color='white'>
                      {t('tryOn.wardrobe.addItem.aiProcessing.analyzing') || 'AI Processing...'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant='contained'
                  color='success'
                  onClick={() => setShowCropper(true)}
                  startIcon={<i className='tabler-crop' />}
                >
                  {t('tryOn.wardrobe.addItem.cropImage') || 'Crop Image'}
                </Button>
                {/* <Button
                  variant='contained'
                  onClick={() => setShowSaveModal(true)}
                  startIcon={<i className='tabler-device-floppy' />}
                >
                  {t('tryOn.wardrobe.addItem.saveToWardrobe') || 'Save to Wardrobe'}
                </Button> */}
                <Button
                  variant='contained'
                  color='error'
                  onClick={startAISegmentation}
                  disabled={segmentation.isAIProcessing}
                  startIcon={<i className='tabler-sparkles' />}
                >
                  {t('tryOn.wardrobe.addItem.aiGenerate') || 'AI Generate'}
                </Button>

                {/* <Button
                  variant='contained'
                  onClick={handleAIRemoveBackground}
                  disabled={segmentation.isAIProcessing}
                  startIcon={<i className='tabler-photo-off' />}
                >
                  {t('tryOn.wardrobe.addItem.aiRemoveBackground') || 'AI Remove Background'}
                </Button> */}
                <Button variant='outlined' onClick={clearPhoto} startIcon={<i className='tabler-trash' />}>
                  {t('tryOn.wardrobe.addItem.clearImage') || 'Clear Image'}
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Segmented output display */}
        {segmentation.segmentedOutput && (
          <Box sx={{ mb: 3 }}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: 2,
                borderColor: 'primary.main',
                bgcolor: theme => theme.palette.background.paper
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6' color='primary'>
                  {t('tryOn.wardrobe.addItem.segmentedOutput') || 'Processed Image'}
                </Typography>
                <Button
                  size='small'
                  onClick={() => segmentation.setSegmentedOutput(null)}
                  startIcon={<i className='tabler-x' />}
                >
                  {t('common.close') || 'Close'}
                </Button>
              </Box>

              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                  bgcolor: theme => theme.palette.background.paper,
                  border: theme => `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 240, md: 320 }
                }}
              >
                <Box
                  component='img'
                  src={segmentation.segmentedOutput}
                  alt='Segmented'
                  sx={{
                    width: '100%',
                    maxHeight: 600,
                    objectFit: 'contain',
                    display: 'block',
                    backgroundColor: 'transparent'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant='contained'
                  color='success'
                  onClick={() => setShowSaveModal(true)}
                  startIcon={<i className='tabler-device-floppy' />}
                >
                  {t('tryOn.wardrobe.addItem.saveToWardrobe') || 'Save to Wardrobe'}
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => segmentation.setSegmentedOutput(null)}
                  startIcon={<i className='tabler-arrow-left' />}
                >
                  {t('tryOn.wardrobe.addItem.backToPhoto') || 'Try Again'}
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <input
          ref={deviceCameraInputRef}
          type='file'
          accept='image/*'
          capture='environment'
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <canvas ref={webcam.canvasRef} style={{ display: 'none' }} />
      </Paper>

      {/* Modals */}
      {showCropper && (segmentation.segmentedOutput || webcam.capturedImage) && (
        <ImageCropperModal
          open={showCropper}
          onClose={() => setShowCropper(false)}
          imageUrl={segmentation.segmentedOutput || webcam.capturedImage || ''}
          onCrop={handleCrop}
        />
      )}

      {showSaveModal && (segmentation.segmentedOutput || webcam.capturedImage) && itemData && (
        <SaveItemModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveItem}
          imageUrl={segmentation.segmentedOutput || webcam.capturedImage || ''}
          categoryData={categoryData}
          sizeData={sizeData}
          colorData={colorData}
          seasonData={seasonData}
          getColorHex={(colorName: string) => getColorHex(itemData, colorName)}
          getColorDisplayName={(colorName: string) => getColorDisplayName(itemData, colorName, lang)}
          getCategoryVietnameseName={(categoryCode: string) => getCategoryVietnameseName(itemData, categoryCode)}
          occasionData={occasionData}
          initialValues={{
            itemName: itemForm.itemName,
            description: itemForm.itemDescription,
            categoryCode: itemForm.selectedCategoryCode,
            size: itemForm.selectedSize,
            sizes: itemForm.selectedSizes,
            colors: itemForm.selectedColors,
            seasons: itemForm.selectedSeasons,
            occasions: itemForm.selectedOccasions
          }}
        />
      )}

      {showPhotoGuide && <PhotoGuideModal open={showPhotoGuide} onClose={() => setShowPhotoGuide(false)} />}
    </Box>
  )
}

export default AddItemView
