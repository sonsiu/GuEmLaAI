'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { getPresignedUrl } from './utils'

type Props = {
  imageUrl?: string
}

export default function SharePageClient({ imageUrl: initialImageUrl }: Props) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!initialImageUrl)

  useEffect(() => {
    const resolveImage = async () => {
      if (!initialImageUrl) return

      // If initialImageUrl looks like a filename (not starting with http), ask backend for presigned URL
      if (!(initialImageUrl.startsWith('http://') || initialImageUrl.startsWith('https://'))) {
        try {
          setLoading(true)
          const presignedUrl = await getPresignedUrl(initialImageUrl)
          setImageUrl(presignedUrl || null)
        } catch (err) {
          //console.error('Failed to resolve presigned url client-side:', err)
          setImageUrl(null)
        } finally {
          setLoading(false)
        }
      } else {
        setImageUrl(initialImageUrl)
        setLoading(false)
      }
    }

    resolveImage()
  }, [initialImageUrl])

  const handleGoToApp = () => {
    router.push('/en')
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant='body1' sx={{ color: 'text.secondary' }}>
            Loading shared image...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (!imageUrl) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth='sm'>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='h5' sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Image Not Found
            </Typography>
            <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
              The shared image could not be found or the link is invalid.
            </Typography>
            <Button
              variant='contained'
              color='primary'
              onClick={handleGoToApp}
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Try AI Fashion Try-On
            </Button>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: { xs: 2, md: 3 }, flexShrink: 0, px: 2 }}>
        <Typography variant='h4' sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
          AI-Generated Fashion Try-On
        </Typography>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
          Created with GuEmLaAI - Virtual Fashion Try-On
        </Typography>
      </Box>

      {/* Image Display */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, minHeight: 0, py: 2 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            p: { xs: 2, md: 3 },
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <img
              src={imageUrl}
              alt='AI-generated fashion try-on result'
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                height: 'auto',
                borderRadius: '0.5rem',
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'center', width: '100%' }}
          >
            <Button
              variant='contained'
              color='primary'
              onClick={handleGoToApp}
              sx={{ textTransform: 'none', fontSize: '1rem', px: 3 }}
            >
              Create Your Own Try-On
            </Button>
            <Button
              href={imageUrl}
              download='ai-fashion-tryon.png'
              variant='outlined'
              sx={{ textTransform: 'none', fontSize: '1rem', px: 3 }}
            >
              Download Image
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Footer Info */}
      <Box sx={{ textAlign: 'center', py: 2, flexShrink: 0, px: 2 }}>
        <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
          Experience AI-powered virtual fashion try-on
        </Typography>
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          Try different outfits, styles, and backgrounds instantly
        </Typography>
      </Box>
    </Box>
  )
}
