'use client'

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface PhotoGuideModalProps {
  open: boolean
  onClose: () => void
}

interface PhotoGuideImage {
  id: number
  url: string
  label: string
  description: string
}

const PhotoGuideModal: React.FC<PhotoGuideModalProps> = ({ open, onClose }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Example images for photo guide carousel
  const photoGuideImages: PhotoGuideImage[] = [
    {
      id: 1,
      url: '/photoguide/example1.jpg',
      label: t('tryOn.wardrobe.addItem.photoGuide.example1.title') || 'Clear Background',
      description:
        t('tryOn.wardrobe.addItem.photoGuide.example1.description') ||
        'Use a plain, well-lit background for best results'
    },
    {
      id: 2,
      url: '/photoguide/example2.jpg',
      label: t('tryOn.wardrobe.addItem.photoGuide.example2.title') || 'Good Lighting',
      description:
        t('tryOn.wardrobe.addItem.photoGuide.example2.description') || 'Item laid flat, no wrinkles'
    },
    {
      id: 3,
      url: '/photoguide/example3.jpg',
      label: t('tryOn.wardrobe.addItem.photoGuide.example3.title') || 'Full View',
      description:
        t('tryOn.wardrobe.addItem.photoGuide.example3.description') || 'Full view of the garment'
    },
    {
      id: 4,
      url: '/photoguide/example4.jpg',
      label: t('tryOn.wardrobe.addItem.photoGuide.example4.title') || 'No Wrinkles',
      description:
        t('tryOn.wardrobe.addItem.photoGuide.example4.description') || 'Centered in frame'
    },
    {
      id: 5,
      url: '/photoguide/example5.jpg',
      label: 'Picture Example 5',
      description: 'No shadows or reflections'
    },
    {
      id: 6,
      url: '/photoguide/example6.jpg',
      label: 'Picture Example 6',
      description: 'High contrast for easy segmentation'
    }
  ]

  const nextGuide = () => {
    setCurrentIndex((prev) => (prev + 1) % photoGuideImages.length)
  }

  const prevGuide = () => {
    setCurrentIndex((prev) => (prev === 0 ? photoGuideImages.length - 1 : prev - 1))
  }

  const goToGuide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span">
            {t('tryOn.wardrobe.addItem.photoGuide.title') || 'Photo Guide'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <i className="tabler-x" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Subtitle */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('tryOn.wardrobe.addItem.photoGuide.subtitle') ||
              'Swipe to see examples of good garment photos'}
          </Typography>
        </Box>

        {/* Carousel Container */}
        <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto' }}>
          {/* Image Display */}
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              border: (theme) =>
                `1px solid ${
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)'
                }`
            }}
          >
            {/* Using padding-bottom trick for 950:1420 aspect ratio (149.47%) */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingBottom: '149.47%'
              }}
            >
              {/* Images */}
              {photoGuideImages.map((image, index) => (
                <Box
                  key={image.id}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    transition: 'all 0.5s ease-in-out',
                    opacity: index === currentIndex ? 1 : 0,
                    transform:
                      index === currentIndex
                        ? 'translateX(0)'
                        : index < currentIndex
                          ? 'translateX(-100%)'
                          : 'translateX(100%)',
                    pointerEvents: index === currentIndex ? 'auto' : 'none'
                  }}
                >
                  {/* Actual Image */}
                  <Box
                    component="img"
                    src={image.url}
                    alt={image.label}
                    onError={(e) => {
                      const target = e.currentTarget

                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement

                      if (fallback) {
                        fallback.style.display = 'flex'
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)'
                    }}
                  />

                  {/* Overlay with title and description */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
                      p: { xs: 2, sm: 3 },
                      color: 'white'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: 'white'
                      }}
                    >
                      {image.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: 1.4
                      }}
                    >
                      {image.description}
                    </Typography>
                  </Box>

                  {/* Fallback placeholder */}
                  <Box
                    sx={{
                      display: 'none',
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                      p: 3
                    }}
                  >
                    <Box
                      sx={{
                        width: 96,
                        height: 96,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        opacity: 0.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      <i className="tabler-camera" style={{ fontSize: 48, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        textAlign: 'center',
                        color: 'text.primary'
                      }}
                    >
                      {image.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        color: 'text.secondary',
                        maxWidth: 300
                      }}
                    >
                      {image.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Navigation Arrows */}
            <IconButton
              onClick={prevGuide}
              sx={{
                position: 'absolute',
                left: { xs: 8, sm: 12 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                boxShadow: 3,
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.85)',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                zIndex: 10
              }}
              aria-label="Previous image"
            >
              <i className="tabler-chevron-left" style={{ fontSize: 20 }} />
            </IconButton>

            <IconButton
              onClick={nextGuide}
              sx={{
                position: 'absolute',
                right: { xs: 8, sm: 12 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                boxShadow: 3,
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.85)',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                zIndex: 10
              }}
              aria-label="Next image"
            >
              <i className="tabler-chevron-right" style={{ fontSize: 20 }} />
            </IconButton>
          </Paper>

          {/* Dot Indicators */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              mt: 3
            }}
          >
            {photoGuideImages.map((_, index) => (
              <Box
                key={index}
                onClick={() => goToGuide(index)}
                sx={{
                  width: index === currentIndex ? { xs: 32, sm: 40 } : { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: 2,
                  bgcolor:
                    index === currentIndex
                      ? 'primary.main'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor:
                      index === currentIndex
                        ? 'primary.dark'
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.3)'
                  }
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </Box>

          {/* Counter */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {currentIndex + 1} / {photoGuideImages.length}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('tryOn.wardrobe.addItem.photoGuide.close') || t('common.close') || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PhotoGuideModal
