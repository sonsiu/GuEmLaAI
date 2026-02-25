'use client'

import { useTranslation } from '@/@core/hooks/useTranslation'
import type { ModelUserResponse } from '@/services/user.types'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { useCountdownToMidnight } from '../hooks/useCountdownToMidnight'
import { getFriendlyErrorMessage } from '../utils/errorUtils'
import Spinner from './Spinner'
import WebcamModal from './WebcamModal'
import { UploadCloudIcon } from './icons'
import { Compare } from './ui/Compare'

interface StartScreenProps {
  onModelFinalized: (
    modelUrl: string,
    options?: {
      base64Data?: string
      originalFile?: File
      persist?: boolean
      presignedUrl?: string
      fileName?: string
    }
  ) => void | Promise<void>
  onGenerateModel: (file: File) => Promise<{
    displayUrl: string
    base64Data?: string
    presignedUrl?: string
    fileName?: string
  }>
  isAuthenticated: boolean
  modelUserData?: ModelUserResponse | null
  isRestarting?: boolean
}

const StartScreen: React.FC<StartScreenProps> = ({
  onModelFinalized,
  onGenerateModel,
  isAuthenticated,
  modelUserData,
  isRestarting = false
}) => {
  const router = useRouter()
  const { t } = useTranslation()
  const countdown = useCountdownToMidnight()
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null)
  const [generatedModelBase64, setGeneratedModelBase64] = useState<string | null>(null)
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false)

  // Compress image if too large for API payload
  const compressImageIfNeeded = useCallback(async (imageDataUrl: string, maxSizeMB: number = 4): Promise<string> => {
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
  }, [])

  const shouldSkipToStyling = Boolean(
    modelUserData?.modelPictureUrls && 
    modelUserData.modelPictureUrls.length > 0 && 
    isAuthenticated && 
    !isRestarting
  )

  useEffect(() => {
    if (shouldSkipToStyling && modelUserData?.modelPictureUrls && modelUserData.modelPictureUrls.length > 0) {
      const firstModelUrl = modelUserData.modelPictureUrls[0]
      // Extract filename from URL
      const fileName = firstModelUrl.split('/').pop() || undefined
      void onModelFinalized(firstModelUrl, {
        persist: false,
        fileName: fileName
      })
    }
  }, [shouldSkipToStyling, modelUserData?.modelPictureUrls, onModelFinalized])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError(t('tryOn.startScreen.invalidFile'))
        return
      }

      if (!isAuthenticated) {
        setError(t('tryOn.startScreen.loginRequired'))
        return
      }

      setIsGenerating(true)
      setGeneratedModelUrl(null)
      setGeneratedModelBase64(null)
      setError(null)
      setOriginalFile(file)

      const reader = new FileReader()

      reader.onload = async event => {
        let dataUrl = event.target?.result as string

        // Compress if needed before setting and processing
        try {
          dataUrl = await compressImageIfNeeded(dataUrl, 4) // 4MB limit for API payload
        } catch (error) {
          // console.error('Image compression failed:', error)
          setError(t('tryOn.startScreen.readError') || 'Failed to process image. Please try a different image.')
          setIsGenerating(false)
          return
        }

        setUserImageUrl(dataUrl)

        try {
          // Convert compressed data URL back to File for API
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })

          const generated = await onGenerateModel(compressedFile)

          setGeneratedModelUrl(generated.displayUrl)
          setGeneratedModelBase64(generated.base64Data || null)
          setGeneratedFileName(generated.fileName || null)
        } catch (err) {
          setError(
            getFriendlyErrorMessage(err, t('tryOn.startScreen.generationFailed'), {
              humanModelRequired: t('tryOn.errors.humanModelRequired'),
              generationFailed: t('tryOn.errors.generationFailed'),
              noImageDetected: t('tryOn.errors.noImageDetected'),
              maxModelsReached: t('tryOn.errors.maxModelsReached')
            })
          )
          setUserImageUrl(null)
        } finally {
          setIsGenerating(false)
        }
      }

      reader.onerror = () => {
        setError(t('tryOn.startScreen.readError'))
        setIsGenerating(false)
      }

      reader.readAsDataURL(file)
    },
    [isAuthenticated, onGenerateModel, t, compressImageIfNeeded]
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      void handleFileSelect(event.target.files[0])
    }
  }

  const handleWebcamCapture = useCallback(
    async (file: File) => {
      await handleFileSelect(file)
      setIsWebcamModalOpen(false)
    },
    [handleFileSelect]
  )

  const reset = () => {
    setUserImageUrl(null)
    setGeneratedModelUrl(null)
    setGeneratedModelBase64(null)
    setGeneratedFileName(null)
    setOriginalFile(null)
    setIsGenerating(false)
    setError(null)
  }

  const proceedToStyling = () => {
    if (!generatedModelUrl) return

    void onModelFinalized(generatedModelUrl, {
      // The backend already saves the generated model; skip re-saving to avoid format conversion to webp
      persist: false,
      base64Data: generatedModelBase64 ?? generatedModelUrl,
      originalFile: originalFile ?? undefined,
      fileName: generatedFileName ?? undefined
    })
  }

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }

  return (
    <>
      <AnimatePresence mode='wait'>
        {!userImageUrl ? (
          <Box
            component={motion.div}
            key='uploader'
            variants={screenVariants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            sx={{
              width: '100%',
              maxWidth: '1200px',
              mx: 'auto',
              p: { xs: 2, md: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 4, md: 6 },
              minHeight: '70vh'
            }}
          >
            {/* Text Content */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                textAlign: { xs: 'center', md: 'left' },
                width: '100%',
                flex: { xs: 'none', md: 1 },
                gap: 2,
                maxWidth: '480px',
                flexShrink: 0
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '9999px',
                    bgcolor: 'primary.lighterOpacity',
                    border: '1px solid',
                    borderColor: 'primary.main',
                    alignSelf: { xs: 'center', md: 'flex-start' }
                  }}
                >
                  <i
                    className='tabler-sparkles'
                    style={{ fontSize: '1rem', color: 'var(--mui-palette-primary-main)' }}
                  ></i>
                  <Typography variant='caption' sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {t('tryOn.startScreen.badge')}
                  </Typography>
                </Box>

                <Typography
                  variant='h2'
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                    background:
                      'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-error-main), var(--mui-palette-warning-main))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('tryOn.startScreen.title')}
                  <br />
                  <Box component='span' sx={{ color: 'text.primary' }}>
                    {t('tryOn.startScreen.subtitle')}
                  </Box>
                </Typography>

                <Typography variant='h6' color='text.secondary' sx={{ lineHeight: 1.7, maxWidth: '600px' }}>
                  {t('tryOn.startScreen.description')}
                </Typography>
              </Box>

              <Box sx={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isAuthenticated ? (
                  <>
                    <label htmlFor='image-upload-start'>
                      <input
                        id='image-upload-start'
                        type='file'
                        style={{ display: 'none' }}
                        accept='image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif'
                        onChange={handleFileChange}
                        disabled={isGenerating}
                      />
                      <Button
                        component='span'
                        variant='contained'
                        size='large'
                        startIcon={<UploadCloudIcon style={{ width: 20, height: 20 }} />}
                        disabled={isGenerating}
                        sx={{
                          width: '100%',
                          background:
                            'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                          borderRadius: '9999px',
                          py: 1.5,
                          fontWeight: 600,
                          boxShadow: '0 8px 16px -4px rgba(var(--mui-palette-primary-mainChannel), 0.3)'
                        }}
                      >
                        {t('tryOn.startScreen.uploadPhoto')}
                      </Button>
                    </label>
                    <Button
                      variant='outlined'
                      size='large'
                      onClick={() => setIsWebcamModalOpen(true)}
                      sx={{
                        width: '100%',
                        borderRadius: '9999px',
                        py: 1.5,
                        fontWeight: 600
                      }}
                    >
                      {t('tryOn.startScreen.webcam') || 'Webcam'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => router.push('/login')}
                    variant='contained'
                    size='large'
                    sx={{
                      width: '100%',
                      background:
                        'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                      borderRadius: '9999px',
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    {t('tryOn.startScreen.loginToUpload')}
                  </Button>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('tryOn.startScreen.photoTip')}
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {t('tryOn.startScreen.responsibleUse')} · {countdown.formattedString}
                  </Typography>
                </Box>

                {error && (
                  <Alert severity='error' sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </Box>

            {/* Preview Image */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                width: '100%',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'relative', maxHeight: '100%' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -20,
                    background:
                      'linear-gradient(135deg, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    opacity: 0.6
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    height: '65vh',
                    maxHeight: '65vh',
                    width: 'auto',
                    borderRadius: 5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.15)'
                  }}
                >
                  <Compare
                    firstImage='https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg'
                    secondImage='https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png'
                    slideMode='drag'
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            component={motion.div}
            key='compare'
            variants={screenVariants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            sx={{
              width: '100%',
              maxWidth: '100%',
              mx: 'auto',
              p: { xs: 2, md: 3 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 3, md: 4 },
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Text Content */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                width: '100%',
                flex: { xs: 'none', md: 1 },
                gap: 2,
                maxWidth: '480px',
                flexShrink: 0
              }}
            >
              <Box sx={{ textAlign: { xs: 'center', md: 'left' }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography
                  variant='h2'
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    background:
                      'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-error-main), var(--mui-palette-warning-main))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('tryOn.startScreen.newYou')}
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                  {t('tryOn.startScreen.dragSlider')}
                </Typography>
              </Box>

              {isGenerating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Spinner />
                  <Typography variant='h6' color='text.primary' sx={{ fontWeight: 500 }}>
                    {t('tryOn.startScreen.generating')}
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity='error' sx={{ maxWidth: 448, borderRadius: 2 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                    {t('tryOn.startScreen.generationFailed')}
                  </Typography>
                  <Typography variant='body2'>{error}</Typography>
                </Alert>
              )}

              {error && (
                <Button
                  onClick={reset}
                  variant='outlined'
                  size='small'
                  sx={{ borderRadius: 2, alignSelf: { xs: 'center', md: 'flex-start' } }}
                >
                  {t('tryOn.startScreen.tryAgain')}
                </Button>
              )}

              <AnimatePresence>
                {generatedModelUrl && !isGenerating && !error && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                    sx={{
                      display: 'flex',
                      width: '100%',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      gap: 2,
                      mt: 2
                    }}
                  >
                    {/* <Button onClick={reset} variant='outlined' size='large' sx={{ borderRadius: 2, px: 4 }}>
                      {t('tryOn.startScreen.useDifferentPhoto')}
                    </Button> */}
                    <Button
                      onClick={proceedToStyling}
                      variant='contained'
                      size='large'
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        background:
                          'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)'
                      }}
                    >
                      {t('tryOn.startScreen.proceedToStyling')} →
                    </Button>
                  </Box>
                )}
              </AnimatePresence>
            </Box>

            {/* Comparison Image */}
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'relative', maxHeight: '100%' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -20,
                    background:
                      'linear-gradient(135deg, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    opacity: 0.6,
                    animation: isGenerating ? 'pulse 2s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.3 },
                      '50%': { opacity: 0.6 }
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    height: '65vh',
                    maxHeight: '65vh',
                    width: 'auto',
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.15)'
                  }}
                >
                  <Compare
                    firstImage={userImageUrl}
                    secondImage={generatedModelUrl ?? userImageUrl}
                    slideMode='drag'
                    className='relative h-full w-full rounded-2xl'
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      <WebcamModal
        open={isWebcamModalOpen}
        onClose={() => setIsWebcamModalOpen(false)}
        onCapture={handleWebcamCapture}
        isMobile={false}
      />
    </>
  )
}

export default StartScreen
