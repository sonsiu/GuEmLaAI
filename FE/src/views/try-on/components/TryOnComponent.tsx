'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion } from 'framer-motion'
import introJs from 'intro.js'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type { Outfit, WardrobeItem as WardrobeCatalogItem } from '@/types/wardrobe.type'
import { workshopService } from '@/services/workshop.service'
import type { ModelUserResponse } from '@/services/user.types'
import { userService } from '@/services/user.service'
import { historyService } from '@/services/history.service'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAuth } from '@/@core/contexts/AuthContext'
import itemData from '@/../public/item.json'
import 'intro.js/introjs.css'
import { POSE_INSTRUCTIONS } from '../constants'
import type { HistoryBoardImage, ItemTemplate, OutfitLayer, TryOnWardrobeItem, PoseImage } from '../types'
import { extractFileNameFromUrl } from '../types'
import { getFriendlyErrorMessage } from '../utils/errorUtils'
import { fileToDataUrl } from '../utils/imageUtils'
import { useMediaQuery } from '../utils/useMediaQuery'
import CanvasDisplay, { type ModelImage } from './CanvasDisplay'
import EnlargedImageModal from './EnlargedImageModal'
import HistoryModal from './HistoryModal'
import OutfitStack from './OutfitStack'
import ShareDialog from './ShareDialog'
import Spinner from './Spinner'
import StartScreen from './StartScreen'
import WardrobeTabsContent from './WardrobeTabsContent'
import { ChevronDownIcon, ChevronUpIcon } from './icons'

const DAILY_LIMITS = {
  TRY_ON_IMAGES: 40,
  MODEL_PICTURES: 40
}

const MIN_LAYERS_TO_SAVE = 2
const MAX_PENDING_GARMENTS = 4
const MAX_OUTFIT_STACK_LAYERS = 9 // Model + 8 garments in total
const SEASON_DATA: string[] = (itemData as { seasons?: string[] })?.seasons ?? ['Spring', 'Summer', 'Autumn', 'Winter']

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

const canGenerateTryOn = (modelUserData: ModelUserResponse | null) => {
  const used = modelUserData?.todayImageGeneratedCount || 0
  const remaining = Math.max(0, DAILY_LIMITS.TRY_ON_IMAGES - used)

  if (remaining <= 0) {
    return {
      canGenerate: false,
      message: `Daily try-on limit reached (${DAILY_LIMITS.TRY_ON_IMAGES}/${DAILY_LIMITS.TRY_ON_IMAGES}).`
    }
  }

  return { canGenerate: true, remaining }
}

const canGenerateModel = (modelUserData: ModelUserResponse | null) => {
  const used = modelUserData?.todayModelPictureCreatedCount || 0
  const remaining = Math.max(0, DAILY_LIMITS.MODEL_PICTURES - used)

  if (remaining <= 0) {
    return {
      canGenerate: false,
      message: `Daily model limit reached (${DAILY_LIMITS.MODEL_PICTURES}/${DAILY_LIMITS.MODEL_PICTURES}).`
    }
  }

  return { canGenerate: true, remaining }
}

const TryOnComponent: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const searchParams = useSearchParams()

  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null)
  const [modelFileName, setModelFileName] = useState<string | null>(null)
  const [poseImageFileNames, setPoseImageFileNames] = useState<string[]>([])
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([])
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0)
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false)
  const [allowAutoLoad, setAllowAutoLoad] = useState(true)
  const [pendingGarments, setPendingGarments] = useState<WardrobeCatalogItem[]>([])
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'stack' | 'wardrobe'>('wardrobe')
  const [modelUserData, setModelUserData] = useState<ModelUserResponse | null>(null)
  const [isLoadingModelUser, setIsLoadingModelUser] = useState(true)
  const [isRestarting, setIsRestarting] = useState(false)
  const [historyImages, setHistoryImages] = useState<HistoryBoardImage[]>([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [associatedItems, setAssociatedItems] = useState<ItemTemplate[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [currentHistoryBoardId, setCurrentHistoryBoardId] = useState<number | null>(null)
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [outfitName, setOutfitName] = useState('')
  const [outfitIsFavorite, setOutfitIsFavorite] = useState(false)
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [isSavingOutfit, setIsSavingOutfit] = useState(false)

  const [generatedPoseImages, setGeneratedPoseImages] = useState<Array<{ poseInstruction: string; imageUrl: string }>>(
    []
  )

  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null)
  const [showStartScreen, setShowStartScreen] = useState(false)
  const [showModelChangeWarning, setShowModelChangeWarning] = useState(false)
  const [pendingModelSelection, setPendingModelSelection] = useState<ModelImage | null>(null)
  const [showGenerateWarning, setShowGenerateWarning] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [showDeleteDefaultWarning, setShowDeleteDefaultWarning] = useState(false)
  const [pendingDeleteModel, setPendingDeleteModel] = useState<ModelImage | null>(null)
  const [isDeletingModel, setIsDeletingModel] = useState(false)
  const [showStartOverWarning, setShowStartOverWarning] = useState(false)
  const [showHistorySelectionWarning, setShowHistorySelectionWarning] = useState(false)
  const [pendingHistorySelection, setPendingHistorySelection] = useState<HistoryBoardImage | null>(null)
  const [showModelPanel, setShowModelPanel] = useState(false)
  const [showPublicCollectionWarning, setShowPublicCollectionWarning] = useState(false)
  const [pendingPublicCollection, setPendingPublicCollection] = useState<any>(null)
  const [showSaveOutfitPublicItemsWarning, setShowSaveOutfitPublicItemsWarning] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)

  // Ref to track if public items have already been auto-loaded (only load once per page)
  const hasAutoLoadedPublicItemsRef = React.useRef(false)

  const activeOutfitLayers = useMemo(
    () => outfitHistory.slice(0, currentOutfitIndex + 1),
    [outfitHistory, currentOutfitIndex]
  )

  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl
    const currentLayer = outfitHistory[currentOutfitIndex]

    if (!currentLayer) return modelImageUrl
    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex]
    const poseImage = currentLayer.poseImages[poseInstruction] || Object.values(currentLayer.poseImages)[0]

    return poseImage?.url || modelImageUrl
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl])

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return []
    const currentLayer = outfitHistory[currentOutfitIndex]

    return currentLayer ? Object.keys(currentLayer.poseImages) : []
  }, [outfitHistory, currentOutfitIndex])

  // Convert modelPictureUrls to ModelImage array for CanvasDisplay
  const modelImages: ModelImage[] = useMemo(() => {
    if (!modelUserData?.modelPictureUrls || modelUserData.modelPictureUrls.length === 0) {
      return []
    }

    return modelUserData.modelPictureUrls.map((url, index) => {
      const fileName = extractFileNameFromUrl(url)

      // Mark as default if filename matches defaultModelPictureUrl
      const isDefault = fileName === modelUserData.defaultModelPictureUrl

      return {
        id: index,
        imageUrl: url,
        fileName: fileName,
        isDefault: isDefault
      }
    })
  }, [modelUserData?.modelPictureUrls, modelUserData?.defaultModelPictureUrl])

  const ensureToken = useCallback(() => {
    const token = getAccessToken()

    if (!token) {
      throw new Error(t('tryOn.errors.loginRequired'))
    }

    return token
  }, [t])


  const handleModelFinalized = useCallback(
    async (
      modelUrl: string,
      options?: {
        base64Data?: string
        originalFile?: File
        persist?: boolean
        fileName?: string
      }
    ) => {
      const { fileName } = options || {}

      setModelImageUrl(modelUrl)

      if (fileName) {
        setModelFileName(fileName)
      }

      const poseImage: PoseImage = {
        url: modelUrl,
        fileName: fileName || extractFileNameFromUrl(modelUrl)
      }

      setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage } }])
      setCurrentOutfitIndex(0)
      setCurrentPoseIndex(0)
      setError(null)
      setIsSheetCollapsed(false)
      setAllowAutoLoad(true)

    },
    []
  )

  const fetchModelUserData = useCallback(async () => {
    try {
      const data = await userService.getModelUser()

      // console.log('📸 [TryOnComponent] Model user data loaded:', data)
      // console.log('📸 [TryOnComponent] modelPictureUrls:', data?.modelPictureUrls)
      setModelUserData(data)
    } catch (err) {
      // console.error('Failed to load model user data', err)
    } finally {
      setIsLoadingModelUser(false)
    }
  }, [])

  // Check if there are items or poses that would be lost when changing models
  const hasDataToReset = useMemo(() => {
    // Check if there are outfit layers beyond the base model
    const hasOutfitLayers = outfitHistory.length > 1
    const hasPendingGarments = pendingGarments.length > 0
    const hasSelectedOutfit = selectedOutfit !== null
    const hasMultiplePoses = outfitHistory.some(layer => Object.keys(layer.poseImages).length > 1)

    return hasOutfitLayers || hasPendingGarments || hasSelectedOutfit || hasMultiplePoses
  }, [outfitHistory, pendingGarments, selectedOutfit])

  // Handler for selecting a model from the model gallery
  const handleModelSelect = useCallback(
    (model: ModelImage) => {
      // console.log('[TryOnComponent] Model selected:', model)

      if (hasDataToReset) {
        setPendingModelSelection(model)
        setShowModelChangeWarning(true)
        return
      }

      setSelectedModelIndex(model.id)
      setModelImageUrl(model.imageUrl)
      setModelFileName(model.fileName || extractFileNameFromUrl(model.imageUrl))

      setPendingGarments([])
      setSelectedOutfit(null)
      setGeneratedPoseImages([])

      const poseImage: PoseImage = {
        url: model.imageUrl,
        fileName: model.fileName || extractFileNameFromUrl(model.imageUrl)
      }

      setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage } }])
      setCurrentOutfitIndex(0)
      setCurrentPoseIndex(0)
      setError(null)
    },
    [hasDataToReset]
  )

  // Apply the model selection (used after confirmation)
  const applyModelSelection = useCallback((model: ModelImage) => {
    // console.log('[TryOnComponent] Applying model selection:', model)
    setSelectedModelIndex(model.id)
    setModelImageUrl(model.imageUrl)
    setModelFileName(model.fileName || extractFileNameFromUrl(model.imageUrl))

    setPendingGarments([])
    setSelectedOutfit(null)
    setGeneratedPoseImages([])

    const poseImage: PoseImage = {
      url: model.imageUrl,
      fileName: model.fileName || extractFileNameFromUrl(model.imageUrl)
    }

    setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage } }])
    setCurrentOutfitIndex(0)
    setCurrentPoseIndex(0)
    setError(null)
  }, [])

  const handleConfirmModelChange = useCallback(() => {
    if (pendingModelSelection) {
      applyModelSelection(pendingModelSelection)
    }

    setShowModelChangeWarning(false)
    setPendingModelSelection(null)
  }, [pendingModelSelection, applyModelSelection])

  const handleCancelModelChange = useCallback(() => {
    setShowModelChangeWarning(false)
    setPendingModelSelection(null)
  }, [])

  const handleAddModel = useCallback(() => {
    // console.log('[TryOnComponent] "Add your model picture here" button clicked')
    // console.log(' Model gallery - Total images:', modelImages.length)

    if (modelImages.length === 0) {
      // console.log('📸 Model gallery is EMPTY - opening StartScreen for upload')
      setShowStartScreen(true)
    } else {
      // console.log('🎬 Model gallery has', modelImages.length, 'images - opening Model Panel')
      setShowModelPanel(true)
    }
  }, [modelImages.length])

  const handleAddModelFromPanel = useCallback(() => {
    // console.log('➕ [TryOnComponent] "Add" button inside Model Panel clicked')
    // console.log('📸 Opening StartScreen for uploading new model')

    setShowStartScreen(true)
  }, [])

  // This closes the StartScreen and refreshes the model gallery
  const handleStartScreenModelFinalized = useCallback(
    async (
      modelUrl: string,
      options?: {
        base64Data?: string
        originalFile?: File
        persist?: boolean
        fileName?: string
      }
    ) => {
      // console.log('[TryOnComponent] StartScreen model finalized:', { modelUrl, fileName: options?.fileName })

      setShowStartScreen(false)
      setModelImageUrl(modelUrl)

      if (options?.fileName) {
        setModelFileName(options.fileName)
      }

      const poseImage: PoseImage = {
        url: modelUrl,
        fileName: options?.fileName || extractFileNameFromUrl(modelUrl)
      }

      setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage } }])
      setCurrentOutfitIndex(0)
      setCurrentPoseIndex(0)
      setError(null)

      setIsLoadingModelUser(true)
      await fetchModelUserData()
    },
    [fetchModelUserData]
  )

  //const shouldShowTryOnCanvas = true
  

  useEffect(() => {
    if (isAuthenticated && isLoadingModelUser) {
      void fetchModelUserData()
    }
  }, [isAuthenticated, isLoadingModelUser, fetchModelUserData])

  const fetchHistory = useCallback(async () => {
    const numericUserId = typeof user?.id === 'string' ? Number(user.id) : user?.id

    if (!numericUserId || Number.isNaN(numericUserId)) return
    setIsLoadingHistory(true)

    try {
      const images = await historyService.getHistoryBoardImages(numericUserId)

      setHistoryImages(images)
    } catch (err) {
      // console.error('Failed to fetch history', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      void fetchHistory()
    }
  }, [user?.id, fetchHistory])

  // Auto-load default model on component mount
  useEffect(() => {
    if (modelUserData && !modelImageUrl && modelImages.length > 0) {
      const defaultModel = modelImages.find(model => model.isDefault)

      if (defaultModel) {

        // console.log('🎯 [TryOnComponent] Auto-loading default model:', defaultModel)

        setSelectedModelIndex(defaultModel.id)
        
        setModelImageUrl(defaultModel.imageUrl)
        
        setModelFileName(defaultModel.fileName || extractFileNameFromUrl(defaultModel.imageUrl))

        const poseImage: PoseImage = {
          url: defaultModel.imageUrl,
          fileName: defaultModel.fileName || extractFileNameFromUrl(defaultModel.imageUrl)
        }

        setOutfitHistory([{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage } }])
        setCurrentOutfitIndex(0)
        setCurrentPoseIndex(0)
        setError(null)
      }
    }
  }, [modelUserData, modelImageUrl, modelImages])

  // Handler for history image selection with confirmation
  const handleHistoryImageClick = useCallback((image: HistoryBoardImage) => {
    if (generatedPoseImages.length > 0) {
      setPendingHistorySelection(image)
      setShowHistorySelectionWarning(true)
      return
    }

    void fetchAssociatedItems(image.id, image.url)
  }, [generatedPoseImages.length])

  // Confirm history selection and load items
  const handleConfirmHistorySelection = useCallback(() => {
    if (pendingHistorySelection) {
      setGeneratedPoseImages([])
      setPoseImageFileNames([])
      void fetchAssociatedItems(pendingHistorySelection.id, pendingHistorySelection.url)
    }

    setShowHistorySelectionWarning(false)
    setPendingHistorySelection(null)
  }, [pendingHistorySelection])

  // Cancel history selection
  const handleCancelHistorySelection = useCallback(() => {
    setShowHistorySelectionWarning(false)
    setPendingHistorySelection(null)
  }, [])

  const fetchAssociatedItems = useCallback(async (historyId: number, previewUrl: string) => {
    setIsLoadingItems(true)

    try {
      const info = await historyService.getHistoryBoardImageInfo(historyId)

      setAssociatedItems(info?.itemsTemplate ?? [])
      setCurrentHistoryBoardId(historyId)
      setModelImageUrl(previewUrl)

      // Extract filename from selected history image URL and update modelFileName
      const extractedFileName = extractFileNameFromUrl(previewUrl)

      // console.log(' fetchAssociatedItems - History Image Selected:')
      // console.log('  previewUrl:', previewUrl.substring(0, 100) + '...')
      // console.log('  extractedFileName:', extractedFileName)

      setModelFileName(extractedFileName)

      const poseImage: PoseImage = {
        url: previewUrl,
        fileName: extractedFileName
      }

      // Create outfit layers from associated items
      const itemLayers: OutfitLayer[] = (info?.itemsTemplate ?? []).map((item, index) => {
        const garmentInfo: TryOnWardrobeItem = {
          id: `item-${item.id}`,
          name: item.name || item.categoryCode,
          url: item.imageUrl || item.imagePreview
        }

        return {
          garment: garmentInfo,
          poseImages: index === (info?.itemsTemplate?.length ?? 1) - 1 ? { [POSE_INSTRUCTIONS[0]]: poseImage } : {}
        }
      })

      // Set outfit history with model as base + item layers
      setOutfitHistory([
        {
          garment: null,
          poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage }
        },
        ...itemLayers
      ])

      setCurrentOutfitIndex(itemLayers.length)
      setCurrentPoseIndex(0)

      // Debug: Log items displayed in outfit stack after selecting history image
      // console.log(' [fetchAssociatedItems] Selected image from history - Outfit stack updated:')
      // console.log('  Total layers:', itemLayers.length + 1)
      // console.log('  Base model:', {
      //   url: previewUrl.substring(0, 100) + '...',
      //   fileName: extractedFileName
      // })
      // itemLayers.forEach((layer, idx) => {
      //   console.log(`  Layer ${idx + 1}:`, {
      //     id: layer.garment?.id,
      //     name: layer.garment?.name,
      //     url: layer.garment?.url.substring(0, 100) + '...'
      //   })
      // })

      // console.log(' modelFileName updated in state:', extractedFileName)
    } catch (err) {
      // console.error('Failed to load associated items', err)
      setAssociatedItems([])

      // Fallback: just show the model without items
      const extractedFileName = extractFileNameFromUrl(previewUrl)

      // console.log('⚠️ Error loading history items, setting modelFileName to:', extractedFileName)

      setModelFileName(extractedFileName)

      const poseImage: PoseImage = {
        url: previewUrl,
        fileName: extractedFileName
      }

      setOutfitHistory([
        {
          garment: null,
          poseImages: { [POSE_INSTRUCTIONS[0]]: poseImage }
        }
      ])
      setCurrentOutfitIndex(0)
      setCurrentPoseIndex(0)
    } finally {
      setIsLoadingItems(false)
    }
  }, [])

  // Start Over - show warning modal first
  const handleStartOver = useCallback(() => {
    const hasData =
      modelImageUrl ||
      outfitHistory.length > 0 ||
      pendingGarments.length > 0 ||
      selectedOutfit ||
      generatedPoseImages.length > 0 ||
      poseImageFileNames.length > 0

    if (hasData) {
      setShowStartOverWarning(true)
    }
  }, [
    modelImageUrl,
    outfitHistory.length,
    pendingGarments.length,
    selectedOutfit,
    generatedPoseImages.length,
    poseImageFileNames.length
  ])

  // Confirm start over - reset everything
  const handleConfirmStartOver = useCallback(() => {
    setShowStartOverWarning(false)
    setAllowAutoLoad(false)
    setIsRestarting(true)

    // Reset model
    setModelImageUrl(null)
    setModelFileName(null)
    setSelectedModelIndex(null)

    // Reset outfit stack
    setOutfitHistory([])
    setCurrentOutfitIndex(0)
    setPendingGarments([])
    setSelectedOutfit(null)

    // Reset poses
    setCurrentPoseIndex(0)
    setPoseImageFileNames([])
    setGeneratedPoseImages([])

    // Reset associated items
    setAssociatedItems([])

    // Reset UI states
    setIsLoading(false)
    setLoadingMessage('')
    setError(null)
    setIsSheetCollapsed(false)

    // Reset save outfit form
    setOutfitName('')
    setOutfitIsFavorite(false)
    setSelectedSeasons([])
  }, [])

  // Cancel start over
  const handleCancelStartOver = useCallback(() => {
    setShowStartOverWarning(false)
  }, [])

  const handleGenerateModel = useCallback(
    async (file: File) => {
      const token = ensureToken()
      const limitCheck = canGenerateModel(modelUserData)

      if (!limitCheck.canGenerate) {
        throw new Error(limitCheck.message)
      }

      if (modelUserData) {
        setModelUserData({
          ...modelUserData,
          todayModelPictureCreatedCount: (modelUserData.todayModelPictureCreatedCount || 0) + 1
        })
      }

      const imageDataUrl = await fileToDataUrl(file)

      try {
        const response = await workshopService.generateModelEnhancement({
          Images: [imageDataUrl]
        })

        // Safe check: validate response has required imageUrl
        if (!response || !response.imageUrl) {
          throw new Error(t('profile.errors.emptyInputImages'))
        }

        const fileName = extractFileNameFromUrl(response.imageUrl) || response.fileName || ''

        return {
          displayUrl: response.imageUrl,
          base64Data: response.ImageBase64,
          fileName
        }
      } catch (err) {
        if (modelUserData) {
          setModelUserData({
            ...modelUserData,
            todayModelPictureCreatedCount: Math.max(0, modelUserData.todayModelPictureCreatedCount - 1)
          })
        }

        throw err
      }
    },
    [ensureToken, modelUserData]
  )

  const handleItemSelect = useCallback(
    (item: WardrobeCatalogItem) => {
      if (!item.imageUrl) {
        setError(t('tryOn.errors.noImage'))
        return
      }

      // Check if item already exists in generated outfit history (after first generation)
      if (outfitHistory.length > 1) { // More than just the base model layer
        const isAlreadyUsed = outfitHistory.some(layer => {
          if (!layer.garment) return false
          // Remove the "item-" prefix from stored ID to compare with original ID
          const storedItemId = layer.garment.id.replace(/^item-/, '')
          return storedItemId === String(item.id)
        })
        
        if (isAlreadyUsed) {
          return
        }
      }

      setSelectedOutfit(null)
      setPendingGarments(prev => {
        if (prev.some(g => g.id === item.id)) {
          return prev.filter(g => g.id !== item.id)
        }

        const totalIfAdded = outfitHistory.length + prev.length + 1

        if (totalIfAdded > MAX_OUTFIT_STACK_LAYERS || prev.length >= MAX_PENDING_GARMENTS) {
          return prev
        }

        return [...prev, item]
      })
    },
    [t, outfitHistory, outfitHistory.length]
  )

  const handleRemovePendingGarment = useCallback((itemId: number) => {
    setPendingGarments(prev => prev.filter(g => g.id !== itemId))
  }, [])

  const handleOutfitSelect = useCallback((outfit: Outfit) => {
    setPendingGarments([])
    setSelectedOutfit(outfit)
  }, [])

  // Handler for selecting items from a public collection
  const handlePublicCollectionSelect = useCallback(
    (collection: any) => {
      // console.log('[TryOnComponent] Public collection selected:', collection)

      // If there's data that would be lost, show confirmation modal
      if (hasDataToReset) {
        setPendingPublicCollection(collection)
        setShowPublicCollectionWarning(true)
        return
      }

      // No data to lose, proceed directly with adding items
      applyPublicCollectionSelection(collection)
    },
    [hasDataToReset]
  )

  // Apply the public collection selection (add items and clear stack/poses)
  const applyPublicCollectionSelection = useCallback((collection: any) => {
    // console.log('[TryOnComponent] Applying public collection selection:', collection)

    if (!collection.items || collection.items.length === 0) return

    // Convert public items to WardrobeItem format and add to outfit stack
    collection.items.forEach((publicItem: any) => {
      const colors: string[] = publicItem.color ? [publicItem.color] : []

      const wardrobeItem: WardrobeCatalogItem = {
        id: publicItem.id,
        imageUrl: publicItem.imageUrl,
        imagePreview: publicItem.imageUrl,
        categoryName: 'Public Item',
        isPublic: true,
        isFavorite: false,
        comment: publicItem.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemSeasons: [],
        itemColors: colors,
        size: '',
        description:''
      }

      handleItemSelect(wardrobeItem)
    })
  }, [handleItemSelect])

  // Confirm public collection selection and clear stack/poses
  const handleConfirmPublicCollection = useCallback(() => {
    if (pendingPublicCollection) {
      // Preserve the base model layer (first layer) when clearing
      const baseModelLayer = outfitHistory.length > 0 ? outfitHistory[0] : null
      
      // Clear outfit stack and poses, but keep base model
      if (baseModelLayer) {
        setOutfitHistory([baseModelLayer])
      } else {
        setOutfitHistory([])
      }
      setCurrentOutfitIndex(0)
      setPendingGarments([])
      setSelectedOutfit(null)
      setGeneratedPoseImages([])
      setPoseImageFileNames([])
      setCurrentPoseIndex(0)

      // Apply the collection selection
      applyPublicCollectionSelection(pendingPublicCollection)
    }

    setShowPublicCollectionWarning(false)
    setPendingPublicCollection(null)
  }, [pendingPublicCollection, applyPublicCollectionSelection, outfitHistory])

  const handleCancelPublicCollection = useCallback(() => {
    setShowPublicCollectionWarning(false)
    setPendingPublicCollection(null)
  }, [])

  // Auto-load public items from URL params - only on first redirect to page
  useEffect(() => {
    const publicItemsParam = searchParams?.get('publicItems')

    // Only load if: public items param exists, model is loaded, and we haven't already loaded them
    if (publicItemsParam && modelImageUrl && !hasAutoLoadedPublicItemsRef.current) {
      hasAutoLoadedPublicItemsRef.current = true

      try {
        const itemsData = JSON.parse(decodeURIComponent(publicItemsParam))
        const itemsArray = Array.isArray(itemsData) ? itemsData : [itemsData]

        // console.log('[TryOnComponent] Auto-loading', itemsArray.length, 'public items (first time only)')

        // Add each item to pending garments
        itemsArray.forEach((itemData: any) => {
          const publicItem: WardrobeCatalogItem = {
            id: itemData.id,
            imageUrl: itemData.imageUrl,
            imagePreview: itemData.imageUrl,
            categoryName: itemData.comment || 'Public Item',
            isPublic: true,
            isFavorite: false,
            comment: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            itemSeasons: [],
            itemColors: itemData.color ? [itemData.color] : [],
            size: '',
            description: ''
          }

          // Call handleItemSelect to add the item
          handleItemSelect(publicItem)
        })
      } catch (err) {
        // console.error('Failed to parse public items from URL:', err)
      }
    }
  }, [searchParams, modelImageUrl, handleItemSelect])

  // Check if there are existing pose images that would be cleared
  const hasExistingPoseImages = useMemo(() => {
    if (generatedPoseImages.length > 0) return true

    const hasMultiplePosesInLayers = outfitHistory.some(layer => Object.keys(layer.poseImages).length > 1)

    if (hasMultiplePosesInLayers) return true
    if (poseImageFileNames.length > 0) return true

    return false
  }, [generatedPoseImages, outfitHistory, poseImageFileNames])

  const executeGenerate = useCallback(async () => {
    if (!displayImageUrl || isLoading || (pendingGarments.length === 0 && !selectedOutfit)) return

    const limitCheck = canGenerateTryOn(modelUserData)

    if (!limitCheck.canGenerate) {
      setError(limitCheck.message ?? t('tryOn.generating.limitReached') ?? 'Generation limit reached for today.')
      return
    }

    setError(null)
    setIsLoading(true)

    setLoadingMessage(
      selectedOutfit
        ? t('tryOn.generating.outfit').replace('{name}', selectedOutfit.name || t('tryOn.outfit'))
        : t('tryOn.generating.items').replace('{count}', pendingGarments.length.toString())
    )

    try {
      const token = ensureToken()
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex]

      if (!modelFileName) {
        throw new Error(t('tryOn.errors.modelNotLoaded'))
      }

      if (modelUserData) {
        setModelUserData({
          ...modelUserData,
          todayImageGeneratedCount: (modelUserData.todayImageGeneratedCount || 0) + 1
        })
      }

      const garmentFileNames = selectedOutfit
        ? [extractFileNameFromUrl(selectedOutfit.imageUrl || '')]
        : pendingGarments.map(item => extractFileNameFromUrl(item.imageUrl || ''))

      if (garmentFileNames.some(name => !name)) {
        throw new Error(t('tryOn.errors.extractFilenamesFailed'))
      }

      const allFileNames = [modelFileName, ...garmentFileNames]

      const outfitStackItemFilenames: string[] = []

      for (let i = 1; i <= currentOutfitIndex; i++) {
        const layer = outfitHistory[i]

        if (layer?.garment?.url) {
          const fileName = extractFileNameFromUrl(layer.garment.url)

          if (fileName) {
            outfitStackItemFilenames.push(fileName)
          }
        }
      }

      if (selectedOutfit) {
        const outfitFileName = extractFileNameFromUrl(selectedOutfit.imageUrl || '')

        if (outfitFileName) {
          outfitStackItemFilenames.push(outfitFileName)
        }
      } else {
        pendingGarments.forEach(item => {
          const itemFileName = extractFileNameFromUrl(item.imageUrl || '')

          if (itemFileName) {
            outfitStackItemFilenames.push(itemFileName)
          }
        })
      }

      const clothingItemIdsPayload =
        !selectedOutfit && pendingGarments.length ? pendingGarments.map(item => item.id) : undefined

      // Debug: Log clothing item IDs and outfit stack items
      // console.log(' DEBUG geminiTryOn - ClothingItemIds & OutfitStack Info:')
      // console.log('  selectedOutfit:', selectedOutfit ? `${selectedOutfit.name} (ID: ${selectedOutfit.id})` : 'None')
      // console.log('  pendingGarments.length:', pendingGarments.length)
      // console.log('  clothingItemIdsPayload:', clothingItemIdsPayload)
      // console.log('  outfitStackItemFilenames:', outfitStackItemFilenames)
      // console.log('  outfitHistory layers (excluding base):')

      for (let i = 1; i <= currentOutfitIndex; i++) {
        const layer = outfitHistory[i]

        // console.log(`    Layer ${i}: ${layer?.garment?.name || 'Unknown'} - URL: ${layer?.garment?.url?.substring(0, 80)}...`)
      }

      if (clothingItemIdsPayload) {
        // console.log('  clothingItemIdsPayload.length:', clothingItemIdsPayload.length)
        // console.log(
        //   '  clothingItemIdsPayload values:',
        //   clothingItemIdsPayload.map((id, idx) => `  [${idx}]: ${id} (type: ${typeof id})`).join('\n')
        // )
        // console.log(
        //   '  pendingGarments details:',
        //   pendingGarments.map((g, idx) => `  [${idx}]: id=${g.id}, category=${g.categoryName}`).join('\n')
        // )
      }

      const response = await workshopService.geminiTryOn(
        {
          Images: allFileNames,
          ...(outfitStackItemFilenames.length > 0 ? { OutfitStackItems: outfitStackItemFilenames } : {}),
          ...(clothingItemIdsPayload && clothingItemIdsPayload.length
            ? { clothingItemIds: clothingItemIdsPayload }
            : {})
        },
        '/Workshop/multiTryOn'
      )

      if (response.historyBoardId) {
        setCurrentHistoryBoardId(response.historyBoardId)
      }

      if (response.fileName) {
        setModelFileName(response.fileName)
      }

      // Use presigned URL directly for display and filename extraction
      const renderedImage = response.imageUrl || ''
      const renderedFileName = extractFileNameFromUrl(renderedImage) || response.fileName || ''

      const poseImage: PoseImage = {
        url: renderedImage,
        fileName: renderedFileName
      }

      const newLayers: OutfitLayer[] = selectedOutfit
        ? [
            {
              garment: {
                id: `outfit-${selectedOutfit.id}`,
                name: selectedOutfit.name || t('tryOn.outfit'),
                url: selectedOutfit.imageUrl!
              },
              poseImages: { [currentPoseInstruction]: poseImage }
            }
          ]
        : pendingGarments.map((item, index) => {
            const garmentInfo: TryOnWardrobeItem = {
              id: `item-${item.id}`,
              name: item.isPublic ? t('tryOn.publicItemLabel') || 'Public Item' : (item.comment || `Item #${item.id}`),
              url: item.imageUrl!,
              isPublic: item.isPublic
            }

            return {
              garment: garmentInfo,
              poseImages: index === pendingGarments.length - 1 ? { [currentPoseInstruction]: poseImage } : {}
            }
          })

      // Clear pose image filenames array on new try-on attempt
      setPoseImageFileNames([])

      // Clear generated pose images gallery
      setGeneratedPoseImages([])

      setOutfitHistory(prev => {
        const trimmed = prev.slice(0, currentOutfitIndex + 1)
        const updated = [...trimmed, ...newLayers]


        // Limit outfit stack to max 8 layers
        if (updated.length > MAX_OUTFIT_STACK_LAYERS) {
          return updated.slice(0, MAX_OUTFIT_STACK_LAYERS)
        }

        return updated
      })

      setCurrentOutfitIndex(prev => {
        const newIndex = prev + (selectedOutfit ? 1 : pendingGarments.length)


        // Ensure current index doesn't exceed max layers - 1
        return Math.min(newIndex, MAX_OUTFIT_STACK_LAYERS - 1)
      })
      setPendingGarments([])
      setSelectedOutfit(null)
      setError(null)

      // Show success message
      showSuccessToast(
        selectedOutfit
          ? t('tryOn.outfitGeneratedSuccessfully') || 'Outfit generated successfully!'
          : t('tryOn.itemsGeneratedSuccessfully') || 'Items generated successfully!'
      )
    } catch (err) {
      if (modelUserData) {
        setModelUserData({
          ...modelUserData,
          todayImageGeneratedCount: Math.max(0, (modelUserData.todayImageGeneratedCount || 1) - 1)
        })
      }

      const errorMessage = err instanceof Error ? err.message : t('tryOn.errors.applyGarmentsFailed')

      setError(
        getFriendlyErrorMessage(err, errorMessage, {
          humanModelRequired: t('tryOn.errors.humanModelRequired'),
          generationFailed: t('tryOn.errors.generationFailed'),
          noImageDetected: t('tryOn.errors.noImageDetected')
        })
      )
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [
    displayImageUrl,
    pendingGarments,
    selectedOutfit,
    currentOutfitIndex,
    currentPoseIndex,
    modelFileName,
    modelUserData,
    t,
    ensureToken
  ])

  // Handler that checks for existing poses before generating
  const handleGenerate = useCallback(() => {
    if (!displayImageUrl || isLoading || (pendingGarments.length === 0 && !selectedOutfit)) return

    // Check if there are existing pose images that would be cleared
    if (hasExistingPoseImages) {
      setShowGenerateWarning(true)
      return
    }

    // No poses to clear, proceed directly
    void executeGenerate()
  }, [displayImageUrl, isLoading, pendingGarments, selectedOutfit, hasExistingPoseImages, executeGenerate])

  // Confirm generate and clear poses
  const handleConfirmGenerate = useCallback(() => {
    setShowGenerateWarning(false)
    void executeGenerate()
  }, [executeGenerate])

  // Cancel generate
  const handleCancelGenerate = useCallback(() => {
    setShowGenerateWarning(false)
  }, [])

  // Delete model handlers
  const handleDeleteModel = useCallback(
    (model: ModelImage) => {
      // Don't allow deleting the currently selected model if it's the only one
      if (modelImages.length <= 1) {
        return
      }

      // Check if this is the default model
      if (model.isDefault) {
        // Show warning that default model cannot be deleted
        setShowDeleteDefaultWarning(true)
        return
      }

      setPendingDeleteModel(model)
      setShowDeleteWarning(true)
    },
    [modelImages.length]
  )

  const handleConfirmDelete = useCallback(async () => {
    // console.log(' [handleConfirmDelete] Starting delete process')
    // console.log('  pendingDeleteModel:', pendingDeleteModel)
    // console.log('  modelImageUrl:', modelImageUrl)

    if (!pendingDeleteModel?.fileName) {
      // console.log('⚠️ [handleConfirmDelete] No fileName found, aborting')
      setShowDeleteWarning(false)
      setPendingDeleteModel(null)
      return
    }

    setIsDeletingModel(true)

    try {
      // console.log(' [handleConfirmDelete] Calling deleteModelPicture with fileName:', pendingDeleteModel.fileName)
      await workshopService.deleteModelPicture(pendingDeleteModel.fileName)
      // console.log(' [handleConfirmDelete] Model picture deleted successfully')

      // Extract filenames from URLs using regex to handle presigned URLs
      const extractFilenameFromUrl = (url: string): string => {
        // Extract filename from URL: https://example.com/path/filename.jpg?signature=...
        const match = url.match(/\/([^/?]+\.[^/?]+)(?:\?|$)/)

        return match ? match[1] : ''
      }

      const displayedFileName = modelImageUrl ? extractFilenameFromUrl(modelImageUrl) : ''
      const deletedFileName = pendingDeleteModel.imageUrl ? extractFilenameFromUrl(pendingDeleteModel.imageUrl) : ''

      // console.log(' [handleConfirmDelete] Comparing filenames (extracted from presigned URLs):')
      // console.log('  displayedFileName:', displayedFileName)
      // console.log('  deletedFileName:', deletedFileName)
      // console.log('  Are they equal?', displayedFileName === deletedFileName)

      if (displayedFileName && deletedFileName && displayedFileName === deletedFileName) {
        // console.log(' Deleted model is currently displayed - clearing canvas display')
        setModelImageUrl(null)
        setModelFileName(null)
        setOutfitHistory([])
        setCurrentOutfitIndex(0)
        setCurrentPoseIndex(0)
        setError(null)
      } else {
        // console.log(' Deleted model was NOT the displayed model')
      }

      // If we're deleting the currently selected model, clear selection
      if (selectedModelIndex !== null && modelImages[selectedModelIndex]?.id === pendingDeleteModel.id) {
        // console.log(' [handleConfirmDelete] Deleting currently selected model, clearing selection')
        setSelectedModelIndex(null)
      }

      // Refresh model images
      // console.log(' [handleConfirmDelete] Refreshing model gallery')
      setIsLoadingModelUser(true)
      await fetchModelUserData()
      // console.log(' [handleConfirmDelete] Model gallery refreshed')

      setShowDeleteWarning(false)
      setPendingDeleteModel(null)
    } catch (error) {
      // console.error(' [handleConfirmDelete] Error deleting model:', error)
      setError(t('tryOn.errors.deleteModelFailed'))
    } finally {
      setIsDeletingModel(false)
      // console.log(' [handleConfirmDelete] Delete process completed')
    }
  }, [pendingDeleteModel, modelImageUrl, selectedModelIndex, modelImages, fetchModelUserData, t])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteWarning(false)
    setPendingDeleteModel(null)
  }, [])

  const handleSetDefaultModel = useCallback(async (model: ModelImage) => {
    if (!model.fileName) {
      showErrorToast('Invalid model: missing filename')
      return
    }

    try {
      await workshopService.setDefaultModel(model.fileName)
      
      // Refresh model images to update the default badge
      setIsLoadingModelUser(true)
      await fetchModelUserData()
    } catch (err: any) {
      showErrorToast(err?.message || 'Failed to set default model')
    }
  }, [fetchModelUserData])

  const handleRemoveGarment = (index: number) => {
    setOutfitHistory(prev => prev.filter((_, i) => i !== index))

    if (currentOutfitIndex >= index && currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prev => prev - 1)
    }
  }

  const handleResetOutfit = () => {
    setOutfitHistory(prev => [prev[0]])
    setCurrentOutfitIndex(0)
    setPendingGarments([])
    setSelectedOutfit(null)
    setError(null)
  }

  const handlePoseSelect = useCallback(
    async (newIndex: number) => {
      if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return

      const poseInstruction = POSE_INSTRUCTIONS[newIndex]
      const currentLayer = outfitHistory[currentOutfitIndex]

      if (!currentLayer) return

      if (currentLayer.poseImages[poseInstruction]) {
        setCurrentPoseIndex(newIndex)
        return
      }

      const baseImage = Object.values(currentLayer.poseImages)[0]

      if (!baseImage) return

      setError(null)
      setIsLoading(true)
      setLoadingMessage(t('tryOn.changingPose'))
      const previousPoseIndex = currentPoseIndex

      setCurrentPoseIndex(newIndex)

      try {
        // Extract filename from presigned URL - now stored as PoseImage object
        const imageFileName = baseImage.fileName || extractFileNameFromUrl(baseImage.url)

        // console.log(' handlePoseSelect: Starting pose variation')
        // console.log('  Current modelFileName:', modelFileName)
        // console.log('  Requesting new pose:', poseInstruction)
        // console.log('  Using image filename for API:', imageFileName)

        const response = await workshopService.requestPoseVariation({
          Images: [imageFileName],
          PoseInstruction: poseInstruction
        })

        // console.log('📸 Pose variation API response:', {
        //   imageUrl: response.imageUrl,
        //   fileName: response.fileName
        // })

        // Store both URL and extracted filename in PoseImage object
        const newPoseImage: PoseImage = {
          url: response.imageUrl || '',
          fileName: extractFileNameFromUrl(response.imageUrl || '') || response.fileName || ''
        }

        // console.log(' New PoseImage object:', {
        //   fileName: newPoseImage.fileName,
        //   url: newPoseImage.url?.substring(0, 100) + '...' // Truncate long URL for readability
        // })

        setOutfitHistory(prev => {
          const updated = [...prev]
          const layer = { ...updated[currentOutfitIndex] }

          layer.poseImages = {
            ...layer.poseImages,
            [poseInstruction]: newPoseImage
          }
          updated[currentOutfitIndex] = layer
          return updated
        })

        // console.log(' Updating modelFileName from:', modelFileName, 'to:', newPoseImage.fileName)
        // console.log(' Adding to poseImageFileNames:', newPoseImage.fileName)

        // Update modelFileName to current displayed pose image's filename
        setModelFileName(newPoseImage.fileName)

        // Add new pose image filename to tracking array
        setPoseImageFileNames(prev => {
          const updated = [...prev, newPoseImage.fileName]

          // console.log('Updated poseImageFileNames array:', updated)
          return updated
        })

        // Add generated pose image to the gallery
        setGeneratedPoseImages(prev => {
          const exists = prev.some(img => img.poseInstruction === poseInstruction)

          if (exists) {
            return prev.map(img =>
              img.poseInstruction === poseInstruction ? { ...img, imageUrl: newPoseImage.url } : img
            )
          }

          return [...prev, { poseInstruction, imageUrl: newPoseImage.url }]
        })

        // console.log(' Pose variation complete for:', poseInstruction)

        // Show success message
        showSuccessToast(t('tryOn.poseGeneratedSuccessfully') || 'Pose generated successfully!')
      } catch (err) {
        setError(getFriendlyErrorMessage(err, t('tryOn.errors.changePoseFailed')))
        setCurrentPoseIndex(previousPoseIndex)
      } finally {
        setIsLoading(false)
        setLoadingMessage('')
      }
    },
    [currentPoseIndex, outfitHistory, currentOutfitIndex, isLoading, t]
  )

  const outfitStackCount = outfitHistory.length - 1 + pendingGarments.length + (selectedOutfit ? 1 : 0)

  const toggleSeason = (season: string) => {
    setSelectedSeasons(prev => (prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]))
  }

  const handleSaveOutfit = async () => {
    // Validation: Check if outfit was generated
    if (activeOutfitLayers.length < MIN_LAYERS_TO_SAVE || !currentHistoryBoardId) {
      showErrorToast(t('tryOn.wardrobe.errors.noOutfitToSave') || 'No try-on result to save. Please generate an outfit first.')
      return
    }

    // Validation: Check outfit name
    if (!outfitName.trim()) {
      showErrorToast(t('tryOn.wardrobe.errors.outfitNameRequired') || 'Please enter an outfit name')
      return
    }

    // Validation: Check seasons
    if (selectedSeasons.length === 0) {
      showErrorToast(t('tryOn.wardrobe.errors.seasonRequired') || 'Please select at least one season')
      return
    }

    // Validation: Check if outfit contains only public items
    const garmentLayers = activeOutfitLayers.slice(1).filter(layer => layer.garment !== null)
    const allItemsArePublic = garmentLayers.length > 0 && garmentLayers.every(layer => layer.garment?.isPublic === true)

    if (allItemsArePublic) {
      showErrorToast(t('tryOn.errors.cannotSaveOnlyPublicItems') || 'Cannot save outfit with only public collection items. Please add items from your wardrobe.')
      return
    }

    // Check if outfit contains any public items (but not all)
    const hasPublicItems = garmentLayers.some(layer => layer.garment?.isPublic === true)

    if (hasPublicItems) {
      setShowSaveOutfitPublicItemsWarning(true)
      return
    }

    await executeOutfitSave()
  }

  const executeOutfitSave = useCallback(async () => {
    setIsSavingOutfit(true)

    try {
      const clothingItemIds = activeOutfitLayers
        .slice(1)
        .map(layer => {
          if (!layer.garment) return null

          // Only include non-public items
          if (layer.garment.isPublic === true) return null
          const numericId = parseInt(layer.garment.id.split('-').pop() || '', 10)

          return Number.isNaN(numericId) ? null : numericId
        })
        .filter((id): id is number => id !== null)

      // Collect all filenames from poseImages in the current outfit layer
      const currentLayer = outfitHistory[currentOutfitIndex]
      const allModelFileNames: string[] = []

      if (currentLayer && Object.keys(currentLayer.poseImages).length > 0) {
        Object.values(currentLayer.poseImages).forEach(poseImage => {
          if (poseImage.fileName && !allModelFileNames.includes(poseImage.fileName)) {
            allModelFileNames.push(poseImage.fileName)
          }
        })
      }

      // console.log(' Saving outfit with modelFileName array:', allModelFileNames)

      await workshopService.saveTryOnOutfit({
        HistoryBoardId: currentHistoryBoardId!,
        Name: outfitName.trim(),
        Seasons: selectedSeasons.length ? selectedSeasons : undefined,
        IsFavorite: outfitIsFavorite,
        modelFileName: allModelFileNames.length ? allModelFileNames : undefined,
        ClothingItemIds: clothingItemIds.length ? clothingItemIds : undefined
      })

      // Show success toast
      showSuccessToast(t('tryOn.outfitSavedSuccessfully') || 'Outfit saved successfully!')

      // Reset form
      setShowSaveModal(false)
      setOutfitName('')
      setSelectedSeasons([])
      setOutfitIsFavorite(false)
      setError(null)
    } catch (err) {
      const errorMessage = getFriendlyErrorMessage(err, t('tryOn.errors.saveOutfitFailed') || 'Failed to save outfit')

      showErrorToast(errorMessage)
    } finally {
      setIsSavingOutfit(false)
    }
  }, [outfitName, selectedSeasons, outfitIsFavorite, currentHistoryBoardId, activeOutfitLayers, currentOutfitIndex, outfitHistory, t])

  const handleConfirmSaveWithPublicItems = useCallback(() => {
    setShowSaveOutfitPublicItemsWarning(false)
    void executeOutfitSave()
  }, [executeOutfitSave])

  const handleCancelSaveWithPublicItems = useCallback(() => {
    setShowSaveOutfitPublicItemsWarning(false)
  }, [])

  // Exit warning handlers
  const handleConfirmExit = useCallback(() => {
    setShowExitWarning(false)
    setIsLoading(false)
    window.location.href = '/'
  }, [])

  const handleCancelExit = useCallback(() => {
    setShowExitWarning(false)
  }, [])

  // Warn user before leaving page during generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isLoading])

  return (
    <Box component='main' sx={{ bgcolor: 'background.default', color: 'text.primary', height: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'hidden'
        }}
      >
        {/* Main Content Area - Canvas + Sidebar */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          {/* Canvas Area - Takes remaining space */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              overflow: 'hidden',

              // On mobile, add padding bottom to account for fixed drawer handle
              pb: { xs: isSheetCollapsed ? '56px' : 0, md: 0 },
              transition: 'padding 0.3s ease'
            }}
          >
            <CanvasDisplay
              displayImageUrl={displayImageUrl}
              onStartOver={handleStartOver}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              onSelectPose={handlePoseSelect}
              poseInstructions={POSE_INSTRUCTIONS}
              currentPoseIndex={currentPoseIndex}
              availablePoseKeys={availablePoseKeys}
              showPoseMenu={outfitHistory.length > 0}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
              onShare={() => {
                setShareImageUrl(displayImageUrl)
                setIsShareOpen(true)
              }}
              associatedItems={associatedItems}
              isLoadingItems={isLoadingItems}
              modelImages={modelImages}
              isLoadingModels={isLoadingModelUser}
              onModelSelect={handleModelSelect}
              onAddModel={handleAddModel}
              onAddModelFromPanel={handleAddModelFromPanel}
              onDeleteModel={handleDeleteModel}
              onSetDefaultModel={handleSetDefaultModel}
              selectedModelId={selectedModelIndex}
              showModelPanel={showModelPanel}
              onModelPanelChange={setShowModelPanel}
            />
          </Box>

          {/* Sidebar / Bottom Sheet */}
          <Box
            component='aside'
            sx={{
              // Desktop: Fixed width sidebar on right
              // Mobile: Fixed bottom sheet that slides up from viewport bottom
              position: { xs: 'fixed', md: 'relative' },
              bottom: 0,
              left: 0,
              right: 0,
              height: { xs: '65vh', md: '100%' },
              width: { xs: '100vw', md: '40%' },
              maxWidth: { xs: '100vw', md: 500 },
              minWidth: { md: 380 },
              overflow: 'hidden',
              borderTop: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: { xs: '0 -4px 20px rgba(0,0,0,0.15)', md: 'none' },
              borderRadius: { xs: '10px 10px 0 0', md: 1 },

              // Mobile slide animation - slides down to show only handle when collapsed
              transform: {
                xs: isSheetCollapsed ? 'translateY(calc(100% - 56px))' : 'translateY(0)',
                md: 'translateY(0)'
              },
              transition: 'transform 0.3s ease-in-out',
              zIndex: { xs: 100, md: 'auto' }
            }}
          >
            {/* Mobile Sheet Handle */}
            <Button
              onClick={() => setIsSheetCollapsed(prev => !prev)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                height: 56,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'transparent',
                borderRadius: 0,
                minHeight: 56,
                flexDirection: 'column',
                gap: 0.5,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              aria-label={isSheetCollapsed ? t('tryOn.expandPanel') : t('tryOn.collapsePanel')}
            >
              {/* Drag indicator bar */}
              <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
              {isSheetCollapsed ? (
                <ChevronUpIcon style={{ width: 20, height: 20, color: 'var(--mui-palette-text-secondary)' }} />
              ) : (
                <ChevronDownIcon style={{ width: 20, height: 20, color: 'var(--mui-palette-text-secondary)' }} />
              )}
            </Button>

            {/* Sidebar Content */}
            <Box
              sx={{
                display: 'flex',
                height: { xs: 'calc(100% - 56px)', md: '100%' },
                flexDirection: 'column',
                p: { xs: 2, md: 2.5 },
                pb: { xs: 3, md: 2.5 },
                overflow: 'hidden'
              }}
            >
              {error && (
                <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}>
                  {/* <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                    {t('tryOn.errors.somethingWentWrong')}
                  </Typography> */}
                  <Typography variant='subtitle2'>{t('tryOn.errors.generateFailed')}</Typography>
                </Alert>
              )}

              {/* Action Buttons - Generate & Save */}
              <Box sx={{ mb: 2, flexShrink: 0, display: 'flex', gap: 1 }}>
                <Button
                  id='intro-save-button'
                  variant='outlined'
                  onClick={() => setShowSaveModal(true)}
                  disabled={!currentHistoryBoardId || activeOutfitLayers.length < MIN_LAYERS_TO_SAVE}
                  sx={{ flex: { xs: 1, md: 'none' }, minWidth: { md: 120 } }}
                >
                  {t('tryOn.saveOutfit') || 'Save'}
                </Button>
                <Button
                  id='intro-generate-button'
                  variant='contained'
                  onClick={handleGenerate}
                  disabled={isLoading || (pendingGarments.length === 0 && !selectedOutfit)}
                  sx={{
                    flex: { xs: 2, md: 1 },
                    py: 1.25,
                    borderRadius: 2,
                    fontWeight: 600,
                    background:
                      pendingGarments.length === 0 && !selectedOutfit
                        ? 'action.disabledBackground'
                        : 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                    color: 'white',
                    boxShadow: 2
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} sx={{ color: 'white' }} />
                      <Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {t('tryOn.generating.label')}
                      </Typography>
                    </Box>
                  ) : selectedOutfit ? (
                    t('tryOn.generateOutfit')
                  ) : (
                    `${t('tryOn.generate')}${pendingGarments.length > 0 ? ` (${pendingGarments.length})` : ''}`
                  )}
                </Button>
              </Box>

              {/* Mobile Tab Navigation */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  gap: 0,
                  mb: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0
                }}
              >
                <Button
                  onClick={() => setSidebarTab('wardrobe')}
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1,
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    borderRadius: 0,
                    borderBottom: '2px solid',
                    borderColor: sidebarTab === 'wardrobe' ? 'primary.main' : 'transparent',
                    color: sidebarTab === 'wardrobe' ? 'primary.main' : 'text.secondary',
                    bgcolor: 'transparent'
                  }}
                >
                  {t('tryOn.wardrobe.title')}
                </Button>
                <Button
                  onClick={() => setSidebarTab('stack')}
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1,
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    borderRadius: 0,
                    borderBottom: '2px solid',
                    borderColor: sidebarTab === 'stack' ? 'primary.main' : 'transparent',
                    color: sidebarTab === 'stack' ? 'primary.main' : 'text.secondary',
                    bgcolor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {t('tryOn.outfitStackTitle')}
                  {outfitStackCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {outfitStackCount}
                    </Box>
                  )}
                </Button>
              </Box>

              {/* Mobile Content - Tab Based */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  flex: 1,
                  overflow: 'hidden',
                  flexDirection: 'column',
                  minHeight: 0
                }}
              >
                {sidebarTab === 'stack' ? (
                  <Box sx={{ overflowY: 'auto', flex: 1, pr: 0.5 }}>
                    <OutfitStack
                      outfitHistory={activeOutfitLayers}
                      onRemoveGarment={handleRemoveGarment}
                      onResetOutfit={handleResetOutfit}
                      pendingGarments={pendingGarments}
                      selectedOutfit={selectedOutfit}
                      onRemovePendingGarment={handleRemovePendingGarment}
                      onRemoveOutfit={() => setSelectedOutfit(null)}
                      isLoading={isLoading}
                    />
                    {/* Mobile Pose Gallery */}
                    {generatedPoseImages.length > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1.5 }}>
                          {t('tryOn.poseGallery.title') || 'Generated Poses'}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                          {generatedPoseImages.map((poseImg, index) => (
                            <Box
                              key={`pose-mobile-${index}`}
                              onClick={() => setEnlargedImage(poseImg.imageUrl)}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                aspectRatio: '1',
                                '&:hover': { borderColor: 'primary.main' }
                              }}
                            >
                              <Box
                                component='img'
                                src={poseImg.imageUrl}
                                alt={poseImg.poseInstruction}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <WardrobeTabsContent
                    userId={user?.id}
                    onItemSelect={handleItemSelect}
                    onOutfitSelect={handleOutfitSelect}
                    onPublicCollectionSelect={handlePublicCollectionSelect}
                    showUploadButton={true}
                    compactMode={true}
                    selectedItems={pendingGarments}
                    isLoading={isLoading}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  flex: 1,
                  overflow: 'hidden',
                  gap: 2,
                  flexDirection: 'column'
                }}
              >
                {/* Desktop: Two Column Layout */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 2, minHeight: 0 }}>
                  {/* Left Column: Outfit Stack + Pose Gallery */}
                  <Box
                    sx={{
                      width: '45%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      borderColor: 'divider',
                      pr: 2
                    }}
                  >
                    {/* Outfit Stack */}
                    <Box
                      sx={{
                        flex: generatedPoseImages.length > 0 ? 'none' : 2,
                        maxHeight: generatedPoseImages.length > 0 ? '75%' : '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                          flexShrink: 0
                        }}
                      >
                        <Typography variant='subtitle1' fontWeight={600}>
                          {t('tryOn.outfitStackTitle') || 'Outfit Stack'}
                        </Typography>
                        {outfitStackCount > 0 && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {outfitStackCount}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ overflowY: 'auto', flex: 1, pr: 0.5 }}>
                        <OutfitStack
                          outfitHistory={activeOutfitLayers}
                          onRemoveGarment={handleRemoveGarment}
                          onResetOutfit={handleResetOutfit}
                          pendingGarments={pendingGarments}
                          selectedOutfit={selectedOutfit}
                          onRemovePendingGarment={handleRemovePendingGarment}
                          onRemoveOutfit={() => setSelectedOutfit(null)}
                          isLoading={isLoading}
                        />
                      </Box>
                    </Box>

                    {/* Pose Gallery */}
                    {generatedPoseImages.length > 0 && (
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          pt: 1.5,
                          mt: 1.5,
                          minHeight: 0
                        }}
                      >
                        <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 1.5, flexShrink: 0 }}>
                          {t('tryOn.poseGallery.title') || 'Generated Poses'}
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 1,
                            overflow: 'auto',
                            pr: 0.5
                          }}
                        >
                          {generatedPoseImages.map((poseImg, index) => (
                            <Box
                              key={`pose-${index}`}
                              onClick={() => setEnlargedImage(poseImg.imageUrl)}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                aspectRatio: '1',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                  borderColor: 'primary.main',
                                  boxShadow: 2
                                }
                              }}
                            >
                              <Box
                                component='img'
                                src={poseImg.imageUrl}
                                alt={poseImg.poseInstruction}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Right Column: Wardrobe */}
                  <Box
                    id='intro-wardrobe-sidebar'
                    sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 1.5, flexShrink: 0 }}>
                      {t('tryOn.wardrobe.title')}
                    </Typography>
                    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <WardrobeTabsContent
                        userId={user?.id}
                        onItemSelect={handleItemSelect}
                        onOutfitSelect={handleOutfitSelect}
                        onPublicCollectionSelect={handlePublicCollectionSelect}
                        showUploadButton={true}
                        compactMode={true}
                        selectedItems={pendingGarments}
                        isLoading={isLoading}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <AnimatePresence>
          {isLoading && isMobile && (
            <motion.div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spinner />
                {loadingMessage && (
                  <Typography variant='h6' sx={{ mt: 2, px: 2, textAlign: 'center', fontWeight: 500, color: 'white' }}>
                    {loadingMessage}
                  </Typography>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <HistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyImages={historyImages}
        isLoading={isLoadingHistory}
        onRefresh={fetchHistory}
        onImageClick={image => {
          setIsHistoryModalOpen(false)
          handleHistoryImageClick(image)
        }}
      />

      <ShareDialog open={isShareOpen} onClose={() => setIsShareOpen(false)} imageId={shareImageUrl} />

      <EnlargedImageModal
        open={Boolean(enlargedImage)}
        imageUrl={enlargedImage}
        onClose={() => setEnlargedImage(null)}
      />

      <Dialog open={showSaveModal} onClose={() => setShowSaveModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle component='div' sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('tryOn.saveOutfitTitle') || 'Save outfit'}</span>
          <Button
            onClick={() => setShowSaveModal(false)}
            size='small'
            sx={{ minWidth: 'auto', p: 0.5 }}
            disabled={isSavingOutfit}
          >
            <i className='tabler-x' />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Outfit Name Input */}
            <TextField
              label={t('tryOn.outfitName') || 'Outfit name'}
              value={outfitName}
              onChange={e => setOutfitName(e.target.value)}
              fullWidth
              placeholder={t('tryOn.namePlaceholder') || 'Enter outfit name...'}
              helperText={outfitName ? `${outfitName.length} characters` : ''}
            />

            {/* Season Selection */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                {t('tryOn.seasons') || 'Seasons'}
              </Typography>
              {selectedSeasons.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedSeasons.map(season => (
                    <Chip
                      key={season}
                      label={season}
                      onDelete={() => setSelectedSeasons(prev => prev.filter(s => s !== season))}
                      size='small'
                      color='success'
                      variant='outlined'
                    />
                  ))}
                </Box>
              )}
              <FormControl fullWidth>
                <Select
                  multiple
                  value={selectedSeasons}
                  onChange={e => {
                    const value = e.target.value as string[]

                    setSelectedSeasons(value)
                  }}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} size='small' color='success' variant='outlined' />
                      ))}
                    </Box>
                  )}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '30vh'
                      }
                    },
                    MenuListProps: {
                      sx: {
                        maxHeight: '30vh',
                        overflow: 'auto'
                      }
                    }
                  }}
                >
                  {SEASON_DATA.map(season => (
                    <MenuItem key={season} value={season}>
                      {season}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveModal(false)} disabled={isSavingOutfit}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleSaveOutfit} disabled={isSavingOutfit} variant='contained'>
            {isSavingOutfit ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('common.save') || 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* StartScreen Modal - shown when "Add Model" is clicked */}
      <Dialog
        open={showStartScreen}
        onClose={() => setShowStartScreen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <StartScreen
            onModelFinalized={handleStartScreenModelFinalized}
            onGenerateModel={handleGenerateModel}
            isAuthenticated={isAuthenticated}
            modelUserData={modelUserData}
            isRestarting={true}
          />
        </DialogContent>
      </Dialog>

      {/* Model Change Warning Modal */}
      <Dialog open={showModelChangeWarning} onClose={handleCancelModelChange} maxWidth='xs' fullWidth>
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.modelChangeWarning.title') || 'Change Model?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.modelChangeWarning.message') ||
              'Changing the model will reset your current outfit stack and all generated pose images. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelModelChange} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmModelChange} variant='contained' color='error'>
            {t('tryOn.modelChangeWarning.confirm') || 'Change Model'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Public Collection Warning Modal */}
      <Dialog open={showPublicCollectionWarning} onClose={handleCancelPublicCollection} maxWidth='xs' fullWidth>
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.publicCollectionWarning.title') || 'Load Public Collection?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.publicCollectionWarning.message') ||
              'Loading this public collection will reset your current outfit stack and all generated pose images. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPublicCollection} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmPublicCollection} variant='contained' color='error'>
            {t('tryOn.publicCollectionWarning.confirm') || 'Load Collection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Warning Modal - shown when pose images exist */}
      {/* Generate Warning Modal */}
      <Dialog
        open={showGenerateWarning}
        onClose={handleCancelGenerate}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.generateWarning.title') || 'Generate New Outfit?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.generateWarning.message') ||
              'Generating a new outfit will clear all your current pose images in the Pose Gallery. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelGenerate} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmGenerate} variant='contained' color='primary'>
            {t('tryOn.generateWarning.confirm') || 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Selection Warning Modal */}
      <Dialog
        open={showHistorySelectionWarning}
        onClose={handleCancelHistorySelection}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.historyWarning.title') || 'Load History Outfit?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.historyWarning.message') || 'Your Pose Gallery contains generated pose images. Loading this history outfit will clear all pose images to make room for future pose variation generation. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelHistorySelection} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmHistorySelection} variant='contained' color='primary'>
            {t('tryOn.historyWarning.confirm') || 'Load'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Default Model Warning Modal - Cannot delete */}
      <Dialog open={showDeleteDefaultWarning} onClose={() => setShowDeleteDefaultWarning(false)} maxWidth='xs' fullWidth>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'warning.lighterOpacity',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-alert-triangle' style={{ fontSize: '2rem', color: 'var(--mui-palette-warning-main)' }} />
            </Box>
            <Typography variant='h6' sx={{ fontWeight: 700, textAlign: 'center' }}>
              {t('tryOn.deleteWarning.cannotDeleteDefault') || 'Cannot Delete Default Model'}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
              {t('tryOn.deleteWarning.cannotDeleteDefaultDesc') ||
                'The default model cannot be deleted. Please set another model as default first before deleting this one.'}
            </Typography>
            <Button
              onClick={() => setShowDeleteDefaultWarning(false)}
              variant='contained'
              fullWidth
              sx={{ mt: 1 }}
            >
              {t('tryOn.deleteWarning.understood') || 'Understood'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Model Confirmation Modal */}
      <Dialog open={showDeleteWarning} onClose={handleCancelDelete} maxWidth='xs' fullWidth>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'error.lighterOpacity',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-trash' style={{ fontSize: '2rem', color: 'var(--mui-palette-error-main)' }} />
            </Box>
            <Typography variant='h6' sx={{ fontWeight: 700, textAlign: 'center' }}>
              {t('tryOn.deleteWarning.title') || 'Delete Model?'}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
              {t('tryOn.deleteWarning.message') ||
                'Are you sure you want to delete this model picture? This action cannot be undone.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 1 }}>
              <Button onClick={handleCancelDelete} variant='outlined' fullWidth disabled={isDeletingModel}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant='contained'
                color='error'
                fullWidth
                disabled={isDeletingModel}
                startIcon={isDeletingModel ? <CircularProgress size={16} color='inherit' /> : undefined}
              >
                {t('tryOn.deleteWarning.confirm') || 'Delete'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Start Over Warning Modal */}
      <Dialog open={showStartOverWarning} onClose={handleCancelStartOver} maxWidth='xs' fullWidth>
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.startOverWarning.title') || 'Start Over?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.startOverWarning.message') ||
              'This will clear your model, all outfit layers, pending items, and generated pose images. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStartOver} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmStartOver} variant='contained' color='error'>
            {t('tryOn.startOverWarning.confirm') || 'Start Over'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Outfit with Public Items Warning Modal */}
      <Dialog open={showSaveOutfitPublicItemsWarning} onClose={handleCancelSaveWithPublicItems} maxWidth='xs' fullWidth>
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.saveOutfitPublicItemsWarning.title') || 'Save Outfit with Public Items?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.saveOutfitPublicItemsWarning.message') ||
              'This outfit contains items from public collections that cannot be saved. Only items from your wardrobe will be recorded in the outfit.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSaveWithPublicItems} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmSaveWithPublicItems} variant='contained' color='primary'>
            {t('tryOn.saveOutfitPublicItemsWarning.confirm') || 'Continue Saving'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exit Warning Modal */}
      <Dialog open={showExitWarning} onClose={handleCancelExit} maxWidth='xs' fullWidth>
        <DialogTitle component='div' sx={{ pb: 1 }}>
          {t('tryOn.exitWarning.title') || 'Image Generation in Progress'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {t('tryOn.exitWarning.message') ||
              'Image generation is currently in progress. Leaving this page will cancel the generation. Are you sure you want to leave?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelExit} color='inherit'>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirmExit} variant='contained' color='error'>
            {t('tryOn.exitWarning.confirm') || 'Leave Page'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Button - Floating */}
      <Button
        onClick={() => {
          // Tạo intro instance mới mỗi lần click để đảm bảo có thể start lại
          const intro = introJs()

          // Bước 3: highlight khung add model nếu chưa có kết quả, hoặc highlight hình ảnh kết quả nếu đã có
          const hasResult = Boolean(displayImageUrl)
          const resultImage = document.getElementById('intro-result-image')
          const saveButton = document.getElementById('intro-save-button')

          const steps: Array<{ element: string; intro: string; position: 'left' | 'right' | 'top' | 'bottom' }> = [
            {
              element: '#intro-wardrobe-sidebar',
              intro: t('tryOn.intro.stepWardrobe') || 'Chọn trang phục để thử đồ (tối đa 4 món để hiển thị đẹp nhất)',
              position: 'left'
            },
            {
              element: '#intro-generate-button',
              intro: t('tryOn.intro.stepGenerate') || 'Bấm nút này để thử đồ lên mẫu (có thể sẽ mất một vài giây)',
              position: 'top'
            },
            {
              element: '#intro-model-gallery-button',
              intro: t('tryOn.intro.stepModelGallery') || 'Bấm vào đây để mở thư viện mẫu của bạn. Chọn mẫu ưa thích hoặc tạo mẫu mới bằng cách bấm nút Thêm',
              position: 'bottom'
            },
            {
              element: hasResult && resultImage ? '#intro-result-image' : '#intro-add-model-placeholder',
              intro: t('tryOn.intro.stepResult') || 'Kết quả sau khi thử đồ',
              position: 'right'
            },
            {
              element: '#intro-pose-selector',
              intro: t('tryOn.intro.stepPose') || 'Bạn có thể dùng mục này để đổi tư thế của mẫu',
              position: 'top'
            },
            {
              element: saveButton ? '#intro-save-button' : '#intro-save-button',
              intro: t('tryOn.intro.stepSave') || 'Bạn có thể lưu trang phục bạn vừa thử ở đây',
              position: 'top'
            }
          ]

          intro.setOptions({
            steps,
            showProgress: true,
            showBullets: true,
            exitOnOverlayClick: false,
            exitOnEsc: true,
            scrollToElement: false,
            scrollPadding: 0,
            nextLabel: t('common.next') || 'Tiếp theo',
            prevLabel: t('common.previous') || 'Quay lại',
            skipLabel: t('common.skip') || 'Bỏ qua',
            doneLabel: t('common.done') || 'Hoàn thành'
          })

          // Tự động mở menu pose khi đến bước 4
          intro.onchange((targetElement: HTMLElement) => {
            if (targetElement && targetElement.id === 'intro-pose-selector') {
              // Dispatch custom event để CanvasDisplay có thể detect
              window.dispatchEvent(
                new CustomEvent('introjs:pose-step', {
                  detail: { targetElement }
                })
              )
            }
          })

          intro.onexit(() => {
            window.dispatchEvent(new CustomEvent('introjs:exit'))
          })

          intro.oncomplete(() => {
            window.dispatchEvent(new CustomEvent('introjs:complete'))
          })

          // Đảm bảo tab Items được chọn trước
          const tabsContainer = document.querySelector('#intro-wardrobe-container .MuiTabs-root')
          const itemsTab = tabsContainer?.querySelector('[role="tab"]:first-child') as HTMLElement

          if (itemsTab && itemsTab.getAttribute('aria-selected') !== 'true') {
            itemsTab.click()
          }

          // Đợi tab được chọn và phần tử render
          setTimeout(() => {
            const wardrobeSidebar = document.getElementById('intro-wardrobe-sidebar')

            if (wardrobeSidebar) {
              // Không scroll, chỉ start intro
              intro.start()
            } else {
              // Nếu phần tử chưa render, đợi thêm một chút rồi start intro
              setTimeout(() => {
                intro.start()
              }, 300)
            }
          }, 200)
        }}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 24 },
          right: { xs: 16, md: 24 },
          width: 48,
          height: 48,
          minWidth: 48,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          boxShadow: 4,
          zIndex: 1000,
          '&:hover': {
            bgcolor: 'primary.dark',
            boxShadow: 6,
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease'
        }}
        aria-label='Hướng dẫn sử dụng'
      >
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          ?
        </Typography>
      </Button>
    </Box>
  )
}

export default TryOnComponent
