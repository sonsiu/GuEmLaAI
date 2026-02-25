'use client'

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Canvas, FabricImage } from 'fabric'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import { alpha, useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { getCachedItemImage } from '@/utils/calendar-image.utils'
import { showErrorToast } from '@/services/toast.service'
import { loadItemData } from '@/utils/itemData'
import type { WardrobeItem } from '@/types/wardrobe.type'
import SaveOutfitModal from './components/SaveOutfitModal'
import ItemSelectionModal from './components/ItemSelectionModal'

const ORIGINAL_CANVAS_WIDTH = 800
const ORIGINAL_CANVAS_HEIGHT = 600
const MAX_DISPLAY_CANVAS_WIDTH = 960

const OutfitBuilderView: React.FC = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const { t, lang: currentLang } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const imageMetadataRef = useRef<
    Map<
      any,
      {
        type: 'url'
        url?: string
        itemId?: number
        imagePreview?: string
        displayUrl?: string
      }
    >
  >(new Map())

  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingOutfitId, setEditingOutfitId] = useState<number | null>(null)
  const [editingOutfitData, setEditingOutfitData] = useState<{
    name?: string
    comment?: string
    isPublic?: boolean
    isFavorite?: boolean
    seasons?: string[]
  } | null>(null)
  const [isLoadingOutfit, setIsLoadingOutfit] = useState(false)
  const [seasonData, setSeasonData] = useState<string[]>([])
  const [canvasItems, setCanvasItems] = useState<{ index: number; itemId?: number; src?: string; name?: string }[]>([])
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({
    width: ORIGINAL_CANVAS_WIDTH,
    height: ORIGINAL_CANVAS_HEIGHT
  })

  // Clipboard and undo/redo states
  const clipboardRef = useRef<any>(null)
  const historyRef = useRef<any[]>([])
  const historyIndexRef = useRef<number>(-1)
  const skipHistoryRef = useRef(false)

  const syncCanvasElementSize = (canvas: Canvas | null, width?: number, height?: number) => {
    if (!canvas) return
    // Đảm bảo canvas luôn là hình vuông - lấy giá trị width làm chuẩn
    const targetWidth = width ?? canvas.width ?? ORIGINAL_CANVAS_WIDTH
    const targetHeight = width ?? targetWidth // Luôn bằng width để tạo hình vuông
    const lowerCanvas = canvas.lowerCanvasEl
    const upperCanvas = canvas.upperCanvasEl
    if (lowerCanvas) {
      lowerCanvas.style.setProperty('width', `${targetWidth}px`, 'important')
      lowerCanvas.style.setProperty('height', `${targetHeight}px`, 'important')
      lowerCanvas.style.display = 'block'
      lowerCanvas.style.margin = '0'
      lowerCanvas.style.padding = '0'
    }
    if (upperCanvas) {
      upperCanvas.style.setProperty('width', `${targetWidth}px`, 'important')
      upperCanvas.style.setProperty('height', `${targetHeight}px`, 'important')
      upperCanvas.style.display = 'block'
      upperCanvas.style.margin = '0'
      upperCanvas.style.padding = '0'
    }
    const containerEl = lowerCanvas?.parentElement
    const wrapperEl = containerEl?.parentElement
    const hostPaper = wrapperEl?.parentElement?.parentElement

    // Đảm bảo container và wrapper khớp với kích thước canvas (không scale lên để tránh vỡ nét)
    if (containerEl) {
      containerEl.style.setProperty('width', `${targetWidth}px`, 'important')
      containerEl.style.setProperty('height', `${targetHeight}px`, 'important')
      containerEl.style.setProperty('display', 'block', 'important')
      containerEl.style.setProperty('position', 'relative', 'important')
      containerEl.style.setProperty('margin', '0', 'important')
      containerEl.style.setProperty('padding', '0', 'important')
    }
    if (wrapperEl) {
      wrapperEl.style.setProperty('width', `${targetWidth}px`, 'important')
      wrapperEl.style.setProperty('height', `${targetHeight}px`, 'important')
      wrapperEl.style.setProperty('display', 'block', 'important')
      wrapperEl.style.setProperty('position', 'relative', 'important')
      wrapperEl.style.setProperty('margin', '0', 'important')
      wrapperEl.style.setProperty('padding', '0', 'important')
    }

    if (hostPaper instanceof HTMLElement) {
      hostPaper.style.setProperty('display', 'flex', 'important')
      hostPaper.style.setProperty('alignItems', 'center', 'important')
      hostPaper.style.setProperty('justifyContent', 'center', 'important')
      hostPaper.style.setProperty('overflow', 'hidden', 'important')
    }

    if (!containerEl || !wrapperEl) {
      requestAnimationFrame(() => syncCanvasElementSize(canvas, width, height))
      return
    }
    setCanvasDisplaySize({ width: targetWidth, height: targetHeight })
  }

  const waitForCanvasDomReady = async (canvas: Canvas | null, timeoutMs = 1500) => {
    if (!canvas) throw new Error('Fabric canvas chưa sẵn sàng')
    const lowerCanvas = canvas.lowerCanvasEl
    if (!lowerCanvas) throw new Error('Không tìm thấy lowerCanvasEl')

    // Đảm bảo đã set kích thước cho wrapper trước khi đo
    syncCanvasElementSize(canvas)

    const start = performance.now()

    while (performance.now() - start < timeoutMs) {
      const rect = lowerCanvas.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return
      }
      await new Promise(requestAnimationFrame)
    }

    const containerEl = lowerCanvas.parentElement
    const wrapperEl = containerEl?.parentElement

    throw new Error('Canvas DOM chưa có kích thước, không thể import được')
  }

  // Save canvas state to history
  const syncCanvasItems = () => {
    if (!fabricCanvasRef.current) return

    const items = fabricCanvasRef.current
      .getObjects()
      .map((obj, index) => {
        const metadata = imageMetadataRef.current.get(obj)

        if (!metadata) return null

        const imageSource = metadata.displayUrl || metadata.url

        if (!imageSource) return null

        return {
          index,
          itemId: metadata.itemId,
          src: imageSource,
          name: metadata.imagePreview || metadata.url || `Item #${index + 1}`
        }
      })
      .filter(Boolean) as { index: number; itemId?: number; src?: string; name?: string }[]

    setCanvasItems(items)
  }

  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return

    const state = fabricCanvasRef.current.toJSON()
    const currentIndex = historyIndexRef.current

    // Remove any future history if we're not at the end
    if (currentIndex < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndex + 1)
    }

    historyRef.current.push(JSON.parse(JSON.stringify(state)))
    historyIndexRef.current = historyRef.current.length - 1

    // Limit history to 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift()
      historyIndexRef.current = historyRef.current.length - 1
    }

    syncCanvasItems()
  }

  // Undo function
  const undo = () => {
    if (!fabricCanvasRef.current) return

    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      const state = historyRef.current[historyIndexRef.current]

      // Clear current metadata
      imageMetadataRef.current.clear()

      fabricCanvasRef.current.loadFromJSON(state, () => {
        // Restore metadata from state
        const objects = fabricCanvasRef.current?.getObjects() || []
        if (state.objects && Array.isArray(state.objects)) {
          state.objects.forEach((objData: any, index: number) => {
            if (index < objects.length && (objData.type === 'image' || objData.type === 'Image')) {
              const obj = objects[index]
              imageMetadataRef.current.set(obj, {
                type: 'url',
                url: objData.src,
                imagePreview: objData.name,
                itemId: objData.itemId
              })
            }
          })
        }

        fabricCanvasRef.current?.renderAll()
        setSelectedObject(null)
      })
    }
  }

  // Copy selected object
  const copySelectedObject = () => {
    if (!fabricCanvasRef.current || !selectedObject) return
    ;(selectedObject as any).clone((cloned: any) => {
      // Copy metadata from original object to cloned object
      const originalMetadata = imageMetadataRef.current.get(selectedObject)
      if (originalMetadata) {
        imageMetadataRef.current.set(cloned, originalMetadata)
      }
      clipboardRef.current = cloned
    })
  }

  // Paste copied object
  const pasteObject = () => {
    if (!fabricCanvasRef.current || !clipboardRef.current) return
    ;(clipboardRef.current as any).clone((cloned: any) => {
      cloned.set({
        left: cloned.left! + 20,
        top: cloned.top! + 20
      })

      // Restore metadata if available
      const originalMetadata = imageMetadataRef.current.get(clipboardRef.current)
      if (originalMetadata) {
        imageMetadataRef.current.set(cloned, originalMetadata)
      }

      fabricCanvasRef.current?.add(cloned)
      fabricCanvasRef.current?.setActiveObject(cloned)
      fabricCanvasRef.current?.renderAll()
      setSelectedObject(cloned)
      saveToHistory()
    })
  }

  const deleteSelectedObject = () => {
    if (!fabricCanvasRef.current || !selectedObject) return

    imageMetadataRef.current.delete(selectedObject)
    fabricCanvasRef.current.remove(selectedObject)
    fabricCanvasRef.current.renderAll()
    setSelectedObject(null)
    saveToHistory()
  }

  // Initialize Fabric.js Canvas
  useLayoutEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const getCanvasSize = () => {
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight

        // Single column layout - calculate available space
        const maxContentWidth = 1280 // Max content width
        const horizontalPadding = screenWidth < 768 ? 32 : screenWidth < 1024 ? 48 : 64
        const verticalPadding = 200 // Header, hero, card padding, toolbar
        
        // Available width for canvas
        const availableWidth = Math.min(screenWidth - horizontalPadding * 2, maxContentWidth - horizontalPadding * 2)
        
        // Available height
        const availableHeight = screenHeight - verticalPadding
        
        // Canvas hình vuông, lấy giá trị nhỏ hơn
        const squareSize = Math.min(availableWidth, availableHeight)
        
        // Responsive sizing
        let finalSize: number
        if (screenWidth < 768) {
          finalSize = Math.min(squareSize, 400)
        } else if (screenWidth < 1024) {
          finalSize = Math.min(squareSize, 600)
        } else {
          finalSize = Math.max(400, Math.min(squareSize, 800))
        }
        
        return { width: finalSize, height: finalSize }
      }

      const { width, height } = getCanvasSize()
      // Đảm bảo luôn là hình vuông
      const squareSize = width

      const canvas = new Canvas(canvasRef.current, {
        width: squareSize,
        height: squareSize,
        backgroundColor: 'transparent',
        selection: true
      })

      fabricCanvasRef.current = canvas
      syncCanvasElementSize(canvas, squareSize, squareSize)
      setCanvasDisplaySize({ width: squareSize, height: squareSize })
      setCanvasReady(true)

      canvas.on('selection:created', e => {
        setSelectedObject(e.selected?.[0] || null)
      })

      canvas.on('selection:updated', e => {
        setSelectedObject(e.selected?.[0] || null)
      })

      canvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      // Save to history on object modifications
      canvas.on('object:added', () => {
        if (skipHistoryRef.current) return
        saveToHistory()
      })

      canvas.on('object:modified', () => {
        if (skipHistoryRef.current) return
        saveToHistory()
      })

      canvas.on('object:removed', () => {
        if (skipHistoryRef.current) return
        saveToHistory()
      })

      const handleResize = () => {
        const { width: newWidth, height: newHeight } = getCanvasSize()
        // Đảm bảo luôn là hình vuông - lấy giá trị nhỏ hơn hoặc width
        const squareSize = newWidth // getCanvasSize đã đảm bảo width = height
        const currentWidth = canvas.width

        if (currentWidth !== squareSize) {
          const scale = squareSize / currentWidth!

          canvas.setDimensions({ width: squareSize, height: squareSize })
          syncCanvasElementSize(canvas, squareSize, squareSize)
          setCanvasDisplaySize({ width: squareSize, height: squareSize })

          const objects = canvas.getObjects()
          objects.forEach(obj => {
            // Dùng cùng một scale vì canvas luôn là hình vuông
            obj.scaleX = (obj.scaleX || 1) * scale
            obj.scaleY = (obj.scaleY || 1) * scale
            obj.left = (obj.left || 0) * scale
            obj.top = (obj.top || 0) * scale
            obj.setCoords()
          })

          canvas.renderAll()
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        canvas.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [])

  // Load season data
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const data = await loadItemData()
        setSeasonData(data.seasons || [])
      } catch (error) {
        // console.error('Failed to load season data:', error)
      }
    }
    loadSeasons()
  }, [])

  // Check for outfitId URL parameter and load outfit if present
  useEffect(() => {
    const loadOutfitForEditing = async () => {
      const outfitIdParam = searchParams.get('outfitId')

      if (!outfitIdParam || !canvasReady) {
        return
      }

      const outfitId = parseInt(outfitIdParam, 10)
      if (isNaN(outfitId)) {
        showErrorToast('Invalid outfit ID')
        return
      }

      setIsLoadingOutfit(true)

      try {
        const outfitData = await wardrobeService.getOutfit(outfitId)

        setIsEditMode(true)
        setEditingOutfitId(outfitData.id)
        
        // Lưu outfit data để truyền vào modal
        setEditingOutfitData({
          name: outfitData.name || undefined,
          comment: outfitData.comment || undefined,
          isPublic: outfitData.isPublic ?? false,
          isFavorite: outfitData.isFavorite ?? false,
          seasons: outfitData.outfitSeasons || []
        })

        // Load the JsonTemplate onto canvas
        if (outfitData.jsonTemplate) {
          const jsonTemplate =
            typeof outfitData.jsonTemplate === 'string' ? JSON.parse(outfitData.jsonTemplate) : outfitData.jsonTemplate

          await importCanvasFromJSON(jsonTemplate)
        } else {
          const fallbackIds = outfitData.itemIds || []
          if (fallbackIds.length > 0) {
            for (let index = 0; index < fallbackIds.length; index++) {
              const rawId = fallbackIds[index]
              const numericId = Number(rawId)
              if (Number.isNaN(numericId)) continue

              try {
                const imageData = await wardrobeService.getItemImage(numericId)
                const fallbackX = (fabricCanvasRef.current?.width || ORIGINAL_CANVAS_WIDTH) / 2 + index * 30
                const fallbackY = (fabricCanvasRef.current?.height || ORIGINAL_CANVAS_HEIGHT) / 2 + index * 30

                await loadImageFromURL(
                  imageData.src,
                  {
                    itemId: imageData.itemId,
                    imagePreview: imageData.name
                  },
                  {
                    position: { x: fallbackX, y: fallbackY },
                    skipHistory: true
                  }
                )
              } catch (fallbackError) {
                // console.warn('Failed to load fallback item for outfit edit', fallbackError)
              }
            }

            syncCanvasItems()
            saveToHistory()
            showErrorToast(
              t('tryOn.wardrobe.outfitBuilder.fallbackNotice') ||
                'Original outfit layout could not be restored. Items were loaded for manual adjustment.'
            )
          } else if (outfitData.imageUrl) {
            try {
              await loadImageFromURL(
                outfitData.imageUrl,
                {
                  imagePreview: outfitData.name || `Outfit #${outfitData.id}`
                },
                { skipHistory: true }
              )
              syncCanvasItems()
              saveToHistory()
            } catch (previewError) {
              // console.warn('Failed to load outfit preview image as fallback', previewError)
            }
          }
        }
      } catch (error) {
        // console.error('Error loading outfit:', error)
        showErrorToast(error instanceof Error ? error.message : 'Failed to load outfit')
        const langPrefix = currentLang || 'en'
        router.push(`/${langPrefix}/wardrobe?tab=outfits`)
      } finally {
        setIsLoadingOutfit(false)
      }
    }

    loadOutfitForEditing()
  }, [canvasReady, searchParams, router])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Delete or Backspace - Delete selected object
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvasRef.current?.getActiveObject()
        if (activeObject) {
          e.preventDefault()
          imageMetadataRef.current.delete(activeObject)
          fabricCanvasRef.current?.remove(activeObject)
          fabricCanvasRef.current?.renderAll()
          setSelectedObject(null)
          saveToHistory()
        }
        return
      }

      // Ctrl+C or Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeObject = fabricCanvasRef.current?.getActiveObject()
        if (activeObject) {
          e.preventDefault()
          ;(activeObject as any).clone((cloned: any) => {
            // Copy metadata from original object to cloned object
            const originalMetadata = imageMetadataRef.current.get(activeObject)
            if (originalMetadata) {
              imageMetadataRef.current.set(cloned, originalMetadata)
            }
            clipboardRef.current = cloned
          })
        }
        return
      }

      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault()
        ;(clipboardRef.current as any).clone((cloned: any) => {
          cloned.set({
            left: cloned.left! + 20,
            top: cloned.top! + 20
          })

          // Restore metadata if available
          const originalMetadata = imageMetadataRef.current.get(clipboardRef.current)
          if (originalMetadata) {
            imageMetadataRef.current.set(cloned, originalMetadata)
          }

          fabricCanvasRef.current?.add(cloned)
          fabricCanvasRef.current?.setActiveObject(cloned)
          fabricCanvasRef.current?.renderAll()
          setSelectedObject(cloned)
          saveToHistory()
        })
        return
      }

      // Ctrl+Z or Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--
          const state = historyRef.current[historyIndexRef.current]

          // Clear current metadata
          imageMetadataRef.current.clear()

          fabricCanvasRef.current?.loadFromJSON(state, () => {
            // Restore metadata from state
            const objects = fabricCanvasRef.current?.getObjects() || []
            if (state.objects && Array.isArray(state.objects)) {
              state.objects.forEach((objData: any, index: number) => {
                if (index < objects.length && (objData.type === 'image' || objData.type === 'Image')) {
                  const obj = objects[index]
                  imageMetadataRef.current.set(obj, {
                    type: 'url',
                    url: objData.src,
                    imagePreview: objData.name,
                    itemId: objData.itemId
                  })
                }
              })
            }

            fabricCanvasRef.current?.renderAll()
            setSelectedObject(null)
          })
        }
        return
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z - Redo (not implemented yet, but can add later)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        // Redo functionality can be added here if needed
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const createFabricImageFromSrc = async (imageUrl: string) => {
    try {
      const img = await FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      })
      return img
    } catch (directError) {
      const response = await fetch(imageUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      try {
        const img = await FabricImage.fromURL(blobUrl, {
          crossOrigin: 'anonymous'
        })
        return img
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }

  const loadImageFromURL = async (
    imageUrl: string,
    itemMetadata?: { itemId?: number; imagePreview?: string },
    options?: { position?: { x: number; y: number }; skipHistory?: boolean }
  ) => {
    if (!fabricCanvasRef.current) {
      // console.error('Canvas not initialized')
      return
    }

    await waitForCanvasDomReady(fabricCanvasRef.current)

    try {
      const canvas = fabricCanvasRef.current

      let img: any = await createFabricImageFromSrc(imageUrl)

      const maxWidth = canvas.width! * 0.8
      const maxHeight = canvas.height! * 0.8

      if (img.width! > maxWidth || img.height! > maxHeight) {
        const scaleX = maxWidth / img.width!
        const scaleY = maxHeight / img.height!
        const scale = Math.min(scaleX, scaleY)
        img.scale(scale)
      }

      const targetX = options?.position?.x ?? canvas.width! / 2
      const targetY = options?.position?.y ?? canvas.height! / 2

      img.set({
        left: targetX,
        top: targetY,
        originX: 'center',
        originY: 'center'
      })

      imageMetadataRef.current.set(img, {
        type: 'url',
        url: itemMetadata?.imagePreview || imageUrl,
        itemId: itemMetadata?.itemId,
        imagePreview: itemMetadata?.imagePreview || imageUrl,
        displayUrl: imageUrl
      })

      const shouldSkipHistory = !!options?.skipHistory
      if (shouldSkipHistory) {
        skipHistoryRef.current = true
      }

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()

      if (shouldSkipHistory) {
        skipHistoryRef.current = false
        syncCanvasItems()
      }
    } catch (error) {
      // console.error('Failed to load image:', error)
      showErrorToast('Failed to load image. Please check the browser console for details.')
    }
  }

  // Initialize history with empty canvas
  useEffect(() => {
    if (canvasReady && fabricCanvasRef.current && historyRef.current.length === 0) {
      saveToHistory()
    }
  }, [canvasReady])

  const rotateObject = () => {
    if (!fabricCanvasRef.current || !selectedObject) return
    const currentAngle = selectedObject.angle || 0
    selectedObject.rotate(currentAngle + 15)
    fabricCanvasRef.current.renderAll()
  }

  const scaleObject = (factor: number) => {
    if (!fabricCanvasRef.current || !selectedObject) return
    const currentScaleX = selectedObject.scaleX || 1
    selectedObject.scale(currentScaleX * factor)
    fabricCanvasRef.current.renderAll()
  }

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return
    skipHistoryRef.current = true
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = 'transparent'
    fabricCanvasRef.current.renderAll()
    setSelectedObject(null)
    imageMetadataRef.current.clear()
    setCanvasItems([])
    setIsEditMode(false)
    setEditingOutfitId(null)
    setEditingOutfitData(null)
    skipHistoryRef.current = false
    saveToHistory()
  }

  const prepareCanvasJSONForDatabase = () => {
    if (!fabricCanvasRef.current) return null

    const canvasJSON = fabricCanvasRef.current.toJSON()
    const currentCanvasWidth = fabricCanvasRef.current.width || ORIGINAL_CANVAS_WIDTH
    const currentCanvasHeight = fabricCanvasRef.current.height || ORIGINAL_CANVAS_HEIGHT

    const reverseScaleRatioX = ORIGINAL_CANVAS_WIDTH / currentCanvasWidth
    const reverseScaleRatioY = ORIGINAL_CANVAS_HEIGHT / currentCanvasHeight

    if (canvasJSON.objects && Array.isArray(canvasJSON.objects)) {
      const objects = fabricCanvasRef.current.getObjects()

      canvasJSON.objects = canvasJSON.objects.map((obj: any, index: number) => {
        const fabricObj = objects[index]
        const metadata = imageMetadataRef.current.get(fabricObj)

        if ((obj.type === 'image' || obj.type === 'Image') && metadata) {
          const cleanObj = { ...obj }

          cleanObj.left = obj.left * reverseScaleRatioX
          cleanObj.top = obj.top * reverseScaleRatioY
          cleanObj.scaleX = obj.scaleX * reverseScaleRatioX
          cleanObj.scaleY = obj.scaleY * reverseScaleRatioY

          if (metadata.imagePreview || metadata.url) {
            cleanObj.src = metadata.imagePreview || metadata.url
            cleanObj.name = metadata.imagePreview || metadata.url
          }

          if (metadata.imagePreview) {
            cleanObj.name = metadata.imagePreview
          }

          if (metadata.itemId) {
            cleanObj.itemId = metadata.itemId
          }

          return cleanObj
        }

        return obj
      })
    }

    return canvasJSON
  }

  const exportCanvasAsImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!fabricCanvasRef.current) {
        reject(new Error('Canvas not initialized'))
        return
      }

      try {
        const dataURL = fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 0.9,
          multiplier: 2
        })

        fetch(dataURL)
          .then(res => res.blob())
          .then(resolve)
          .catch(reject)
      } catch (error) {
        // Fallback: Create a simple placeholder image
        const canvas = document.createElement('canvas')
        canvas.width = ORIGINAL_CANVAS_WIDTH
        canvas.height = ORIGINAL_CANVAS_HEIGHT
        const ctx = canvas.getContext('2d')

        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#666666'
          ctx.font = '24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Outfit Saved', canvas.width / 2, canvas.height / 2 - 20)
        }

        const dataURL = canvas.toDataURL('image/png')
        fetch(dataURL)
          .then(res => res.blob())
          .then(resolve)
          .catch(reject)
      }
    })
  }

  const hydrateTemplateImages = async (jsonData: any) => {
    if (!jsonData?.objects || !Array.isArray(jsonData.objects)) {
      return jsonData
    }

    const hydratedObjects = await Promise.all(
      jsonData.objects.map(async (obj: any) => {
        if (obj?.type?.toLowerCase() !== 'image') {
          return obj
        }

        let imageSource = obj.src
        if (obj.itemId) {
          try {
            const refreshed = await getCachedItemImage(Number(obj.itemId))
            if (refreshed) {
              imageSource = refreshed
            }
          } catch (error) {
            // console.warn(`Failed to hydrate image for item ${obj.itemId}`, error)
          }
        }

        return {
          ...obj,
          src: imageSource,
          crossOrigin: 'anonymous'
        }
      })
    )

    return {
      ...jsonData,
      objects: hydratedObjects
    }
  }

  const importCanvasFromJSON = async (jsonData: any) => {
    if (!fabricCanvasRef.current) {
      // console.error('Canvas not initialized')
      return
    }

    try {
      skipHistoryRef.current = true
      const canvas = fabricCanvasRef.current
      await waitForCanvasDomReady(canvas)
      const hydratedTemplate = await hydrateTemplateImages(jsonData)
      const objects = hydratedTemplate?.objects

      if (!objects || !Array.isArray(objects) || objects.length === 0) {
        // console.warn('hydrateTemplateImages returned no objects')
        imageMetadataRef.current.clear()
        canvas.clear()
        canvas.backgroundColor = hydratedTemplate?.background || 'transparent'
        canvas.renderAll()
        skipHistoryRef.current = false
        return
      }

      canvas.clear()
      canvas.backgroundColor = hydratedTemplate.background || 'transparent'
      canvas.renderAll()
      imageMetadataRef.current.clear()

      const widthScale = (canvas.width || ORIGINAL_CANVAS_WIDTH) / ORIGINAL_CANVAS_WIDTH
      const heightScale = (canvas.height || ORIGINAL_CANVAS_HEIGHT) / ORIGINAL_CANVAS_HEIGHT

      let addedCount = 0

      for (let i = 0; i < objects.length; i++) {
        const objData = objects[i]

        if (objData.type?.toLowerCase() !== 'image' || !objData.src) {
          continue
        }

        let imageSource = objData.src

        if (objData.itemId) {
          try {
            const refreshedUrl = await getCachedItemImage(Number(objData.itemId))
            if (refreshedUrl) {
              imageSource = refreshedUrl
            }
          } catch (error) {
            // console.warn(`Failed to refresh image for item ${objData.itemId}`, error)
          }
        }

        try {
          const img = await createFabricImageFromSrc(imageSource)

          img.set({
            left: (objData.left || 0) * widthScale,
            top: (objData.top || 0) * heightScale,
            scaleX: (objData.scaleX || 1) * widthScale,
            scaleY: (objData.scaleY || 1) * heightScale,
            angle: objData.angle || 0,
            flipX: objData.flipX || false,
            flipY: objData.flipY || false,
            opacity: objData.opacity !== undefined ? objData.opacity : 1,
            originX: objData.originX || 'center',
            originY: objData.originY || 'center'
          })

          imageMetadataRef.current.set(img, {
            type: 'url',
            url: objData.name || imageSource,
            imagePreview: objData.name || imageSource,
            itemId: objData.itemId ? Number(objData.itemId) : undefined,
            displayUrl: imageSource
          })

          canvas.add(img)
          canvas.renderAll()
          addedCount++
        } catch (error) {
          // console.error(`Failed to load image ${i}:`, error)
          showErrorToast(
            t('tryOn.wardrobe.outfitBuilder.errors.loadDetailImage') || 'Failed to load outfit image. Please try again.'
          )
        }
      }

      if (addedCount === 0) {
        showErrorToast(t('tryOn.wardrobe.outfitBuilder.errors.loadDetailImage') || 'Failed to load outfit items.')
      }

      syncCanvasItems()
      saveToHistory()
    } catch (error) {
      // console.error('Error loading outfit JSON:', error)
    } finally {
      skipHistoryRef.current = false
    }
  }

  const handleSaveOutfit = async (data: {
    name?: string
    comment?: string
    isPublic: boolean
    isFavorite: boolean
    seasons: string[]
  }) => {
    if (!user?.id) {
      showErrorToast('Please login to save outfit')
      return
    }

    try {
      const jsonTemplate = prepareCanvasJSONForDatabase()
      if (!jsonTemplate) {
        showErrorToast('Failed to prepare outfit data')
        return
      }

      const imageBlob = await exportCanvasAsImage()
      const imageFile = new File([imageBlob], `outfit-${Date.now()}.png`, { type: 'image/png' })

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id

      if (isEditMode && editingOutfitId) {
        await wardrobeService.updateOutfit(editingOutfitId, {
          name: data.name,
          comment: data.comment,
          isPublic: data.isPublic,
          isFavorite: data.isFavorite,
          seasons: data.seasons,
          jsonTemplate: JSON.stringify(jsonTemplate),
          imageFile
        })
      } else {
        await wardrobeService.createOutfit({
          userId,
          name: data.name,
          comment: data.comment,
          isPublic: data.isPublic,
          isFavorite: data.isFavorite,
          seasons: data.seasons,
          jsonTemplate: JSON.stringify(jsonTemplate),
          imageFile
        })
      }

      setShowSaveModal(false)
      clearCanvas()

      const langPrefix = currentLang || 'en'
      router.push(`/${langPrefix}/wardrobe?tab=outfits`)
    } catch (error) {
      // console.error('Error saving outfit:', error)
      showErrorToast(error instanceof Error ? error.message : 'Failed to save outfit')
    }
  }

  const handleSelectItem = async (item: WardrobeItem) => {
    try {
      const imageData = await wardrobeService.getItemImage(item.id)

      await loadImageFromURL(imageData.src, {
        itemId: imageData.itemId,
        imagePreview: imageData.name
      })

      // Close modal after successful selection
      setShowItemModal(false)
    } catch (error) {
      // console.error('Failed to add item to canvas:', error)
      showErrorToast(error instanceof Error ? error.message : 'Failed to add item to canvas')
      // Re-throw error so modal can handle it
      throw error
    }
  }

  const heroTitle = isEditMode
    ? t('tryOn.wardrobe.outfitBuilder.heroEditTitle')
    : t('tryOn.wardrobe.outfitBuilder.heroCreateTitle')
  const heroDescription = t('tryOn.wardrobe.outfitBuilder.heroDescription')
  const itemsPanelTitle = t('tryOn.wardrobe.outfitBuilder.itemsPanelTitle')
  const itemsPanelEmpty = t('tryOn.wardrobe.outfitBuilder.itemsPanelEmpty')
  const itemsPanelCountLabel = t('tryOn.wardrobe.outfitBuilder.itemsPanelCount', {
    count: canvasItems.length
  })

  return (
    <Box
      component='main'
      sx={{
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        mx: 'auto',
        maxWidth: 1280,
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {isLoadingOutfit && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography color='text.primary'>{t('tryOn.wardrobe.outfitBuilder.loading')}</Typography>
        </Box>
      )}

      {/* Hero Section - Desktop Only */}
      <Box
        sx={{
          textAlign: 'center',
          mb: { xs: 4, md: 6 },
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            mb: 2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 100%)'
          }}
        >
          <i className='tabler-photo' style={{ fontSize: '32px', color: 'white' }} />
        </Box>
        <Typography
          variant='h3'
            sx={{
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
          {heroTitle}
        </Typography>
        <Typography
          variant='body1'
          color='text.secondary'
          sx={{
            maxWidth: '42rem',
            mx: 'auto',
            fontSize: '1.125rem'
          }}
        >
          {heroDescription}
        </Typography>
          </Box>

      {/* Main Card */}
      <Paper
          sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
          className='flex flex-col gap-2'
        >
        {/* Card Header */}
        <Box
            sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.8)
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)'
            }}
            className='flex flex-col gap-2'
          >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 100%)'
                }}
              >
              <i className='tabler-photo' style={{ fontSize: '20px', color: 'white' }} />
              </Box>
              <Box>
              <Typography
                variant='h2'
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {isEditMode ? t('tryOn.wardrobe.outfitBuilder.editYourOutfit') : t('tryOn.wardrobe.outfitBuilder.outfitBuilder')}
                </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                {t('tryOn.wardrobe.outfitBuilder.cardDescription')}
                </Typography>
            </Box>
              </Box>
            </Box>

        {/* Card Body */}
        <Box sx={{ p: { xs: 2, sm: 3 } }} className='flex flex-col gap-2'>
          {/* Toolbar */}
          <Box
            sx={{
              mb: { xs: 2, sm: 3 },
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              px: 1,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: 4
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'divider',
                borderRadius: 2
              }
            }}
          >
            {/* Add from Wardrobe Button */}
            <Button
              startIcon={<i className='tabler-plus' />}
              disabled={!canvasReady}
              onClick={() => setShowItemModal(true)}
              size='small'
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  boxShadow: 'none'
                }
              }}
            >
              <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {t('tryOn.wardrobe.outfitBuilder.addFromWardrobe')}
              </Box>
              <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Wardrobe
              </Box>
            </Button>

            {/* Object Controls - Only show when object is selected */}
            {selectedObject && (
              <>
            <Box
              sx={{
                    height: 32,
                    width: 2,
                    bgcolor: 'divider',
                    mx: 1
              }}
                />
              <IconButton
                onClick={rotateObject}
                title={t('tryOn.wardrobe.outfitBuilder.rotate')}
                  size='small'
                sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                }}
              >
                  <i className='tabler-rotate-clockwise' style={{ fontSize: '18px' }} />
              </IconButton>
                <Button
                onClick={() => scaleObject(1.1)}
                title={t('tryOn.wardrobe.outfitBuilder.scaleUp')}
                  size='small'
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 },
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                }}
              >
                  <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Scale{' '}
                  </Box>
                  +
                </Button>
                <Button
                onClick={() => scaleObject(0.9)}
                title={t('tryOn.wardrobe.outfitBuilder.scaleDown')}
                  size='small'
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 },
                    background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                  borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
                      boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Scale{' '}
                  </Box>
                  -
                </Button>
              <IconButton
                onClick={deleteSelectedObject}
                title={t('tryOn.wardrobe.outfitBuilder.delete')}
                  size='small'
                sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                }}
              >
                  <i className='tabler-trash' style={{ fontSize: '18px' }} />
              </IconButton>
              </>
            )}

            {/* Export & Clear */}
            <Box
              sx={{
                height: 32,
                width: 2,
                bgcolor: 'divider',
                mx: 1
              }}
            />
              <Button
                startIcon={<i className='tabler-device-floppy' />}
                onClick={() => setShowSaveModal(true)}
                disabled={!canvasReady}
              size='small'
                sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  boxShadow: 'none'
                  }
                }}
              >
              <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Save{' '}
              </Box>
              Outfit
              </Button>
              <Button
                startIcon={<i className='tabler-x' />}
                onClick={clearCanvas}
                disabled={!canvasReady}
              size='small'
                sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                  '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
                    : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  opacity: 0.5
                  }
                }}
              >
              <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Clear{' '}
              </Box>
              All
              </Button>
          </Box>

          {/* Canvas Container */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 2, sm: 3 },
              px: { xs: 1, sm: 2 }
            }}
          >
            <Box
              sx={{
                border: `4px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.8)'
                }`,
                borderRadius: 4,
                p: 2,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12)',
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(55, 65, 81, 0.8)'
                  : 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)'
              }}
            >
              <Box
                component='canvas'
                ref={canvasRef}
                width={canvasDisplaySize.width}
                height={canvasDisplaySize.width}
                sx={{
                  display: 'block',
                  borderRadius: 2,
                  width: `${canvasDisplaySize.width}px`,
                  height: `${canvasDisplaySize.width}px`
                }}
              />
            </Box>
          </Box>
            </Box>
          </Paper>

      {/* Canvas Items Display - Only show in Edit Mode, below card */}
      {isEditMode && canvasItems.length > 0 && (
          <Paper
            sx={{
            mt: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: `2px solid ${
              theme.palette.mode === 'dark'
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(59, 130, 246, 0.2)'
            }`,
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(30, 58, 138, 0.3)'
              : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(186, 230, 253, 0.5) 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              gap: 1.5,
              mb: 3
              }}
            >
            <Box
              component='svg'
              sx={{
                width: 20,
                height: 20,
                color: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb'
              }}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 700,
                fontSize: '1.125rem'
              }}
            >
                {itemsPanelTitle}
              </Typography>
            <Chip
              label={canvasItems.length}
              size='small'
              sx={{
                bgcolor: '#2563eb',
                color: 'white',
                fontWeight: 600,
                height: 24,
                fontSize: '0.75rem',
                borderRadius: 1.5
              }}
            />
            </Box>

          {/* Items Grid */}
          <Box
                      sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(3, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(5, 1fr)',
                lg: 'repeat(6, 1fr)'
              },
              gap: 2
                      }}
                    >
            {canvasItems.map((item) => (
                      <Box
                key={`${item.index}-${item.itemId || item.name}`}
                        sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s ease'
                  }
                }}
                title={item.name || `Item #${item.index}`}
              >
                <Box
                  sx={{
                    aspectRatio: '1 / 1',
                          borderRadius: 2,
                          overflow: 'hidden',
                          mb: 1,
                    position: 'relative',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                        : '0 8px 16px rgba(0, 0, 0, 0.1)'
                    },
                    transition: 'all 0.2s ease'
                        }}
                      >
                        <Box
                          component='img'
                          src={item.src || '/placeholder.png'}
                          alt={item.name || `Item ${item.index}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.src !== '/placeholder.png') {
                              target.src = '/placeholder.png'
                            }
                          }}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                  {/* Hover Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0)',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  />
                  {/* Item ID Badge */}
                  {item.itemId && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: '#2563eb',
                        color: 'white',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      {t('tryOn.wardrobe.outfitBuilder.itemId')}: {item.itemId}
                    </Box>
                        )}
                      </Box>
                <Typography
                  variant='caption'
                  sx={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.name || `${t('tryOn.wardrobe.outfitBuilder.item')} #${item.index}`}
                      </Typography>
              </Box>
                ))}
        </Box>
        </Paper>
      )}

      <SaveOutfitModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveOutfit}
        isEditMode={isEditMode}
        seasonData={seasonData}
        initialData={editingOutfitData || undefined}
      />

      <ItemSelectionModal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSelectItem={handleSelectItem}
      />
    </Box>
  )
}

export default OutfitBuilderView
