'use client'

import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Collapse from '@mui/material/Collapse'
import Skeleton from '@mui/material/Skeleton'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { ItemTemplate } from '../types'
import { POSE_LABEL_KEY_MAP } from '../constants'
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon, Trash2Icon } from './icons'
import Spinner from './Spinner'

// Model image type for the model gallery
export interface ModelImage {
  id: number
  imageUrl: string
  fileName?: string
  isDefault?: boolean
}

interface CanvasDisplayProps {
  displayImageUrl: string | null
  onStartOver: () => void
  isLoading: boolean
  loadingMessage: string
  onSelectPose: (index: number) => void
  poseInstructions: string[]
  currentPoseIndex: number
  availablePoseKeys: string[]
  showPoseMenu?: boolean
  onOpenHistory?: () => void
  onShare?: () => void
  associatedItems?: ItemTemplate[]
  isLoadingItems?: boolean

  // New props for model gallery
  modelImages?: ModelImage[]
  isLoadingModels?: boolean
  onModelSelect?: (model: ModelImage) => void
  onAddModel?: () => void
  onAddModelFromPanel?: () => void
  onDeleteModel?: (model: ModelImage) => void
  onSetDefaultModel?: (model: ModelImage) => void
  selectedModelId?: number | null
  showModelPanel?: boolean
  onModelPanelChange?: (isOpen: boolean) => void
}

const CanvasDisplay: React.FC<CanvasDisplayProps> = ({
  displayImageUrl,
  onStartOver,
  isLoading,
  loadingMessage,
  onSelectPose,
  poseInstructions,
  currentPoseIndex,
  availablePoseKeys,
  showPoseMenu = false,
  onOpenHistory,
  onShare,
  associatedItems = [],
  isLoadingItems = false,

  // New props for model gallery
  modelImages = [],
  isLoadingModels = false,
  onModelSelect,
  onAddModel,
  onAddModelFromPanel,
  onDeleteModel,
  onSetDefaultModel,
  selectedModelId,
  showModelPanel = false,
  onModelPanelChange
}) => {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false)
  const [isModelPanelOpen, setIsModelPanelOpen] = useState(showModelPanel)
  const [loadedModelImages, setLoadedModelImages] = useState<Set<number>>(new Set())
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false)
  const [mainImageError, setMainImageError] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [modelPanelHoverTimeout, setModelPanelHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showSetDefaultConfirm, setShowSetDefaultConfirm] = useState(false)
  const [pendingDefaultModel, setPendingDefaultModel] = useState<ModelImage | null>(null)

  // Sync external showModelPanel prop with internal state
  useEffect(() => {
    setIsModelPanelOpen(showModelPanel)
  }, [showModelPanel])

  // Reset main image loaded state when URL changes
  useEffect(() => {
    // Only reset if the URL actually changed
    if (displayImageUrl !== currentImageUrl) {
      // console.log('Image URL changed:', { old: currentImageUrl, new: displayImageUrl })
      setCurrentImageUrl(displayImageUrl)
      setIsMainImageLoaded(false)
      setMainImageError(false)
    }
  }, [displayImageUrl, currentImageUrl])

  // Notify parent when panel state changes
  const handleModelPanelToggle = useCallback((newState: boolean) => {
    setIsModelPanelOpen(newState)
    onModelPanelChange?.(newState)
  }, [onModelPanelChange])

  // Handle set default model confirmation
  const handleSetDefaultClick = useCallback((model: ModelImage) => {
    setPendingDefaultModel(model)
    setShowSetDefaultConfirm(true)
  }, [])

  const handleConfirmSetDefault = useCallback(() => {
    if (pendingDefaultModel) {
      onSetDefaultModel?.(pendingDefaultModel)
    }
    setShowSetDefaultConfirm(false)
    setPendingDefaultModel(null)
  }, [pendingDefaultModel, onSetDefaultModel])

  const handleCancelSetDefault = useCallback(() => {
    setShowSetDefaultConfirm(false)
    setPendingDefaultModel(null)
  }, [])

  const [isIntroActive, setIsIntroActive] = useState(false)

  // Tự động mở menu pose khi Intro.js đang highlight phần pose selector
  React.useEffect(() => {
    const handleIntroChange = (e: Event) => {
      const customEvent = e as CustomEvent
      const targetElement = customEvent.detail?.targetElement as HTMLElement | null

      setIsIntroActive(true)

      if (targetElement && targetElement.id === 'intro-pose-selector') {
        setIsPoseMenuOpen(true)
      }
    }

    const handleIntroExit = () => {
      setIsIntroActive(false)

      // Đóng menu khi intro kết thúc (trừ khi đang hover)
      setTimeout(() => {
        const poseMenuBox = document.querySelector('.pose-menu') as HTMLElement

        if (poseMenuBox && !poseMenuBox.matches(':hover')) {
          setIsPoseMenuOpen(false)
        }
      }, 100)
    }

    // Listen to custom events từ Intro.js
    window.addEventListener('introjs:pose-step', handleIntroChange)
    window.addEventListener('introjs:exit', handleIntroExit)
    window.addEventListener('introjs:complete', handleIntroExit)

    // Check nếu intro đang chạy khi component mount
    const checkIntroActive = () => {
      const introTooltip = document.querySelector('.introjs-tooltip')

      setIsIntroActive(!!introTooltip)
    }

    checkIntroActive()

    const interval = setInterval(checkIntroActive, 100)

    return () => {
      window.removeEventListener('introjs:pose-step', handleIntroChange)
      window.removeEventListener('introjs:exit', handleIntroExit)
      window.removeEventListener('introjs:complete', handleIntroExit)
      clearInterval(interval)
      if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout)
    }
  }, [modelPanelHoverTimeout])

  const getPoseLabel = useCallback(
    (pose: string) => {
      const key = POSE_LABEL_KEY_MAP[pose]

      return key ? t(key) : pose
    },
    [t]
  )

  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return
    const currentPoseInstruction = poseInstructions[currentPoseIndex]
    const currentIndex = availablePoseKeys.indexOf(currentPoseInstruction) ?? -1

    if (currentIndex === -1) {
      onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length)
      return
    }

    const prevIndex = (currentIndex - 1 + availablePoseKeys.length) % availablePoseKeys.length
    const prevPoseInstruction = availablePoseKeys[prevIndex]
    const newGlobalIndex = poseInstructions.indexOf(prevPoseInstruction)

    if (newGlobalIndex !== -1) {
      onSelectPose(newGlobalIndex)
    }
  }

  const handleNextPose = () => {
    if (isLoading) return

    const currentPoseInstruction = poseInstructions[currentPoseIndex]
    const currentIndex = availablePoseKeys.indexOf(currentPoseInstruction)

    if (currentIndex === -1 || availablePoseKeys.length === 0) {
      onSelectPose((currentPoseIndex + 1) % poseInstructions.length)
      return
    }

    const nextIndex = currentIndex + 1

    if (nextIndex < availablePoseKeys.length) {
      const nextPoseInstruction = availablePoseKeys[nextIndex]
      const newGlobalIndex = poseInstructions.indexOf(nextPoseInstruction)

      if (newGlobalIndex !== -1) {
        onSelectPose(newGlobalIndex)
      }
    } else {
      const newGlobalIndex = (currentPoseIndex + 1) % poseInstructions.length

      onSelectPose(newGlobalIndex)
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 },
        overflow: 'hidden',
        '&:hover .pose-menu': {
          opacity: 1
        }
      }}
    >
      {/* Simple Toolbar - Top Left */}
      <Box
        sx={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {/* All buttons in one row */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={onStartOver}
            disabled={isLoading}
            sx={{
              bgcolor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid',
              borderColor: 'divider',
              p: 1.5,
              '&:hover': { bgcolor: isDark ? 'rgba(50,50,60,0.9)' : 'rgba(240,240,240,0.95)' },
              '&.Mui-disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
            title={t('tryOn.canvas.startOver')}
          >
            <RotateCcwIcon style={{ width: 24, height: 24 }} />
          </IconButton>

          {onOpenHistory && (
            <IconButton
              onClick={onOpenHistory}
              disabled={isLoading}
              sx={{
                bgcolor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                p: 1.5,
                '&:hover': { bgcolor: isDark ? 'rgba(50,50,60,0.9)' : 'rgba(240,240,240,0.95)' },
                '&.Mui-disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }
              }}
              title={t('tryOn.canvas.history') || 'History'}
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='12' cy='12' r='10' />
                <polyline points='12 6 12 12 16 14' />
              </svg>
            </IconButton>
          )}

          {onShare && (
            <IconButton
              onClick={onShare}
              disabled={isLoading}
              sx={{
                bgcolor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                p: 1.5,
                '&:hover': { bgcolor: isDark ? 'rgba(50,50,60,0.9)' : 'rgba(240,240,240,0.95)' },
                '&.Mui-disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }
              }}
              title={t('tryOn.canvas.share') || 'Share'}
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
                <polyline points='16 6 12 2 8 6' />
                <line x1='12' y1='2' x2='12' y2='15' />
              </svg>
            </IconButton>
          )}

          <Button
            id="intro-model-gallery-button"
            onClick={() => handleModelPanelToggle(!isModelPanelOpen)}
            onMouseEnter={() => {
              // Only auto-open on hover for desktop (min-width: 1024px)
              if (window.innerWidth >= 1024) {
                if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout)
                handleModelPanelToggle(true)
              }
            }}
            disabled={isLoading}
            variant={isModelPanelOpen ? 'contained' : 'outlined'}
            sx={{
              bgcolor: isModelPanelOpen ? 'primary.main' : isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              borderColor: 'divider',
              color: isModelPanelOpen ? 'white' : 'text.primary',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textTransform: 'none',
              minWidth: 'auto',
              px: 2.5,
              py: 1.25,
              '&:hover': {
                bgcolor: isModelPanelOpen ? 'primary.dark' : isDark ? 'rgba(50,50,60,0.9)' : 'rgba(240,240,240,0.95)',
                borderColor: 'divider'
              },
              '&.Mui-disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
          >
            {t('tryOn.canvas.openModel') || 'Model'}
          </Button>
        </Box>

        {/* Model Gallery Panel - Collapsible */}
        <Collapse in={isModelPanelOpen} timeout={300}>
          <Paper
            elevation={4}
            onMouseEnter={() => {
              // Keep panel open when hovering over it (desktop only)
              if (window.innerWidth >= 1024) {
                if (modelPanelHoverTimeout) clearTimeout(modelPanelHoverTimeout)
              }
            }}
            onMouseLeave={() => {
              // Auto-close after delay when leaving panel (desktop only)
              if (window.innerWidth >= 1024) {
                const timeout = setTimeout(() => {
                  handleModelPanelToggle(false)
                }, 300) // 300ms delay before closing
                setModelPanelHoverTimeout(timeout)
              }
            }}
            sx={{
              p: 2,
              width: 280,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* Model Images Grid */}
            {isLoadingModels ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    mb: 2
                  }}
                >
                  {/* Render model images and fill remaining slots with placeholders (max 6) */}
                  {[...Array(6)].map((_, idx) => {
                    const model = modelImages[idx]

                    if (model) {
                      return (
                        <Box
                          key={model.id}
                          onClick={() => {
                            if (!isLoading) {
                              onModelSelect?.(model)
                            }
                          }}
                          sx={{
                            position: 'relative',
                            aspectRatio: '9/16',
                            borderRadius: 1,
                            overflow: 'hidden',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            border: '2px solid',
                            borderColor: selectedModelId === model.id ? 'primary.main' : 'divider',
                            transition: 'all 0.2s ease',
                            opacity: isLoading ? 0.6 : 1,
                            pointerEvents: isLoading ? 'none' : 'auto',
                            '&:hover': {
                              borderColor: isLoading ? 'divider' : 'primary.light',
                              transform: isLoading ? 'scale(1)' : 'scale(1.02)',
                              '& .delete-icon': {
                                opacity: isLoading ? 0 : 1
                              }
                            }
                          }}
                        >
                          {!loadedModelImages.has(model.id) && (
                            <Skeleton
                              variant='rectangular'
                              width='100%'
                              height='100%'
                              animation='wave'
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                              }}
                            />
                          )}
                          <Box
                            component='img'
                            src={model.imageUrl}
                            alt={`Model ${model.id}`}
                            onLoad={() => {
                              setLoadedModelImages(prev => new Set(prev).add(model.id))
                            }}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: loadedModelImages.has(model.id) ? 1 : 0,
                              transition: 'opacity 0.3s ease'
                            }}
                          />
                          {/* Delete icon - top left */}
                          <IconButton
                            className='delete-icon'
                            onClick={e => {
                              e.stopPropagation()
                              if (!isLoading) {
                                onDeleteModel?.(model)
                              }
                            }}
                            disabled={isLoading}
                            size='small'
                            sx={{
                              position: 'absolute',
                              top: 4,
                              left: 4,
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              padding: '2px',
                              '&:hover': {
                                bgcolor: 'error.main'
                              },
                              '&.Mui-disabled': {
                                opacity: 0.3,
                                cursor: 'not-allowed'
                              }
                            }}
                          >
                            <Trash2Icon width={14} height={14} />
                          </IconButton>

                          {/* Set as Default button - bottom */}
                          <Button
                            onClick={e => {
                              e.stopPropagation()
                              if (!isLoading && !model.isDefault) {
                                handleSetDefaultClick(model)
                              }
                            }}
                            disabled={isLoading}
                            size='small'
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: model.isDefault 
                                ? 'primary.main' 
                                : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                              color: model.isDefault ? 'white' : '#000000',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              py: 0.75,
                              borderRadius: 0,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              backdropFilter: 'blur(4px)',
                              borderTop: '1px solid',
                              borderColor: model.isDefault ? 'primary.dark' : 'divider',
                              cursor: model.isDefault ? 'default' : 'pointer',
                              '&:hover': {
                                bgcolor: model.isDefault 
                                  ? 'primary.main' 
                                  : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
                              },
                              '&.Mui-disabled': {
                                opacity: 0.5,
                                cursor: 'not-allowed',
                                color: model.isDefault ? 'white' : '#000000'
                              }
                            }}
                          >
                            {model.isDefault ? 'Default' : 'Set as Default'}
                          </Button>

                        </Box>
                      )
                    }

                    // Empty placeholder slot
                    return (
                      <Box
                        key={`placeholder-${idx}`}
                        sx={{
                          aspectRatio: '9/16',
                          borderRadius: 1,
                          bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          border: '1px dashed',
                          borderColor: 'divider'
                        }}
                      />
                    )
                  })}
                </Box>

                {/* + Add Button */}
                <Button
                  onClick={onAddModelFromPanel}
                  disabled={isLoading}
                  variant='outlined'
                  fullWidth
                  startIcon={<span style={{ fontSize: '1.5rem' }}>+</span>}
                  sx={{
                    borderRadius: 1,
                    borderStyle: 'dashed',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontWeight: 600,
                    py: 1.25,
                    mb: 2,
                    '&:hover': {
                      bgcolor: 'primary.lighterOpacity',
                      borderStyle: 'dashed'
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                      color: 'action.disabled',
                      borderColor: 'action.disabled'
                    }
                  }}
                >
                  {t('tryOn.canvas.addModel') || 'Add'}
                </Button>

                {/* Model Tabs Section (Collapsible) */}
                <Box
                  sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 1.5,
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    {t('tryOn.canvas.modelTabs') || 'Model Tabs'}
                  </Typography>
                  <Typography
                    variant='caption'
                    component='span'
                    onClick={() => {
                      // console.log('Navigating to profile info view with lang:', lang)
                      router.push(`/${lang}/profile#profile-info`)
                    }}
                    sx={{
                      display: 'inline-block',
                      color: 'text.disabled',
                      mt: 0.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    ({t('tryOn.canvas.collapsible') || 'Collapsible'})
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Collapse>
      </Box>

      <Box
        id='intro-result-container'
        sx={{
          position: 'relative',
          display: 'flex',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {displayImageUrl ? (
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}
          >
            {mainImageError ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '768 / 1376',
                  width: { xs: '100%', sm: '80%', md: '70%' },
                  maxHeight: { xs: '100%', md: '85vh' },
                  borderRadius: { xs: 0, md: 2 },
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: '2px dashed',
                  borderColor: 'error.main',
                  gap: 2,
                  p: 3
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{ color: theme.palette.error.main }}
                  >
                    <circle cx='12' cy='12' r='10' />
                    <line x1='12' y1='8' x2='12' y2='12' />
                    <line x1='12' y1='16' x2='12.01' y2='16' />
                  </svg>
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    color: 'error.main',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  {t('tryOn.canvas.imageLoadError') || 'Failed to load image'}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    maxWidth: 300
                  }}
                >
                  {t('tryOn.canvas.imageLoadErrorDesc') || 'The image could not be loaded. It may have expired or is unavailable.'}
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={() => {
                    setMainImageError(false)
                    setIsMainImageLoaded(false)
                    // Force reload by adding a cache buster
                    const img = document.getElementById('intro-result-image') as HTMLImageElement
                    if (img && displayImageUrl) {
                      const separator = displayImageUrl.includes('?') ? '&' : '?'
                      img.src = `${displayImageUrl}${separator}_t=${Date.now()}`
                    }
                  }}
                  sx={{ mt: 1 }}
                >
                  {t('tryOn.canvas.retryLoad') || 'Retry'}
                </Button>
              </Box>
            ) : (
              <Box
                id='intro-result-image'
                component='img'
                src={displayImageUrl}
                alt={t('tryOn.canvas.result')}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement
                  // console.log('Image loaded successfully:', img.src)
                  setIsMainImageLoaded(true)
                  setMainImageError(false)
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  // console.error('Failed to load image:', img.src)
                  setIsMainImageLoaded(false)
                  setMainImageError(true)
                }}
                sx={{
                  maxHeight: { xs: '100%', md: '85vh' },
                  maxWidth: { xs: '100%', md: '100%' },
                  width: 'auto',
                  height: 'auto',
                  borderRadius: { xs: 0, md: 2 },
                  objectFit: 'contain'
                }}
              />
            )}
          </Box>
        ) : (
          <Box
            id='intro-add-model-placeholder'
            onClick={onAddModel}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',

              // Fixed aspect ratio matching 768×1376 (approx 1:1.79)
              aspectRatio: '768 / 1376',
              width: { xs: 200, sm: 240, md: 280 },
              maxHeight: '90%',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'primary.main',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                transform: 'scale(1.01)'
              }
            }}
          >
            <Box
              sx={{
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 },
                borderRadius: '50%',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }, color: 'primary.main' }}>
                +
              </Typography>
            </Box>
            <Typography
              variant='h6'
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                textAlign: 'center',
                px: 3,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
              }}
            >
              {t('tryOn.canvas.addModelPlaceholder')}
            </Typography>
          </Box>
        )}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Spinner />
                {loadingMessage && (
                  <Typography
                    variant='h6'
                    sx={{
                      px: 2,
                      textAlign: 'center',
                      color: isDark ? 'grey.100' : 'text.primary',
                      fontWeight: 600,
                      fontFamily: 'serif'
                    }}
                  >
                    {loadingMessage}
                  </Typography>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Pose menu - luôn render để Intro.js có thể highlight */}
      <Box
        className='pose-menu'
        sx={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          opacity: isIntroActive || (displayImageUrl && !isLoading && showPoseMenu) ? 1 : 0,
          transition: 'opacity 0.3s ease',
          visibility: 'visible',
          pointerEvents: isIntroActive || (displayImageUrl && !isLoading && showPoseMenu) ? 'auto' : 'none',
          '&:hover': {
            opacity: 1
          }
        }}
        onMouseEnter={() => {
          if (displayImageUrl && !isLoading && showPoseMenu) {
            setIsPoseMenuOpen(true)
          }
        }}
        onMouseLeave={() => {
          if (displayImageUrl && !isLoading && showPoseMenu) {
            setIsPoseMenuOpen(false)
          }
        }}
      >
        <AnimatePresence>
          {isPoseMenuOpen && displayImageUrl && !isLoading && showPoseMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                bottom: '100%',
                marginBottom: 12,
                width: 256,
                borderRadius: 8,
                border: isDark ? '1px solid rgba(148,163,184,0.5)' : '1px solid rgba(0,0,0,0.12)',
                background: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px)',
                padding: 8
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {poseInstructions.map((pose, index) => (
                  <Button
                    key={pose}
                    onClick={() => onSelectPose(index)}
                    disabled={isLoading || index === currentPoseIndex}
                    variant={index === currentPoseIndex ? 'contained' : 'text'}
                    size='small'
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontSize: '0.875rem',
                      fontWeight: index === currentPoseIndex ? 700 : 500,
                      color: index === currentPoseIndex ? 'white' : 'text.primary',
                      bgcolor: index === currentPoseIndex ? 'primary.main' : 'transparent',
                      '&:hover': {
                        bgcolor: index === currentPoseIndex ? 'primary.dark' : 'action.hover'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    {getPoseLabel(pose)}
                  </Button>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        <Box
          id='intro-pose-selector'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark ? 'rgba(148,163,184,0.6)' : 'divider',
            bgcolor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            p: 1,
            minWidth: 280,
            minHeight: 40,
            opacity: isIntroActive || (displayImageUrl && !isLoading && showPoseMenu) ? 1 : 0.5,
            visibility: 'visible'
          }}
        >
          <IconButton
            onClick={handlePreviousPose}
            disabled={isLoading}
            size='small'
            sx={{
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.8)'
              },
              '&:active': {
                transform: 'scale(0.9)'
              },
              '&.Mui-disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
            aria-label={t('tryOn.canvas.previousPose')}
          >
            <ChevronLeftIcon style={{ width: 20, height: 20, color: 'var(--mui-palette-text-primary)' }} />
          </IconButton>
          <Typography
            variant='body2'
            sx={{
              width: 192,
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={
              displayImageUrl
                ? getPoseLabel(poseInstructions[currentPoseIndex])
                : t('tryOn.canvas.changePose') || 'Đổi tư thế'
            }
          >
            {displayImageUrl
              ? getPoseLabel(poseInstructions[currentPoseIndex])
              : t('tryOn.canvas.changePose') || 'Đổi tư thế'}
          </Typography>
          <IconButton
            onClick={handleNextPose}
            disabled={isLoading || !displayImageUrl}
            size='small'
            sx={{
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.8)'
              },
              '&:active': {
                transform: 'scale(0.9)'
              },
              '&.Mui-disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
            aria-label={t('tryOn.canvas.nextPose')}
          >
            <ChevronRightIcon style={{ width: 20, height: 20, color: 'var(--mui-palette-text-primary)' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Set Default Confirmation Dialog */}
      <Dialog
        open={showSetDefaultConfirm}
        onClose={handleCancelSetDefault}
        maxWidth='xs'
        fullWidth
      >
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.lighterOpacity',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-star' style={{ fontSize: '2rem', color: 'var(--mui-palette-primary-main)' }} />
            </Box>
            <Typography variant='h6' sx={{ fontWeight: 700, textAlign: 'center' }}>
              {t('tryOn.modals.setDefaultModel')}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
              {t('tryOn.modals.setDefaultModelDesc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 1 }}>
              <Button onClick={handleCancelSetDefault} variant='outlined' fullWidth>
                {t('tryOn.buttons.cancel')}
              </Button>
              <Button onClick={handleConfirmSetDefault} variant='contained' color='primary' fullWidth>
                {t('tryOn.modals.confirmSet')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default CanvasDisplay
