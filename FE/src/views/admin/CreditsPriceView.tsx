'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import InputAdornment from '@mui/material/InputAdornment'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { ClientApi } from '@/services/client-api.service'

interface CreditPriceConfig {
  id: string
  creditAmount: number
  priceUSD: number
  bonus: number
}

const CreditsPriceView: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { isAdmin } = useAdminAuth()
  const [creditPrices, setCreditPrices] = useState<CreditPriceConfig[]>([
    {
      id: '1',
      creditAmount: 100,
      priceUSD: 9.99,
      bonus: 0
    },
    {
      id: '2',
      creditAmount: 500,
      priceUSD: 39.99,
      bonus: 50
    },
    {
      id: '3',
      creditAmount: 1000,
      priceUSD: 69.99,
      bonus: 150
    }
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePriceChange = (id: string, field: keyof CreditPriceConfig, value: string | number) => {
    setCreditPrices(
      creditPrices.map((price) =>
        price.id === id
          ? { ...price, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value }
          : price
      )
    )
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await ClientApi.post('/Admin/credits-price', creditPrices)
      const raw = response.getRaw()

      if (raw?.success) {
        setSuccessMessage(t('admin.creditsPrice.success.update') || 'Credit prices updated successfully!')
        showSuccessToast(t('admin.creditsPrice.success.update') || 'Credit prices updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(raw?.message || t('admin.creditsPrice.errors.saveFailed') || 'Failed to save credit prices')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('admin.creditsPrice.errors.saveFailed') || 'Failed to save changes'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setCreditPrices([
      {
        id: '1',
        creditAmount: 100,
        priceUSD: 9.99,
        bonus: 0
      },
      {
        id: '2',
        creditAmount: 500,
        priceUSD: 39.99,
        bonus: 50
      },
      {
        id: '3',
        creditAmount: 1000,
        priceUSD: 69.99,
        bonus: 150
      }
    ])
    setError(null)
    setSuccessMessage(null)
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          {t('admin.creditsPrice.errors.accessDenied') || 'Access denied. Admin privileges required.'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 4,
          px: { xs: 2, md: 4 },
          mb: 4
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="tabler-currency-dollar" style={{ fontSize: '32px' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('admin.creditsPrice.title') || 'Adjust Credits Price'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('admin.creditsPrice.subtitle') || 'Manage credit package pricing and bonuses'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, pb: 4 }}>
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {t('admin.creditsPrice.success.title') || 'Success'}
            </Typography>
            <Typography variant="body2">{successMessage}</Typography>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {t('admin.creditsPrice.errors.title') || 'Error'}
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Credit Prices Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {t('admin.creditsPrice.table.title') || 'Credit Packages'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.creditsPrice.table.subtitle') || 'Configure pricing for each credit package'}
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {t('admin.creditsPrice.table.creditAmount') || 'Credit Amount'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {t('admin.creditsPrice.table.price') || 'Price (USD)'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {t('admin.creditsPrice.table.bonus') || 'Bonus Credits'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {t('admin.creditsPrice.table.pricePerCredit') || 'Price per Credit'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creditPrices.map((price, index) => {
                    const pricePerCredit = (price.priceUSD / price.creditAmount).toFixed(4)

                    return (
                      <TableRow
                        key={price.id}
                        sx={{
                          bgcolor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                          '&:hover': {
                            bgcolor: 'action.selected'
                          }
                        }}
                      >
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={price.creditAmount}
                            onChange={(e) =>
                              handlePriceChange(price.id, 'creditAmount', parseInt(e.target.value) || 0)
                            }
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={price.priceUSD}
                            onChange={(e) =>
                              handlePriceChange(price.id, 'priceUSD', parseFloat(e.target.value) || 0)
                            }
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={price.bonus}
                            onChange={(e) =>
                              handlePriceChange(price.id, 'bonus', parseInt(e.target.value) || 0)
                            }
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            ${pricePerCredit}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 4 }}>
          <Button variant="outlined" onClick={handleReset} disabled={isSaving} startIcon={<i className="tabler-refresh" />}>
            {t('admin.creditsPrice.actions.reset') || 'Reset'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={18} /> : <i className="tabler-device-floppy" />}
          >
            {isSaving
              ? t('admin.creditsPrice.actions.saving') || 'Saving...'
              : t('admin.creditsPrice.actions.save') || 'Save Changes'}
          </Button>
        </Box>

        {/* Info Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              {t('admin.creditsPrice.guide.title') || 'Configuration Guide'}
            </Typography>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {t('admin.creditsPrice.guide.creditAmount') || 'Credit Amount'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.creditsPrice.guide.creditAmountDesc') || 'Number of credits included in the package'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {t('admin.creditsPrice.guide.price') || 'Price (USD)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.creditsPrice.guide.priceDesc') || 'Price in US dollars for the package'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {t('admin.creditsPrice.guide.bonus') || 'Bonus Credits'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.creditsPrice.guide.bonusDesc') || 'Additional free credits given with this package'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {t('admin.creditsPrice.guide.pricePerCredit') || 'Price per Credit'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.creditsPrice.guide.pricePerCreditDesc') ||
                    'Calculated value showing the cost per credit (automatically computed)'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default CreditsPriceView

