'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import { alpha, useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type { Board, BoardImageResponse, GetUserBoardsResponse } from '@/types/wardrobe.type'
import ImageLightbox from './components/ImageLightbox'
import UploadImageModal from './components/UploadImageModal'
import DeleteImageConfirmDialog from './components/DeleteImageConfirmDialog'

const BoardDetailView: React.FC = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const { t, lang } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const boardId = params?.boardId as string

  const [board, setBoard] = useState<Board | null>(null)
  const [images, setImages] = useState<BoardImageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch board details and images
  useEffect(() => {
    const fetchBoardData = async () => {
      if (!user?.id || !boardId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const numericBoardId = parseInt(boardId, 10)
        if (isNaN(numericBoardId)) {
          throw new Error('Invalid board ID')
        }

        // Fetch board images
        const boardImages = await wardrobeService.getBoardImages(numericBoardId)
        setImages(boardImages || [])

        // Initialize loading states for all images
        const loadingStates: Record<number, boolean> = {}
        boardImages.forEach((img) => {
          loadingStates[img.id] = true
        })
        setImageLoadingStates(loadingStates)

        // Fetch board details from user's boards
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
        const boardsResponse = await wardrobeService.getUserBoards(userId)

        if (boardsResponse?.boards) {
          const currentBoard = boardsResponse.boards.find((b: Board) => b.id === numericBoardId)

          if (currentBoard) {
            setBoard(currentBoard)
          } else {
            // Fallback if board not found
            setBoard({
              id: numericBoardId,
              title: `Board ${boardId}`,
              description: null,
              createdAt: new Date().toISOString(),
              coverImageId: null,
              coverImageUrl: null
            })
          }
        } else {
          // Fallback if board details fetch fails
          setBoard({
            id: numericBoardId,
            title: `Board ${boardId}`,
            description: null,
            createdAt: new Date().toISOString(),
            coverImageId: null,
            coverImageUrl: null
          })
        }
      } catch (err) {
        // console.error('Error fetching board data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load board')
      } finally {
        setLoading(false)
      }
    }

    fetchBoardData()
  }, [user?.id, boardId])

  const handleImageLoad = (imageId: number) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false
    }))
  }

  const handleImageError = (imageId: number) => {
    // console.error('Image failed to load:', imageId)
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false
    }))
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const handleDeleteClick = (imageId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setImageToDelete(imageId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return

    setDeleting(true)
    try {
      await wardrobeService.removeBoardImage(imageToDelete)

      // Remove the image from the state
      setImages((prevImages) => prevImages.filter((img) => img.id !== imageToDelete))

      // Close the modal
      setDeleteConfirmOpen(false)
      setImageToDelete(null)
    } catch (err) {
      // console.error('Error deleting image:', err)
      showErrorToast(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setImageToDelete(null)
  }

  const handleUploadSuccess = async () => {
    if (!boardId) return

    try {
      const numericBoardId = parseInt(boardId, 10)
      if (isNaN(numericBoardId)) return

      const boardImages = await wardrobeService.getBoardImages(numericBoardId)
      setImages(boardImages || [])

      // Initialize loading states for new images
      const loadingStates: Record<number, boolean> = {}
      boardImages.forEach((img) => {
        loadingStates[img.id] = true
      })
      setImageLoadingStates(loadingStates)
    } catch (err) {
      console.error('Error refreshing images:', err)
    }
  }

  const handleBack = () => {
    router.push(`/${lang}/wardrobe?tab=boards`)
  }

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
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<i className='tabler-arrow-left' />}
          onClick={handleBack}
          variant='outlined'
          size='small'
        >
          {t('common.back') || 'Back'} to Wardrobe
        </Button>
      </Box>

      {loading ? (
        <>
          {/* Skeleton Loading */}
          <Box sx={{ mb: 4 }}>
            <Skeleton variant='text' width={300} height={48} sx={{ mb: 1 }} />
            <Skeleton variant='text' width={200} height={24} />
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={i}>
                <Skeleton variant='rectangular' sx={{ aspectRatio: '1/1', borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </>
      ) : error ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center'
          }}
        >
          <Typography variant='h5' color='error' gutterBottom>
            {t('tryOn.wardrobe.boardDetail.errorLoading') || 'Error Loading Board'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant='contained' onClick={() => window.location.reload()}>
            {t('common.retry') || 'Retry'}
          </Button>
        </Box>
      ) : (
        <>
          {/* Board Header */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2
              }}
            >
              <Box>
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem', lg: '2.5rem' }
                  }}
                >
                  {board?.title || 'Board'}
                </Typography>
                {board?.description && (
                  <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
                    {board.description}
                  </Typography>
                )}
                <Typography variant='body2' color='text.secondary'>
                  {images.length} {images.length === 1 ? 'image' : 'images'}
                </Typography>
              </Box>
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setUploadModalOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)'
                  }
                }}
              >
                {t('tryOn.wardrobe.boardDetail.uploadImage') || 'Upload Image'}
              </Button>
            </Box>
          </Box>

          {/* Images Grid */}
          {images.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center'
              }}
            >
              <Box
                sx={{
                  width: 128,
                  height: 128,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}
              >
                <i className='tabler-photo' style={{ fontSize: '48px', opacity: 0.5 }} />
              </Box>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {t('tryOn.wardrobe.boardDetail.noImages') || 'No images yet'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 400, mb: 3 }}>
                {t('tryOn.wardrobe.boardDetail.noImagesDescription') ||
                  'Add images to this board to start building your collection.'}
              </Typography>
              <Button variant='contained' onClick={() => setUploadModalOpen(true)}>
                {t('tryOn.wardrobe.boardDetail.uploadImage') || 'Upload Image'}
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {images.map((image, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={image.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover .delete-button': {
                        opacity: 1
                      },
                      '&:hover .overlay': {
                        opacity: 0.2
                      }
                    }}
                    onClick={() => handleImageClick(index)}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                          : '0 4px 16px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                            : '0 8px 24px rgba(0, 0, 0, 0.15)'
                        }
                      }}
                    >
                      {/* Skeleton while loading */}
                      {imageLoadingStates[image.id] && (
                        <Skeleton variant='rectangular' width='100%' height='100%' />
                      )}

                      {/* Image */}
                      <Box
                        component='img'
                        src={image.url || '/placeholder.png'}
                        alt={image.fileName || 'Board image'}
                        onLoad={() => handleImageLoad(image.id)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src !== '/placeholder.png') {
                            target.src = '/placeholder.png'
                          }
                          handleImageError(image.id)
                        }}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: imageLoadingStates[image.id] ? 'none' : 'block'
                        }}
                      />

                      {/* Hover Overlay */}
                      <Box
                        className='overlay'
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'black',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}
                      />

                      {/* Delete Button */}
                      <IconButton
                        className='delete-button'
                        onClick={(e) => handleDeleteClick(image.id, e)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'error.main',
                          color: 'error.contrastText',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          '&:hover': {
                            bgcolor: 'error.dark'
                          }
                        }}
                        size='small'
                      >
                        <i className='tabler-trash' style={{ fontSize: '16px' }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={currentImageIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setCurrentImageIndex}
      />

      {/* Upload Image Modal */}
      <UploadImageModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        boardId={boardId ? parseInt(boardId, 10) : 0}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteImageConfirmDialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </Box>
  )
}

export default BoardDetailView

