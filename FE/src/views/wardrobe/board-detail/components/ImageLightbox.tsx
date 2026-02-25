'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import type { BoardImageResponse } from '@/types/wardrobe.type'
import type { ItemTemplate } from '@/views/try-on/types'

interface ImageLightboxProps {
  images: BoardImageResponse[]
  currentIndex: number
  open: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
  itemsTemplate?: ItemTemplate[]
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  open,
  onClose,
  onIndexChange,
  itemsTemplate = []
}) => {
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const currentImage = images[currentIndex]

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1

    onIndexChange(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0

    onIndexChange(newIndex)
  }

  // Reset zoom and position when image changes
  useEffect(() => {
    if (open) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [currentIndex, open])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIndex, images.length])

  if (!open || !currentImage) return null

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: alpha('#000', 0.95),
          backdropFilter: 'blur(10px)',
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
          m: 0,
          borderRadius: 0
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Header Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            background: `linear-gradient(to bottom, ${alpha('#000', 0.5)}, transparent)`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {currentIndex + 1} / {images.length}
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.7 }}>
              {currentImage?.fileName || 'Image'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              bgcolor: alpha('#fff', 0.1),
              '&:hover': {
                bgcolor: alpha('#fff', 0.2)
              }
            }}
          >
            <i className='tabler-x' style={{ fontSize: '24px' }} />
          </IconButton>
        </Box>

        {/* Bottom Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            background: `linear-gradient(to top, ${alpha('#000', 0.5)}, transparent)`
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: alpha('#000', 0.3),
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              p: 1
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.1)
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              <i className='tabler-zoom-out' style={{ fontSize: '20px' }} />
            </IconButton>
            <Typography variant='body2' sx={{ color: 'white', minWidth: 50, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.1)
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              <i className='tabler-zoom-in' style={{ fontSize: '20px' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Associated Items Display */}
        {itemsTemplate && itemsTemplate.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              maxWidth: 'auto',
              maxHeight: 'calc(100% - 40px)',
              bgcolor: alpha('#000', 0.8),
              backdropFilter: 'blur(12px)',
              borderRadius: 3,
              p: 3,
              border: '2px solid',
              borderColor: alpha('#fff', 0.3),
              zIndex: 11,
              overflow: 'auto'
            }}
          >
            <Typography
              variant='subtitle2'
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                display: 'block',
                mb: 2,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Associated Items ({itemsTemplate.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {itemsTemplate.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: alpha('#fff', 0.05),
                    border: '2px dashed',
                    borderColor: alpha('#ffffffff', 0.6),
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: alpha('#2196F3', 1),
                      bgcolor: alpha('#2196F3', 0.1),
                      boxShadow: `0 8px 24px ${alpha('#2196F3', 0.4)}`,
                      '& .item-image': {
                        transform: 'scale(1.08)'
                      },
                      '& .item-name': {
                        color: '#2196F3',
                        fontWeight: 700
                      }
                    }
                  }}
                  title={item.name}
                >
                  <Box
                    component='img'
                    src={item.imageUrl}
                    alt={item.name}
                    className='item-image'
                    sx={{
                      width: '85%',
                      height: '85%',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease',
                      marginBottom: 0.5
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      // console.warn(`Failed to load image for item: ${item.name}`)
                      target.style.display = 'none'
                    }}
                  />
                  <Typography
                    className='item-name'
                    variant='caption'
                    sx={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      textAlign: 'center',
                      px: 0.5,
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: 'white',
                bgcolor: alpha('#000', 0.3),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: alpha('#000', 0.5)
                }
              }}
            >
              <i className='tabler-chevron-left' style={{ fontSize: '32px' }} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: 'white',
                bgcolor: alpha('#000', 0.3),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: alpha('#000', 0.5)
                }
              }}
            >
              <i className='tabler-chevron-right' style={{ fontSize: '32px' }} />
            </IconButton>
          </>
        )}

        {/* Main Image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Box
            component='img'
            src={currentImage?.url || '/placeholder.png'}
            alt={currentImage?.fileName || 'Image'}
            onError={(e) => {
              const target = e.target as HTMLImageElement

              if (target.src && !target.src.includes('/placeholder.png')) {
                target.src = '/placeholder.png'
              }
            }}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'transform 0.2s ease',
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              userSelect: 'none'
            }}
            draggable={false}
          />
        </Box>

        {/* Background Click to Close */}
        <Box
          onClick={onClose}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: -1
          }}
        />
      </Box>
    </Dialog>
  )
}

export default ImageLightbox

