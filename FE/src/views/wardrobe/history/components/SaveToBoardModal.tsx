'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import type { Board } from '@/types/wardrobe.type'

interface SaveToBoardModalProps {
  open: boolean
  onClose: () => void
  boards: Board[]
  loading: boolean
  saving: boolean
  error: string | null
  onSave: (boardId: number) => void
  onNavigateToCreate: () => void
}

const SaveToBoardModal: React.FC<SaveToBoardModalProps> = ({
  open,
  onClose,
  boards,
  loading,
  saving,
  error,
  onSave,
  onNavigateToCreate
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Save to Board</Typography>
        <IconButton onClick={onClose} disabled={saving} size="small">
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* No Boards */}
        {!loading && boards.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No boards found. Create your first board to save images.
            </Typography>
            <Button variant="contained" onClick={onNavigateToCreate}>
              Create Your First Board
            </Button>
          </Box>
        )}

        {/* Boards List */}
        {!loading && boards.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a board to save this image:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {boards.map((board) => (
                <Button
                  key={board.id}
                  onClick={() => onSave(board.id)}
                  disabled={saving}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main'
                    }
                  }}
                  startIcon={
                    board.coverImageUrl ? (
                      <Box
                        component="img"
                        src={board.coverImageUrl}
                        alt={board.title}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="tabler-photo" style={{ fontSize: 24, color: '#999' }} />
                      </Box>
                    )
                  }
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={500}>
                      {board.title}
                    </Typography>
                    {board.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {board.description}
                      </Typography>
                    )}
                  </Box>
                  <i className="tabler-device-floppy" style={{ fontSize: 20, color: '#999' }} />
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SaveToBoardModal

