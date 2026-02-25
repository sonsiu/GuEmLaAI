'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { CreditTransaction } from '@/types/credit.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface RecentTransactionsProps {
  transactions: CreditTransaction[]
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const { t } = useTranslation()

  if (transactions.length === 0) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant='h6' fontWeight={700}>
            {t('credits.transactions.title')}
          </Typography>
          <i className='tabler-clock text-[1.25rem]' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {transactions.map((transaction) => (
            <Box
              key={transaction.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: transaction.amount > 0 ? 'success.lighterOpacity' : 'error.lighterOpacity'
                  }}
                >
                  <i
                    className={transaction.amount > 0 ? 'tabler-trending-up' : 'tabler-bolt'}
                    style={{
                      fontSize: '1.25rem',
                      color: transaction.amount > 0 ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)'
                    }}
                  ></i>
                </Box>
                <Box>
                  <Typography variant='body1' fontWeight={500}>
                    {transaction.description}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {formatDate(transaction.createdAt)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant='h6'
                  fontWeight={600}
                  sx={{
                    color: transaction.amount > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {transaction.type}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

