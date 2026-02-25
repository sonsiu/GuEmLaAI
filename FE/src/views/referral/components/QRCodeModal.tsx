'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import QRCode from 'react-qr-code'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface QRCodeModalProps {
  open: boolean
  onClose: () => void
  referralLink: string
  referralCode: string
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onClose,
  referralLink,
  referralCode
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg') as unknown as SVGSVGElement

    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      const link = document.createElement('a')

      link.href = canvas.toDataURL('image/png')
      link.download = `referral-qr-code-${referralCode}.png`
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h3">
            {t('referral.qrModal.title')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <i className="tabler-x" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: 2,
              borderColor: 'divider',
              borderRadius: 2,
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto'
            }}
          >
            <QRCode
              id="qr-code-svg"
              value={referralLink}
              size={200}
              level="H"
              bgColor={theme.palette.mode === 'dark' ? '#1e1e1e' : '#FFFFFF'}
              fgColor={theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </Box>

          <Box
            sx={{
              width: '100%',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {t('referral.qrModal.linkLabel')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'text.primary'
              }}
            >
              {referralLink}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleDownloadQR}
          startIcon={<i className="tabler-download" />}
          sx={{
            flex: 1,
            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.error.main})`
          }}
        >
          {t('referral.qrModal.download')}
        </Button>
        <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>
          {t('common.close')}
        </Button>
      </DialogActions>
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
          {t('referral.qrModal.info')}
        </Typography>
      </Box>
    </Dialog>
  )
}

export default QRCodeModal

