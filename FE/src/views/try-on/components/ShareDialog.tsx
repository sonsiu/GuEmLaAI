'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { X as CloseIcon, Facebook, Link2, Mail, Share2, Twitter } from 'lucide-react'
import { useMemo, useState } from 'react'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  imageId: string | null
}

const buildShareUrl = (imageId: string | null) => {
  if (!imageId) return ''

  const base =
    (process.env.NEXT_PUBLIC_FRONTEND_URL && process.env.NEXT_PUBLIC_FRONTEND_URL !== '')
      ? process.env.NEXT_PUBLIC_FRONTEND_URL.replace(/\/+$/, '')
      : typeof window !== 'undefined'
        ? window.location.origin
        : ''

  try {
    const url = new URL(imageId)
    const fileName = url.pathname.split('/').filter(Boolean).pop() ?? imageId
    return `${base}/share?img=${encodeURIComponent(fileName.split('?')[0])}`
  } catch {
    const fileName = imageId.split('/').pop() ?? imageId
    return `${base}/share?img=${encodeURIComponent(fileName)}`
  }
}

export const ShareDialog = ({ open, onClose, imageId }: ShareDialogProps) => {
  const shareUrl = useMemo(() => buildShareUrl(imageId), [imageId])
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // console.error('Copy failed', err)
    }
  }

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=600')
  }

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out my AI try-on!')}`,
      '_blank',
      'width=600,height=600'
    )
  }

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent('My AI try-on look')}&body=${encodeURIComponent(shareUrl)}`
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share2 size={18} /> Chia sẻ kết quả
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              value={shareUrl}
              fullWidth
              label='Liên kết chia sẻ'
              InputProps={{ readOnly: true }}
            />
            <Button
              variant='outlined'
              fullWidth
              sx={{ mt: 1 }}
              startIcon={<Link2 size={16} />}
              onClick={handleCopy}
              disabled={!shareUrl}
            >
              {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              startIcon={<Facebook size={16} />}
              onClick={handleFacebook}
              disabled={!shareUrl}
            >
              Facebook
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant='contained'
              color='info'
              fullWidth
              startIcon={<Twitter size={16} />}
              onClick={handleTwitter}
              disabled={!shareUrl}
            >
              Twitter
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant='contained'
              color='secondary'
              fullWidth
              startIcon={<Mail size={16} />}
              onClick={handleEmail}
              disabled={!shareUrl}
            >
              Email
            </Button>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ShareDialog

