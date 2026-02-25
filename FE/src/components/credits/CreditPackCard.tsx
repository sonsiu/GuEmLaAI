'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import type { CreditPack } from '@/types/credit.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface CreditPackCardProps {
  pack: CreditPack
  onPurchase: (pack: CreditPack) => void
  loading: boolean
  isPurchasing: boolean
}

export const CreditPackCard: React.FC<CreditPackCardProps> = ({
  pack,
  onPurchase,
  loading,
  isPurchasing
}) => {
  const { t } = useTranslation()

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: pack.popular ? 'primary.main' : 'divider',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        transform: pack.popular ? { xs: 'scale(1)', md: 'scale(1.05)' } : 'scale(1)',
        boxShadow: pack.popular ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: pack.popular ? { xs: 'scale(1)', md: 'scale(1.05)' } : { xs: 'scale(1)', md: 'scale(1.02)' }
        }
      }}
    >
      {/* Badge */}
      {pack.badge && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1
          }}
        >
          <Chip
            label={pack.badge}
            size='small'
            sx={{
              background: pack.badge === 'Best Value' 
                ? 'linear-gradient(135deg, var(--mui-palette-error-main) 0%, var(--mui-palette-error-dark) 100%)'
                : 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-dark) 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
        </Box>
      )}

      <CardContent sx={{ px: { xs: 2.5, sm: 3, md: 3.5 }, py: { xs: 4, sm: 6, md: 10 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Pack Header */}
        <Box sx={{ textAlign: 'center', mb: 3, mt: pack.badge ? 1 : 0 }}>
          <Typography variant='h6' fontWeight={700} gutterBottom sx={{ fontSize: '1.25rem' }}>
            {pack.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: 2 }}>
            <Typography variant='h3' fontWeight={700} color='primary.main' sx={{ fontSize: '2rem' }}>
              {pack.credits}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.875rem' }}>
              {t('credits.pack.credits')}
            </Typography>
          </Box>
          <Box>
            <Typography variant='h5' fontWeight={700} color='primary.main' sx={{ fontSize: '1.5rem' }}>
              {formatVND(pack.price)}
            </Typography>
            {pack.priceUSD && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                ≈ ${pack.priceUSD} USD
              </Typography>
            )}
          </Box>
        </Box>

        {/* Features */}
        <Box 
          component='ul' 
          sx={{ 
            listStyle: 'none', 
            p: 0, 
            m: 0, 
            mb: 3, 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1.25 
          }}
        >
          {pack.features.map((feature, index) => (
            <Box key={index} component='li' sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <i
                className='tabler-check-circle'
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--mui-palette-primary-main)',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              ></i>
              <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Purchase Button */}
        <Button
          onClick={() => onPurchase(pack)}
          disabled={loading && isPurchasing}
          fullWidth
          variant={pack.popular ? 'contained' : 'outlined'}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            mt: 'auto',
            ...(pack.popular
              ? {
                  background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                  color: 'white',
                  border: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }
                }
              : {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.lighterOpacity',
                    transform: 'translateY(-2px)'
                  }
                }),
            '&.Mui-disabled': {
              opacity: 0.5
            }
          }}
        >
          {loading && isPurchasing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              {t('credits.pack.processing')}
            </Box>
          ) : (
            t('credits.pack.purchase')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

