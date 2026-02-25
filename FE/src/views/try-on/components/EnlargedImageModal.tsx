'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import { X } from 'lucide-react'

interface EnlargedImageModalProps {
  open: boolean
  imageUrl: string | null
  onClose: () => void
}

export const EnlargedImageModal = ({ open, imageUrl, onClose }: EnlargedImageModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg'>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        Xem ảnh lớn
        <IconButton onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {imageUrl && (
          <Box component='img' src={imageUrl} alt='history' sx={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: 2 }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EnlargedImageModal

