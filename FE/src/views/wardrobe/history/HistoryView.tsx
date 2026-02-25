'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { historyService } from '@/services/history.service'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type { HistoryBoardImage } from '@/views/try-on/types'
import type { Board } from '@/types/wardrobe.type'
import ImageLightbox from '../board-detail/components/ImageLightbox'
import SaveToBoardModal from './components/SaveToBoardModal'

const HistoryView: React.FC = () => {
  const theme = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const [images, setImages] = useState<HistoryBoardImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({})
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentImageInfo, setCurrentImageInfo] = useState<any>(null)
  const [loadingImageInfo, setLoadingImageInfo] = useState(false)

  const PAGE_SIZE = 15

  // Save to board functionality
  const [showSaveBoardModal, setShowSaveBoardModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    fileName: string
  } | null>(null)
  const [userBoards, setUserBoards] = useState<Board[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [savingToBoard, setSavingToBoard] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const userId = user?.id ? Number(user.id) : null

  // Fetch history images
  useEffect(() => {
    const fetchHistoryImages = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

      //  console.log('📜 Fetching history images for user:', userId)

        const historyImages = await historyService.getHistoryBoardImages(userId, 240)

      //  console.log('📜 History images received:', historyImages)

        setImages(historyImages)

        // Initialize loading states
        const loadingStates: Record<number, boolean> = {}
        historyImages.forEach((img) => {
          loadingStates[img.id] = true
        })
        setImageLoadingStates(loadingStates)

        //console.log(`✅ Loaded ${historyImages.length} history images`)
      } catch (err) {
        // console.error('Error fetching history images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load history images')
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryImages()
  }, [userId])

  const handleImageLoad = (imageId: number) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false
    }))
  }

  const handleImageError = (imageId: number) => {
    //console.error(`❌ Failed to load image ${imageId}`)
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false
    }))
    setImageErrors((prev) => ({
      ...prev,
      [imageId]: true
    }))
  }

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(images.length / PAGE_SIZE)
    const startIdx = (currentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const paginatedImages = images.slice(startIdx, endIdx)

    return { paginatedImages, totalPages }
  }, [images, currentPage])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleImageClick = async (index: number) => {
    const selectedImage = paginatedData.paginatedImages[index]
  //  console.log('🖼️ Image clicked at index:', index)
  //  console.log('📸 Selected image object:', selectedImage)
    setCurrentImageIndex(index)
    setLightboxOpen(true)

    // Fetch image info
    if (selectedImage?.id) {
      // console.log('🔄 Fetching image info for ID:', selectedImage.id)
      setLoadingImageInfo(true)
      try {
      //  console.log('📡 Calling getHistoryBoardImageInfo with ID:', selectedImage.id)
        const info = await historyService.getHistoryBoardImageInfo(selectedImage.id)
      //  console.log('✅ getHistoryBoardImageInfo returned successfully')
      //  console.log('📦 Image info data:', info)
        //console.log('📦 ItemsTemplate count:', info?.itemsTemplate?.length || 0)
        if (info?.itemsTemplate) {
        //  console.log('📦 ItemsTemplate details:', info.itemsTemplate)
        }
        setCurrentImageInfo(info)
      } catch (err) {
      //  console.error('❌ Failed to fetch image info:', err)
        // console.error('   Error message:', err instanceof Error ? err.message : String(err))
        setCurrentImageInfo(null)
      } finally {
        setLoadingImageInfo(false)
      }
    } else {
      // console.warn('⚠️ Selected image has no ID:', selectedImage)
    }
  }

  // Fetch user's boards
  const fetchUserBoards = async () => {
    if (!userId) {
      setSaveError('User not found. Please log in again.')
      return
    }

    setLoadingBoards(true)
    setSaveError(null)

    try {
      const boardsData = await wardrobeService.getUserBoards(userId)
      const boards: Board[] = boardsData?.boards || []
      setUserBoards(boards)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load boards'
      setSaveError(errorMessage)
      // console.error('Failed to fetch boards:', err)
    } finally {
      setLoadingBoards(false)
    }
  }

  // Open save modal
  const handleSaveClick = (
    imageUrl: string,
    fileName: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation() // Prevent opening lightbox
    setSelectedImage({ url: imageUrl, fileName })
    setShowSaveBoardModal(true)
    fetchUserBoards()
  }

  // Save image to selected board
  const handleSaveToBoard = async (boardId: number) => {
    if (!selectedImage || !userId) return

    setSavingToBoard(true)
    setSaveError(null)

    try {
    //  console.log('💾 Saving image to board:', boardId)
    //  console.log('📄 Filename:', selectedImage.fileName)

      // Use ClientApi to call the save-url-to-board endpoint
      // Body should be JSON string of the URL (as per GuEmLaAI implementation)
      const { ClientApi } = await import('@/services/client-api.service')
      
      const response = await ClientApi.post(
        `/Board/save-url-to-board?boardId=${boardId}`,
        selectedImage.url,
        undefined,
        false // Don't show error toast automatically
      )

      const result = response.getRaw()
      
      if (result?.success) {
        // console.log('✅ Image saved to board successfully!', result.data)
        showSuccessToast(t('tryOn.wardrobe.history.saveSuccess') || 'Image saved to board successfully!')
        setShowSaveBoardModal(false)
        setSelectedImage(null)
        setSaveError(null)
      } else {
        throw new Error(result?.message || result?.errors || 'Failed to save image')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save image'
      setSaveError(errorMessage)
      // console.error('Failed to save image to board:', err)
      showErrorToast(errorMessage)
    } finally {
      setSavingToBoard(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<i className="tabler-arrow-left" />}
          onClick={() => router.push(`/${lang}/wardrobe?tab=boards`)}
        >
          {t('tryOn.wardrobe.history.back') || 'Back to Wardrobe'}
        </Button>
      </Box>

      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className="tabler-clock" style={{ fontSize: '32px', color: theme.palette.primary.main }} />
          {t('tryOn.wardrobe.history.title') || 'History Board'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('tryOn.wardrobe.history.description') || 'All your AI generated try-on images'}
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 3, borderRadius: 2, mb: 3 }}>
          <Typography>{error}</Typography>
          <Button
            variant="contained"
            color="error"
            sx={{ mt: 2 }}
            onClick={() => router.push(`/${lang}/wardrobe?tab=boards`)}
          >
            {t('tryOn.wardrobe.history.back') || 'Back to Wardrobe'}
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 96,
              height: 96,
              bgcolor: 'grey.200',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <i className="tabler-clock" style={{ fontSize: 48, color: theme.palette.text.secondary }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            {t('tryOn.wardrobe.history.empty.title') || 'No History Yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('tryOn.wardrobe.history.empty.description') || 'Your generated AI try-on images will appear here'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push(`/${lang}/generate`)}
          >
            {t('tryOn.wardrobe.history.empty.action') || 'Generate Your First Image'}
          </Button>
        </Box>
      )}

      {/* Images Grid */}
      {!loading && !error && images.length > 0 && (
        <>
          <Grid container spacing={3}>
            {paginatedData.paginatedImages.map((image, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={image.id}>
              <Box
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover .image-overlay': {
                    opacity: 1
                  },
                  '&:hover .save-button': {
                    opacity: 1
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
                    bgcolor: 'grey.200',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  {/* Loading skeleton */}
                  {imageLoadingStates[image.id] && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  )}

                  {/* Image or Error State */}
                  {imageErrors[image.id] ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'error.light',
                        color: 'error.contrastText'
                      }}
                    >
                      <i className="tabler-alert-circle" style={{ fontSize: 48, marginBottom: 8 }} />
                      <Typography variant="caption">Failed to load</Typography>
                    </Box>
                  ) : image.url ? (
                    <>
                      <Box
                        component="img"
                        src={image.url}
                        alt={image.fileName}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: imageLoadingStates[image.id] ? 'none' : 'block'
                        }}
                        onLoad={() => handleImageLoad(image.id)}
                        onError={() => handleImageError(image.id)}
                      />
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText'
                      }}
                    >
                      <Typography variant="caption">No URL</Typography>
                    </Box>
                  )}

                  {/* Save to Board Button */}
                  <IconButton
                    className="save-button"
                    onClick={(e) => handleSaveClick(image.url, image.fileName, e)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                    size="small"
                  >
                    <i className="tabler-device-floppy" style={{ fontSize: '18px' }} />
                  </IconButton>

                  {/* Hover overlay */}
                  <Box
                    className="image-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                  />
                </Box>

              </Box>
            </Grid>
          ))}
          </Grid>

          {/* Pagination Controls */}
          {paginatedData.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={paginatedData.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={images.map((img) => ({
          id: img.id,
          fileName: img.fileName,
          url: img.url
        }))}
        currentIndex={currentImageIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setCurrentImageIndex}
        itemsTemplate={currentImageInfo?.itemsTemplate || []}
      />

      {/* Save to Board Modal */}
      <SaveToBoardModal
        open={showSaveBoardModal}
        onClose={() => {
          setShowSaveBoardModal(false)
          setSelectedImage(null)
          setSaveError(null)
        }}
        boards={userBoards}
        loading={loadingBoards}
        saving={savingToBoard}
        error={saveError}
        onSave={handleSaveToBoard}
        onNavigateToCreate={() => router.push(`/${lang}/wardrobe?tab=boards`)}
      />
    </Box>
  )
}

export default HistoryView

