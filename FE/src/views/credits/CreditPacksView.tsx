'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { CREDIT_PACKS } from '@/constants/credit-packs.const'
import {
  CreditBalanceCard,
  CreditPackCard,
  PaymentModal,
  RecentTransactions,
  AlertMessage
} from '@/components/credits'
import { useCreditPacks } from '@/@core/hooks/useCreditPacks'
import { useTranslation } from '@/@core/hooks/useTranslation'

const CreditPacksView: React.FC = () => {
  const { t } = useTranslation()

  const {
    balance,
    loading,
    refreshing,
    purchasingPackId,
    recentTransactions,
    error,
    successMessage,
    isPaymentOpen,
    paymentResult,
    fetchCreditBalance,
    handlePurchase,
    handleClosePayment
  } = useCreditPacks()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, md: 6 } }}>
      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <Box
            sx={{
              width: { xs: 70, md: 80 },
              height: { xs: 70, md: 80 },
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <i className='tabler-sparkles text-white' style={{ fontSize: '2.5rem' }}></i>
          </Box>
          <Typography 
            variant='h3' 
            fontWeight={700} 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              mb: 2
            }}
          >
            {t('credits.hero.title')}
          </Typography>
          <Typography 
            variant='h6' 
            color='text.secondary' 
            sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              lineHeight: 1.6
            }}
          >
            {t('credits.hero.subtitle')}
          </Typography>
        </Box>

        {/* Current Balance Card */}
        <CreditBalanceCard balance={balance} onRefresh={fetchCreditBalance} refreshing={refreshing} />

        {/* Success Message */}
        {successMessage && <AlertMessage type='success' message={successMessage} />}

        {/* Error Message */}
        {error && <AlertMessage type='error' message={error} />}

        {/* Credit Packs Grid */}
        <Box sx={{ mb: { xs: 5, md: 8 } }}>
          <Typography 
            variant='h5' 
            fontWeight={700} 
            gutterBottom 
            sx={{ 
              mb: 4,
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}
          >
            {t('credits.packs.title')}
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 3 }}>
            {CREDIT_PACKS.map((pack) => (
              <Grid item xs={12} sm={6} md={3} key={pack.id}>
                <CreditPackCard
                  pack={pack}
                  onPurchase={handlePurchase}
                  loading={loading}
                  isPurchasing={purchasingPackId === pack.id}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} />

        {/* Payment Modal */}
        <PaymentModal isOpen={isPaymentOpen} paymentResult={paymentResult} onClose={handleClosePayment} />
      </Box>
    </Box>
  )
}

export default CreditPacksView

