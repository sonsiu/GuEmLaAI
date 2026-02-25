'use client'

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import type { CreatePaymentResult } from '@/types/credit.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface PaymentModalProps {
  isOpen: boolean
  paymentResult: CreatePaymentResult | null
  onClose: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, paymentResult, onClose }) => {
  const { t } = useTranslation()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen || !paymentResult) return null

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      //console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, var(--mui-palette-primary-lighterOpacity) 0%, var(--mui-palette-error-lighterOpacity) 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className='tabler-rocket text-white' style={{ fontSize: '1.5rem' }}></i>
          </Box>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              {t('credits.payment.scanQR')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('credits.payment.order')} #{paymentResult.orderCode}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x text-[1.25rem]'></i>
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* QR Code Section */}
          <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ mb: 2, bgcolor: 'white', p: 2, borderRadius: 2 }}>
                <img
                  src={`https://img.vietqr.io/image/${paymentResult.bin}-${paymentResult.accountNumber}-compact2.jpg?amount=${paymentResult.amount}&addInfo=${encodeURIComponent(paymentResult.description)}&accountName=${encodeURIComponent(paymentResult.accountName)}`}
                  alt='Payment QR Code'
                  style={{ width: 256, height: 256, objectFit: 'contain' }}
                />
              </Box>
              <Typography variant='body2' color='text.secondary' textAlign='center' sx={{ mb: 1 }}>
                {t('credits.payment.scanInstruction')}
              </Typography>
              <Typography variant='caption' color='text.disabled' textAlign='center'>
                {t('credits.payment.autoAdd')}
              </Typography>
            </CardContent>
          </Card>

          {/* Payment Details Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='h6' fontWeight={600} gutterBottom>
              {t('credits.payment.details')}
            </Typography>

            {/* Amount */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                p: 3,
                borderRadius: 2,
                color: 'white',
                mb: 2
              }}
            >
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                {t('credits.payment.amount')}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {formatVND(paymentResult.amount)}
              </Typography>
            </Box>

            {/* Bank Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                    {t('credits.payment.bank')}
                  </Typography>
                  <Typography variant='body1' fontWeight={600}>
                    {paymentResult.accountName}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                        {t('credits.payment.accountNumber')}
                      </Typography>
                      <Typography variant='body1' fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {paymentResult.accountNumber}
                      </Typography>
                    </Box>
                    <IconButton
                      size='small'
                      onClick={() => copyToClipboard(paymentResult.accountNumber, 'account')}
                    >
                      <i
                        className={copiedField === 'account' ? 'tabler-check' : 'tabler-copy'}
                        style={{
                          fontSize: '1rem',
                          color: copiedField === 'account' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-text-secondary)'
                        }}
                      ></i>
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                        {t('credits.payment.transferContent')}
                      </Typography>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                        {paymentResult.description}
                      </Typography>
                    </Box>
                    <IconButton
                      size='small'
                      onClick={() => copyToClipboard(paymentResult.description, 'description')}
                      sx={{ ml: 1 }}
                    >
                      <i
                        className={copiedField === 'description' ? 'tabler-check' : 'tabler-copy'}
                        style={{
                          fontSize: '1rem',
                          color: copiedField === 'description' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-text-secondary)'
                        }}
                      ></i>
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Instructions */}
            <Card sx={{ bgcolor: 'info.lighterOpacity', border: '1px solid', borderColor: 'info.main', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant='subtitle2' fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='tabler-clock text-[1rem]'></i>
                  {t('credits.payment.instructions')}
                </Typography>
                <Box component='ol' sx={{ pl: 2, m: 0, mt: 1 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Typography key={num} variant='body2' component='li' sx={{ mb: 0.5 }}>
                      {t(`credits.payment.step${num}`)}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.lighterOpacity', border: '1px solid', borderColor: 'success.main', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    💡 {t('credits.payment.tip')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {t('credits.payment.expire')}
        </Typography>
        <Button onClick={onClose} variant='text' size='small'>
          {t('credits.payment.cancel')}
        </Button>
      </Box>
    </Dialog>
  )
}

