'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import { RefreshCw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { HistoryBoardImage } from '../types'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  historyImages: HistoryBoardImage[]
  isLoading: boolean
  onRefresh: () => void
  onImageClick: (image: HistoryBoardImage) => void
}

export const HistoryModal = ({ open, onClose, historyImages, isLoading, onRefresh, onImageClick }: HistoryModalProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8
  const hasImages = historyImages.length > 0

  const sortedImages = useMemo(() => historyImages, [historyImages])

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(historyImages.length / PAGE_SIZE)
    const startIdx = (currentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const paginatedImages = historyImages.slice(startIdx, endIdx)

    return { paginatedImages, totalPages }
  }, [historyImages, currentPage])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Lịch sử try-on</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : <RefreshCw size={18} />}
          </IconButton>
          <IconButton onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && (
          <Box sx={{ py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && !hasImages && (
          <Typography variant='body2' color='text.secondary' align='center'>
            Chưa có lịch sử try-on. Hãy tạo outfit để xem lại sau nhé!
          </Typography>
        )}

        {!isLoading && hasImages && (
          <>
            <Grid container spacing={2}>
              {paginatedData.paginatedImages.map(image => (
                <Grid item xs={6} sm={4} md={3} key={image.id}>
                  <Box
                    component='button'
                    onClick={() => onImageClick(image)}
                    sx={{
                      width: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      p: 0,
                      '&:hover': {
                        boxShadow: 4,
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Box
                      component='img'
                      src={image.url}
                      alt={`history-${image.id}`}
                      sx={{ width: '100%', display: 'block' }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Pagination Controls */}
            {paginatedData.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={paginatedData.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color='primary'
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default HistoryModal

