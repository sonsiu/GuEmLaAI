'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { referralService } from '@/services/referral.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type { ReferralInfo } from '@/types/referral.type'
import QRCodeModal from './components/QRCodeModal'
import introJs from 'intro.js'
import 'intro.js/introjs.css'

// Verification thresholds
const REQUIRED_ITEMS = 3
const REQUIRED_OUTFITS = 1
const REQUIRED_VIRTUAL_TRYON = 1

type TabValue = 'overview' | 'history'

const ReferralView: React.FC = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const [showQRModal, setShowQRModal] = useState(false)
  const [referralLink, setReferralLink] = useState('')
  const [referralData, setReferralData] = useState<ReferralInfo | null>(null)
  const [isLoadingReferral, setIsLoadingReferral] = useState(true)
  const [referralError, setReferralError] = useState<string | null>(null)

  // Submit referral code modal state
  const [showSubmitCodeModal, setShowSubmitCodeModal] = useState(false)
  const [submitCodeValue, setSubmitCodeValue] = useState('')
  const [isSubmittingCode, setIsSubmittingCode] = useState(false)
  const [submitCodeError, setSubmitCodeError] = useState<string | null>(null)

  // User stats
  const userStats = referralData
    ? {
        itemsCreated: referralData.itemsCreatedCount || 0,
        outfitsCreated: referralData.outfitsCreatedCount || 0,
        virtualTryOnUsed: referralData.vtoUsedCount || 0
      }
    : null

  // Check if user meets verification requirements
  const isVerified =
    userStats &&
    userStats.itemsCreated >= REQUIRED_ITEMS &&
    userStats.outfitsCreated >= REQUIRED_OUTFITS &&
    userStats.virtualTryOnUsed >= REQUIRED_VIRTUAL_TRYON

  const referees = referralData?.referees || []

  // Helper function to parse DD/MM/YYYY format
  const parseDateString = (dateString: string): Date => {
    if (!dateString) return new Date()

    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      return new Date(isoDateString)
    }

    return new Date(dateString)
  }

  // Fetch referral info from API on mount
  useEffect(() => {
    if (!user) return

    const fetchReferralInfo = async () => {
      try {
        setIsLoadingReferral(true)
        setReferralError(null)

        const data = await referralService.getReferralInfo()
        if (!data) {
          throw new Error('Failed to load referral info')
        }

        setReferralData(data)
      } catch (error) {
        // console.error('Error fetching referral info:', error)
        const errorMsg =
          error instanceof Error ? error.message : 'Failed to load referral info'
        setReferralError(errorMsg)
        showErrorToast(errorMsg)
      } finally {
        setIsLoadingReferral(false)
      }
    }

    fetchReferralInfo()
  }, [user])

  // Set referral link
  useEffect(() => {
    const referralCode = referralData?.referralCode || 'N/A'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    setReferralLink(`${origin}/signup?referralCode=${referralCode}`)
  }, [referralData])

  const referralStats = {
    totalReferrals: referees.length,
    completedReferrals: referees.filter((r) => r.refereeStatus === 'Completed').length,
    pendingReferrals: referees.filter((r) => r.refereeStatus === 'Pending').length,
    usageLimitEarned: referees.filter((r) => r.refereeStatus === 'Completed').length,
    referralBonus: 1
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    showSuccessToast(t('referral.linkCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: t('referral.shareTitle'),
        text: t('referral.shareText'),
        url: referralLink
      })
    } else {
      handleCopyLink()
    }
  }

  const handleOpenSubmitCodeModal = () => {
    setSubmitCodeValue('')
    setSubmitCodeError(null)
    setShowSubmitCodeModal(true)
  }

  const handleCloseSubmitCodeModal = () => {
    setShowSubmitCodeModal(false)
    setSubmitCodeValue('')
    setSubmitCodeError(null)
  }

  const handleSubmitReferralCode = async () => {
    if (!submitCodeValue.trim()) {
      setSubmitCodeError(t('referral.manualCode.required'))
      return
    }

    setIsSubmittingCode(true)
    setSubmitCodeError(null)

    try {
      await referralService.applyReferralCode({ referralCode: submitCodeValue.trim() })
      showSuccessToast(t('referral.manualCode.success'))
      handleCloseSubmitCodeModal()
      
      // Refresh referral data
      const data = await referralService.getReferralInfo()
      if (data) {
        setReferralData(data)
      }
    } catch (error) {
      // console.error('Error applying referral code:', error)
      const errorMsg = error instanceof Error ? error.message : t('referral.manualCode.error')
      setSubmitCodeError(errorMsg)
    } finally {
      setIsSubmittingCode(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 4, md: 6 }
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 4, sm: 6 } }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold' }}
          >
            {t('referral.title')}
          </Typography>
          <Button
            id="intro-submit-code-button"
            variant="outlined"
            color="primary"
            onClick={handleOpenSubmitCodeModal}
            startIcon={<i className="tabler-ticket" />}
          >
            {t('referral.manualCode.submit') || 'Submit Code'}
          </Button>
        </Box>

        {/* Error Message */}
        {referralError && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <strong>{t('referral.error')}:</strong> {referralError}
          </Alert>
        )}

        {/* Referred By Card - Show if user was referred by someone */}
        {referralData?.referrer && (
          <Card
            sx={{
              mb: { xs: 4, sm: 6 },
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'primary.contrastText',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                filter: 'blur(40px)'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                filter: 'blur(30px)'
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, py: { xs: 3, sm: 4 }, px: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'center' }, gap: 3 }}>
                {/* Icon Section */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '50%',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0
                  }}
                >
                  <i className="tabler-user-check" style={{ fontSize: 32, color: 'white' }} />
                </Box>

                {/* Content Section */}
                <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.95, 
                        color: 'inherit',
                        fontWeight: 500,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem'
                      }}
                    >
                      {t('referral.referredBy.label') || 'Referred by'}
                    </Typography>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.6)'
                      }}
                    />
                  </Box>
                  
                  {/* Username - Highlighted */}
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      mb: 0.5,
                      wordBreak: 'break-word'
                    }}
                  >
                    {referralData.referrer}
                  </Typography>

                  {/* Thank you message */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      color: 'inherit',
                      fontStyle: 'italic',
                      fontSize: '0.875rem'
                    }}
                  >
                    {t('referral.referredBy.thankYou') || 'Thank you for joining through their referral! 🎉'}
                  </Typography>
                </Box>

                {/* Badge */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    flexShrink: 0
                  }}
                >
                  <i className="tabler-gift" style={{ fontSize: 20, color: 'white' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'white' }}>
                    {t('referral.referredBy.bonusActivated') || 'Bonus Activated'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Referral Link Card */}
        {!isVerified ? (
          <Card
            id="intro-verification-requirements"
            sx={{
              mb: { xs: 4, sm: 6 },
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '50%',
                    mb: 3
                  }}
                >
                  <i className="tabler-bolt" style={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'white' }}>
                  {t('referral.notVerified.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.95 }}>
                  {t('referral.notVerified.subtitle')}
                </Typography>
              </Box>

              {/* Requirements List */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Items Requirement */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          bgcolor:
                            (userStats?.itemsCreated || 0) >= REQUIRED_ITEMS
                              ? 'success.main'
                              : 'rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        {(userStats?.itemsCreated || 0) >= REQUIRED_ITEMS ? (
                          <i className="tabler-check" style={{ fontSize: 16, color: 'white' }} />
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {userStats?.itemsCreated || 0}/{REQUIRED_ITEMS}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white' }}>
                          {t('referral.requirements.items.title')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                          {t('referral.requirements.items.subtitle', {
                            count: REQUIRED_ITEMS
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Outfit Requirement */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          bgcolor:
                            (userStats?.outfitsCreated || 0) >= REQUIRED_OUTFITS
                              ? 'success.main'
                              : 'rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        {(userStats?.outfitsCreated || 0) >= REQUIRED_OUTFITS ? (
                          <i className="tabler-check" style={{ fontSize: 16, color: 'white' }} />
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {userStats?.outfitsCreated || 0}/{REQUIRED_OUTFITS}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white' }}>
                          {t('referral.requirements.outfits.title')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                          {t('referral.requirements.outfits.subtitle', {
                            count: REQUIRED_OUTFITS
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Virtual Try-On Requirement */}
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          bgcolor:
                            (userStats?.virtualTryOnUsed || 0) >= REQUIRED_VIRTUAL_TRYON
                              ? 'success.main'
                              : 'rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        {(userStats?.virtualTryOnUsed || 0) >= REQUIRED_VIRTUAL_TRYON ? (
                          <i className="tabler-check" style={{ fontSize: 16, color: 'white' }} />
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {userStats?.virtualTryOnUsed || 0}/{REQUIRED_VIRTUAL_TRYON}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'white' }}>
                          {t('referral.requirements.vto.title')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                          {t('referral.requirements.vto.subtitle', {
                            count: REQUIRED_VIRTUAL_TRYON
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          // Verified UI - Show referral link
          <Card
            id="intro-referral-link"
            sx={{
              mb: { xs: 4, sm: 6 },
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
              <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="caption"
                  sx={{ mb: 1, display: 'block', color: 'white', opacity: 0.95, fontWeight: 'medium' }}
                >
                  {t('referral.linkLabel')}
                </Typography>
                {isLoadingReferral ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      p: 3,
                      minHeight: 48
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.95 }}>
                      {t('referral.loading')}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      p: { xs: 2, sm: 3 }
                    }}
                  >
                    <Typography
                      component="code"
                      sx={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'white'
                      }}
                    >
                      {referralLink}
                    </Typography>
                    <Button
                      onClick={handleCopyLink}
                      variant="contained"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        color: 'inherit',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.4)' },
                        whiteSpace: 'nowrap'
                      }}
                      startIcon={
                        copied ? (
                          <i className="tabler-check" style={{ color: 'white' }} />
                        ) : (
                          <i className="tabler-copy" style={{ color: 'white' }} />
                        )
                      }
                    >
                      {copied ? t('referral.copied') : t('referral.copy')}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button
                  id="intro-share-button"
                  onClick={handleShareLink}
                  disabled={isLoadingReferral}
                  variant="contained"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.4)' },
                    flex: 1
                  }}
                  startIcon={<i className="tabler-share" style={{ color: 'white' }} />}
                >
                  {t('referral.share')}
                </Button>
                <Button
                  id="intro-qr-button"
                  onClick={() => setShowQRModal(true)}
                  disabled={isLoadingReferral}
                  variant="contained"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.4)' },
                    flex: 1
                  }}
                  startIcon={<i className="tabler-bolt" style={{ color: 'white' }} />}
                >
                  {t('referral.viewQR')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* User Stats Card */}
        <Card id="intro-activity-stats" sx={{ mb: { xs: 4, sm: 6 } }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>
              {t('referral.activity.title')}
            </Typography>

            {isLoadingReferral ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : referralError ? (
              <Alert severity="warning">{referralError}</Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Items Card */}
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      border: 1,
                      borderColor: 'primary.main',
                      position: 'relative'
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                          {t('referral.activity.items')}
                        </Typography>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="tabler-users" style={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {userStats?.itemsCreated || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('referral.activity.itemsUnit')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {userStats && userStats.itemsCreated >= REQUIRED_ITEMS
                            ? t('referral.activity.requirementMet')
                            : t('referral.activity.moreNeeded', {
                                count: REQUIRED_ITEMS - (userStats?.itemsCreated || 0)
                              })}
                        </Typography>
                        {userStats && userStats.itemsCreated < REQUIRED_ITEMS && (
                          <Link href={`/${lang}/wardrobe/additem`} passHref style={{ textDecoration: 'none' }}>
                            <Button
                              size="medium"
                              variant="outlined"
                              color="primary"
                              startIcon={<i className="tabler-plus" style={{ fontSize: 16 }} />}
                              sx={{
                                minWidth: 'auto',
                                px: 5.5,
                                py: 3.5,
                                fontSize: '0.75rem'
                              }}
                            >
                              {t('common.goToAddItem') || 'Add'}
                            </Button>
                          </Link>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Outfits Card */}
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      border: 1,
                      borderColor: 'primary.main'
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                          {t('referral.activity.outfits')}
                        </Typography>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="tabler-gift" style={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 'bold', color: 'primary.main' }}
                        >
                          {userStats?.outfitsCreated || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('referral.activity.outfitsUnit')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {userStats && userStats.outfitsCreated >= REQUIRED_OUTFITS
                            ? t('referral.activity.requirementMet')
                            : t('referral.activity.moreNeeded', {
                                count: REQUIRED_OUTFITS - (userStats?.outfitsCreated || 0)
                              })}
                        </Typography>
                        {userStats && userStats.outfitsCreated < REQUIRED_OUTFITS && (
                          <Link href={`/${lang}/try-on`} passHref style={{ textDecoration: 'none' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<i className="tabler-plus" style={{ fontSize: 16 }} />}
                              sx={{
                                minWidth: 'auto',
                                 px: 5.5,
                                py: 3.5,
                                fontSize: '0.75rem'
                              }}
                            >
                              {t('common.goToOutfit') || 'Add'}
                            </Button>
                          </Link>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Virtual Try-On Card */}
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      border: 1,
                      borderColor: 'primary.main'
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                          {t('referral.activity.vto')}
                        </Typography>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="tabler-bolt" style={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {userStats?.virtualTryOnUsed || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('referral.activity.vtoUnit')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {userStats && userStats.virtualTryOnUsed >= REQUIRED_VIRTUAL_TRYON
                            ? t('referral.activity.requirementMet')
                            : t('referral.activity.moreNeeded', {
                                count: REQUIRED_VIRTUAL_TRYON - (userStats?.virtualTryOnUsed || 0)
                              })}
                        </Typography>
                        {userStats && userStats.virtualTryOnUsed < REQUIRED_VIRTUAL_TRYON && (
                          <Link href={`/${lang}/try-on`} passHref style={{ textDecoration: 'none' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<i className="tabler-plus" style={{ fontSize: 16 }} />}
                              sx={{
                                minWidth: 'auto',
                                 px: 5.5,
                                py: 3.5,
                                fontSize: '0.75rem'
                              }}
                            >
                              {t('common.goToTryOn') || 'Add'}
                            </Button>
                          </Link>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Grid id="intro-stats-cards" container spacing={2} sx={{ mb: { xs: 4, sm: 6 } }}>
          {/* Total Referrals */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ border: 1, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {t('referral.stats.total')}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.50',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="tabler-users" style={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {referralStats.totalReferrals}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('referral.stats.allTime')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Completed Referrals */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ border: 1, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {t('referral.stats.completed')}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="tabler-check" style={{ color: 'success.main', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {referralStats.completedReferrals}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('referral.stats.active')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Referrals */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ border: 1, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {t('referral.stats.pending')}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'warning.50',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="tabler-trending-up" style={{ color: 'warning.main', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {referralStats.pendingReferrals}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('referral.stats.awaiting')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Usage Limit Earned */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ border: 1, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {t('referral.stats.usageLimit')}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.50',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="tabler-arrow-up" style={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  +{referralStats.usageLimitEarned}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('referral.stats.totalEarned')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Per Referral Bonus */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ border: 1, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {t('referral.stats.perReferral')}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'error.50',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="tabler-gift" style={{ color: 'error.main', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  +{referralStats.referralBonus}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('referral.stats.perPersonLimit')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Referral History / Rewards Section */}
        <Card id="intro-referral-history">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ px: { xs: 2, sm: 3 } }}
            >
              <Tab label={t('referral.tabs.history')} value="overview" />
              <Tab label={t('referral.tabs.rewards')} value="history" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {activeTab === 'overview' && (
              <Box sx={{ overflowX: 'auto' }}>
                {referees && referees.length > 0 ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                            {t('referral.table.name')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                            {t('referral.table.date')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                            {t('referral.table.status')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'semibold' }}>
                            {t('referral.table.reward')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {referees.map((referee) => (
                        <TableRow key={referee.refereeId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {referee.refereeName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="body2" color="text.secondary">
                              {parseDateString(referee.createDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={referee.refereeStatus}
                              size="small"
                              color={
                                referee.refereeStatus === 'Completed' ? 'success' : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'semibold' }}>
                              {referee.refereeStatus === 'Completed' ? '+1' : '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <i
                      className="tabler-users"
                      style={{ fontSize: 48, color: theme.palette.text.disabled, marginBottom: 16 }}
                    />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {t('referral.empty.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('referral.empty.subtitle')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 'history' && (
              <Box>
                <Card
                  sx={{
                    mb: 3,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                  }}
                >
                  <CardContent>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', opacity: 0.8 }}>
                      {t('referral.rewards.total')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      +{referees.filter((r) => r.refereeStatus === 'Completed').length}{' '}
                      {t('referral.rewards.usageLimitCap')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {t('referral.rewards.from', {
                        count: referees.filter((r) => r.refereeStatus === 'Completed').length
                      })}
                    </Typography>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {referees
                    .filter((r) => r.refereeStatus === 'Completed')
                    .map((referee) => (
                      <Card key={referee.refereeId}>
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <i className="tabler-bolt" style={{ color: 'white', fontSize: 20 }} />
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }} noWrap>
                                  {referee.refereeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {parseDateString(referee.createDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              +1
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Box>

                {referees.filter((r) => r.refereeStatus === 'Completed').length === 0 && (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <i
                      className="tabler-gift"
                      style={{ fontSize: 48, color: theme.palette.text.disabled, marginBottom: 16 }}
                    />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {t('referral.rewards.empty.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('referral.rewards.empty.subtitle')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card sx={{ mt: { xs: 4, sm: 6 } }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>
              {t('referral.faq.title')}
            </Typography>
            <Box>
              {[
                {
                  question: t('referral.faq.q1.question'),
                  answer: t('referral.faq.q1.answer')
                },
                {
                  question: t('referral.faq.q2.question'),
                  answer: t('referral.faq.q2.answer')
                },
                {
                  question: t('referral.faq.q3.question'),
                  answer: t('referral.faq.q3.answer')
                }
              ].map((item, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'semibold' }}>
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        referralLink={referralLink}
        referralCode={referralData?.referralCode || ''}
      />

      {/* Submit Referral Code Modal */}
      <Dialog
        open={showSubmitCodeModal}
        onClose={handleCloseSubmitCodeModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-ticket" style={{ fontSize: 24, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="span">
              {t('referral.manualCode.title') || 'Enter Referral Code'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('referral.manualCode.description') || 'Enter a referral code from a friend to get bonus credits.'}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label={t('referral.manualCode.label') || 'Referral Code'}
            placeholder={t('referral.manualCode.placeholder') || 'Enter code here...'}
            value={submitCodeValue}
            onChange={(e) => {
              setSubmitCodeValue(e.target.value)
              setSubmitCodeError(null)
            }}
            error={Boolean(submitCodeError)}
            helperText={submitCodeError}
            disabled={isSubmittingCode}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmittingCode) {
                handleSubmitReferralCode()
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseSubmitCodeModal}
            disabled={isSubmittingCode}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReferralCode}
            disabled={isSubmittingCode || !submitCodeValue.trim()}
            startIcon={isSubmittingCode ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmittingCode ? t('common.loading') : (t('referral.manualCode.submit') || 'Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Button - Floating (Desktop Only) */}
      <Button
        onClick={() => {
          const intro = introJs()

          const steps: Array<{ element: string; intro: string; position: 'left' | 'right' | 'top' | 'bottom' }> = [
            {
              element: '#intro-submit-code-button',
              intro: t('referral.intro.step1') || 'Have a referral code from a friend? Click here to submit it and earn bonus credits!',
              position: 'bottom'
            },
            {
              element: isVerified ? '#intro-referral-link' : '#intro-verification-requirements',
              intro: isVerified 
                ? (t('referral.intro.step2Verified') || 'This is your unique referral link. Share it with friends to earn rewards!')
                : (t('referral.intro.step2Unverified') || 'Complete these requirements to unlock your referral link and start earning rewards!'),
              position: 'top'
            },
            {
              element: '#intro-activity-stats',
              intro: t('referral.intro.step3') || 'Track your progress on platform activities. Completing these helps verify your account.',
              position: 'top'
            },
            {
              element: '#intro-stats-cards',
              intro: t('referral.intro.step4') || 'View your referral statistics and see how many rewards you\'ve earned.',
              position: 'top'
            },
            {
              element: '#intro-referral-history',
              intro: t('referral.intro.step5') || 'Check who signed up using your referral link and track their verification status.',
              position: 'top'
            }
          ]

          // Add share and QR buttons steps only if user is verified
          if (isVerified) {
            steps.splice(2, 0, {
              element: '#intro-share-button',
              intro: t('referral.intro.stepShare') || 'Share your referral link via social media or messaging apps.',
              position: 'left'
            })
            steps.splice(3, 0, {
              element: '#intro-qr-button',
              intro: t('referral.intro.stepQR') || 'Generate a QR code for your referral link for easy sharing.',
              position: 'left'
            })
          }

          intro.setOptions({
            steps,
            showProgress: true,
            showBullets: true,
            exitOnOverlayClick: false,
            exitOnEsc: true,
            scrollToElement: true,
            scrollPadding: 30,
            nextLabel: t('common.next') || 'Next',
            prevLabel: t('common.prev') || 'Previous',
            skipLabel: t('common.skip') || 'Skip',
            doneLabel: t('common.done') || 'Done'
          })

          intro.start()
        }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          minWidth: 48,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          boxShadow: 4,
          zIndex: 1000,
          '&:hover': {
            bgcolor: 'primary.dark',
            boxShadow: 6,
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease'
        }}
        aria-label={t('common.help') || 'Help'}
      >
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          ?
        </Typography>
      </Button>
    </Box>
  )
}

export default ReferralView

