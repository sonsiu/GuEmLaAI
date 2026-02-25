'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { Camera, X } from 'lucide-react'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface WebcamModalProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
  isMobile: boolean
}

const getErrorMessage = (error: DOMException & { message?: string }, t: (key: string) => string) => {
  if (!error) return t('tryOn.webcam.errors.generic')

  if (error.name === 'NotAllowedError') {
    return t('tryOn.webcam.errors.notAllowed')
  }
  if (error.name === 'NotFoundError') {
    return t('tryOn.webcam.errors.notFound')
  }
  if (error.name === 'NotReadableError') {
    return t('tryOn.webcam.errors.notReadable')
  }
  if (error.name === 'OverconstrainedError') {
    return t('tryOn.webcam.errors.overconstrained')
  }

  return error.message || t('tryOn.webcam.errors.generic')
}

export const WebcamModal = ({ open, onClose, onCapture, isMobile: isMobileProp }: WebcamModalProps) => {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [isMobileDetected, setIsMobileDetected] = useState(false)

  // Detect if user is on mobile device (internal detection, doesn't rely on prop)
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = [
        'android',
        'webos',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',
        'windows phone'
      ]
      return (
        mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
        window.innerWidth < 768
      )
    }
    setIsMobileDetected(checkMobile())
  }, [])

  // Use either prop or detected mobile status
  const isMobile = isMobileProp || isMobileDetected

  const stopStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }
  }, [mediaStream])

  const enableStream = useCallback(
    async (facing: 'user' | 'environment' = cameraFacing) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t('tryOn.webcam.errors.browserNotSupported'))
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        stopStream()
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1080 },
            height: { ideal: 1320 }
          },
          audio: false
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setMediaStream(stream)
        setCameraFacing(facing)
      } catch (err) {
        setError(getErrorMessage(err as DOMException & { message?: string }, t))
      } finally {
        setIsLoading(false)
      }
    },
    [cameraFacing, stopStream, t]
  )

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    canvas.width = 1080
    canvas.height = 1320

    const context = canvas.getContext('2d')

    if (!context) return

    const videoAspect = video.videoWidth / video.videoHeight
    const canvasAspect = canvas.width / canvas.height

    let drawWidth = canvas.width
    let drawHeight = canvas.height
    let offsetX = 0
    let offsetY = 0

    if (videoAspect > canvasAspect) {
      drawHeight = canvas.height
      drawWidth = drawHeight * videoAspect
      offsetX = (canvas.width - drawWidth) / 2
    } else {
      drawWidth = canvas.width
      drawHeight = drawWidth / videoAspect
      offsetY = (canvas.height - drawHeight) / 2
    }

    context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
    const dataUrl = canvas.toDataURL('image/jpeg')

    setCapturedImage(dataUrl)
    stopStream()
  }

  const handleUsePhoto = () => {
    const canvas = canvasRef.current

    if (!canvas) return

    canvas.toBlob(blob => {
      if (!blob) return

      const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' })
      onCapture(file)
      cleanupAndClose()
    }, 'image/jpeg')
  }

  const cleanupAndClose = () => {
    stopStream()
    setCapturedImage(null)
    setError(null)
    setCameraFacing('user')
    onClose()
  }

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  useEffect(() => {
    if (!open) {
      stopStream()
      setCapturedImage(null)
      setError(null)
    }
  }, [open, stopStream])

  const hasStream = Boolean(mediaStream)

  return (
    <Dialog open={open} onClose={cleanupAndClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6'>{capturedImage ? t('tryOn.webcam.previewPhoto') : t('tryOn.webcam.takePhoto')}</Typography>
        <IconButton onClick={cleanupAndClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && (
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'error.lighterOpacity', border: '1px solid', borderColor: 'error.light' }}>
            <Typography variant='body2' color='error.main'>
              {error}
            </Typography>
            <Button sx={{ mt: 1 }} onClick={() => enableStream()} variant='contained' size='small'>
              {t('tryOn.webcam.retry')}
            </Button>
          </Box>
        )}

        {!capturedImage && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'grey.900',
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {hasStream ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%' }} />

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
                  {isMobile && (
                    <Button
                      variant='contained'
                      onClick={() => enableStream(cameraFacing === 'user' ? 'environment' : 'user')}
                      disabled={isLoading}
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
                    onClick={handleCapture}
                    disabled={isLoading}
                    sx={{
                      minWidth: 64,
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'primary.main'
                    }}
                  >
                    <Camera size={32} />
                  </Button>

                  <Button
                    variant='contained'
                    onClick={cleanupAndClose}
                    sx={{
                      minWidth: 48,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                    }}
                  >
                    <X size={20} />
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', color: 'grey.300' }}>
                <Camera size={48} />
                <Typography variant='body1' sx={{ mt: 2 }}>
                  {t('tryOn.webcam.pressToStart')}
                </Typography>
              </Box>
            )}

            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircularProgress color='inherit' />
              </Box>
            )}
          </Box>
        )}

        {capturedImage && (
          <Box
            component='img'
            src={capturedImage}
            alt='Captured'
            sx={{ width: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {!capturedImage && !hasStream && (
          <Button variant='contained' onClick={() => enableStream()} disabled={isLoading}>
            {t('tryOn.webcam.enableCamera')}
          </Button>
        )}

        {capturedImage && (
          <>
            <Button variant='outlined' onClick={() => setCapturedImage(null)}>
              {t('tryOn.webcam.retake')}
            </Button>
            <Button variant='contained' onClick={handleUsePhoto}>
              {t('tryOn.webcam.usePhoto')}
            </Button>
          </>
        )}
      </DialogActions>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Dialog>
  )
}

export default WebcamModal

