'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface CreditBalanceCardProps {
  balance: number
  onRefresh: () => void
  refreshing: boolean
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({
  balance,
  onRefresh,
  refreshing
}) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        background: 'linear-gradient(to right, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
        borderRadius: 3,
        p: { xs: 3, sm: 4, md: 5 },
        mb: 6,
        color: 'white',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant='h6' sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, fontWeight: 600, fontSize: '1.25rem' }}>
            {t('credits.balance.title')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
            <Typography variant='h2' fontWeight={700} sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              {balance}
            </Typography>
            <Typography variant='h5' sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              {t('credits.balance.credits')}
            </Typography>
          </Box>
          <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
            {t('credits.balance.remaining').replace('{count}', balance.toString())}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          >
            <i className='tabler-bolt text-white' style={{ fontSize: '2rem' }}></i>
          </Box>
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant='contained'
            sx={{
              bgcolor: 'white',
              color: 'error.main',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1,
              minWidth: 120,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255,255,255,0.5)',
                color: 'rgba(0,0,0,0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {refreshing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'error.main' }} />
                {t('credits.balance.refreshing')}
              </Box>
            ) : (
              t('credits.balance.refresh')
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

