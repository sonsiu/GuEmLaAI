import { useState, useRef } from 'react'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast } from '@/services/toast.service'

interface ItemProcessingHook {
  capturedImage: string | null
  setCapturedImage: (image: string | null) => void
  segmentedOutput: string | null
  setSegmentedOutput: (image: string | null) => void
  isAIProcessing: boolean
  setIsAIProcessing: (processing: boolean) => void
  aiError: string | null
  setAiError: (error: string | null) => void
  segmentStatus: string
  setSegmentStatus: (status: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  compressImageIfNeeded: (imageDataUrl: string, maxSizeMB?: number) => Promise<string>
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, onUpload?: (image: string) => void) => void
  clearPhoto: () => void
  startAISegmentation: (itemData: any, t: (key: string) => string, userId?: string | number) => Promise<void>
  handleAIRemoveBackground: (t: (key: string) => string, userId?: string | number) => Promise<void>
  handleCrop: (croppedImageUrl: string, onCrop?: (image: string) => void) => void
}

export const useItemProcessing = (t?: (key: string) => string): ItemProcessingHook => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [segmentedOutput, setSegmentedOutput] = useState<string | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [segmentStatus, setSegmentStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const translate = t || ((key: string) => key)

  const compressImageIfNeeded = async (imageDataUrl: string, maxSizeMB: number = 4): Promise<string> => {
    const base64Size = (imageDataUrl.length * 3) / 4 / (1024 * 1024)

    //console.log(`📏 Image base64 size: ${base64Size.toFixed(2)} MB`)

    if (base64Size <= maxSizeMB) {
      //console.log('✅ Image size is acceptable, no compression needed')
      return imageDataUrl
    }

    //console.log(`⚠️ Image too large (${base64Size.toFixed(2)} MB), compressing...`)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

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

        let quality = 0.85
        let compressed = canvas.toDataURL('image/jpeg', quality)

        while ((compressed.length * 3) / 4 / (1024 * 1024) > maxSizeMB && quality > 0.5) {
          quality -= 0.05
          compressed = canvas.toDataURL('image/jpeg', quality)
        }

        const finalSize = (compressed.length * 3) / 4 / (1024 * 1024)
        //console.log(`✅ Compressed to ${finalSize.toFixed(2)} MB (quality: ${(quality * 100).toFixed(0)}%)`)

        resolve(compressed)
      }
      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = imageDataUrl
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, onUpload?: (image: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showErrorToast(translate('tryOn.wardrobe.addItem.errors.invalidFile') || 'Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showErrorToast(
        translate('tryOn.wardrobe.addItem.errors.fileTooLarge') || 'Image file is too large. Please select an image under 10MB'
      )
      return
    }

    const reader = new FileReader()
    reader.onload = async event => {
      let imageUrl = event.target?.result as string

      try {
        imageUrl = await compressImageIfNeeded(imageUrl, 4)
      } catch (error) {
        //console.error('Image compression failed:', error)
        showErrorToast('Failed to process image. Please try a different image.')
        return
      }

      setCapturedImage(imageUrl)
      setSegmentedOutput(null)
      setAiError(null)

      if (onUpload) {
        onUpload(imageUrl)
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearPhoto = () => {
    setCapturedImage(null)
    setSegmentedOutput(null)
    setAiError(null)
    setSegmentStatus('')
  }

  const startAISegmentation = async (itemData: any, translateFn?: (key: string) => string, userId?: string | number) => {
    const t = translateFn || translate

    if (!capturedImage) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.noImage') || 'Please upload an image first')
      return
    }

    if (!itemData) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.loadDataFailed') || 'Item data not loaded. Please wait...')
      return
    }

    try {
      setIsAIProcessing(true)
      setAiError(null)

      let imageBase64 = capturedImage

      try {
        imageBase64 = await compressImageIfNeeded(imageBase64, 4)
      } catch (error) {
        //console.error('Failed to compress image:', error)
        throw new Error('Image is too large to process. Please use a smaller image.')
      }

      //console.log('🤖 Sending AI garment segmentation request...')

      const result = await wardrobeService.generateCleanGarment(imageBase64, itemData)

      if (result.imageBase64) {
        setSegmentedOutput(`data:image/png;base64,${result.imageBase64}`)
        setSegmentStatus(t('tryOn.wardrobe.addItem.aiProcessing.complete') || 'AI garment processing complete ✅')
      } else {
        setSegmentedOutput(capturedImage)
      }
    } catch (error) {
     console.error('Error in AI segmentation:', error)
      const errorMessage = error instanceof Error ? error.message : t('tryOn.wardrobe.addItem.errors.aiProcessingFailed') || 'AI processing failed'
      setAiError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setIsAIProcessing(false)
    }
  }

  const handleAIRemoveBackground = async (translateFn?: (key: string) => string, userId?: string | number) => {
    const t = translateFn || translate

    if (!capturedImage) {
      showErrorToast(t('tryOn.wardrobe.addItem.errors.noImage') || 'Please upload an image first')
      return
    }

    setIsAIProcessing(true)
    setAiError(null)

    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'captured-image.png', { type: 'image/png' })

      const userIdNum = userId ? (typeof userId === 'string' ? parseInt(userId, 10) : userId) : 0

      const result = await wardrobeService.removeBackground(userIdNum, file)

      if (result.imageBase64) {
        let base64String = result.imageBase64.trim()

        if (base64String.startsWith('data:')) {
          const commaIndex = base64String.indexOf(',')
          if (commaIndex !== -1) {
            base64String = base64String.substring(commaIndex + 1)
          }
        }

        const processedImage = `data:image/png;base64,${base64String}`

        setCapturedImage(processedImage)
        setSegmentedOutput(null)
        showErrorToast(t('tryOn.wardrobe.addItem.success.backgroundRemoved') || 'Background removed successfully!')
      }
    } catch (err) {
      //console.error('Error removing background:', err)
      const errorMessage = err instanceof Error ? err.message : t('tryOn.wardrobe.addItem.errors.aiProcessingFailed') || 'AI processing failed'
      setAiError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setIsAIProcessing(false)
    }
  }

  const handleCrop = (croppedImageUrl: string, onCrop?: (image: string) => void) => {
    if (segmentedOutput) {
      setSegmentedOutput(croppedImageUrl)
    } else {
      setCapturedImage(croppedImageUrl)
    }

    if (onCrop) {
      onCrop(croppedImageUrl)
    }
  }

  return {
    capturedImage,
    setCapturedImage,
    segmentedOutput,
    setSegmentedOutput,
    isAIProcessing,
    setIsAIProcessing,
    aiError,
    setAiError,
    segmentStatus,
    setSegmentStatus,
    fileInputRef,
    canvasRef,
    compressImageIfNeeded,
    handleImageUpload,
    clearPhoto,
    startAISegmentation,
    handleAIRemoveBackground,
    handleCrop
  }
}
