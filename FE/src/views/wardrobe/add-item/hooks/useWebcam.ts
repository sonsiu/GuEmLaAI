import { useRef, useState, useEffect } from 'react'

export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [isMobile, setIsMobile] = useState(false)

  // Detect if user is on mobile device
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
    setIsMobile(checkMobile())
  }, [])

  // Function to enable video stream
  const enableVideoStream = async (facingMode: 'user' | 'environment' = cameraFacing) => {
    setIsLoading(true)
    setError('')

    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Camera API is not supported. Please use HTTPS or try a different browser. ' +
            'On mobile, camera access requires a secure context (HTTPS).'
        )
      }

      // Stop existing stream if any
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }

      // Mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: isMobile ? { ideal: 1920, max: 1920 } : { ideal: 1280 },
          height: isMobile ? { ideal: 1080, max: 1080 } : { ideal: 720 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setMediaStream(stream)
      setIsStreamActive(true)
      setCameraFacing(facingMode)
    } catch (error: any) {
      // console.error('Error accessing camera:', error)
      let errorMessage = error.message || 'Unknown error occurred'

      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access was denied. Please grant camera permissions and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera doesn't support the requested settings."
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to switch camera (mobile feature)
  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    await enableVideoStream(newFacing)
  }

  // Function to stop video stream
  const stopVideoStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
      setMediaStream(null)
      setIsStreamActive(false)
    }
  }

  // Function to capture photo from webcam
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/png')
        setCapturedImage(imageDataUrl)

        // Show flash effect
        setShowFlash(true)
        setTimeout(() => setShowFlash(false), 200)
      }
    }
  }

  // Function to clear captured photo
  const clearPhoto = () => {
    setCapturedImage(null)
  }

  // Effect to set video source when mediaStream changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [mediaStream])

  return {
    videoRef,
    canvasRef,
    mediaStream,
    isLoading,
    error,
    setError,
    isStreamActive,
    capturedImage,
    setCapturedImage,
    showFlash,
    cameraFacing,
    isMobile,
    enableVideoStream,
    switchCamera,
    stopVideoStream,
    capturePhoto,
    clearPhoto
  }
}

