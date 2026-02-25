'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Locale } from '@configs/i18n'
import CustomTextField from '@core/components/mui/TextField'
import themeConfig from '@configs/themeConfig'
import { getLocalizedUrl } from '@/utils/i18n'
import { useTranslation } from '@/@core/hooks/useTranslation'
import AuthIllustrationWrapper from '@/views/Auth/Login/AuthIllustrationWrapper'
import StarBackground from '@/views/Auth/Login/StarBackground'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { ClientApi } from '@/services/client-api.service'
import type { ILoginResponse } from '@/types/auth.type'
import { useAuth } from '@/@core/contexts/AuthContext'

const GoogleIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24'>
    <path
      fill='#4285F4'
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
    />
    <path
      fill='#34A853'
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
    />
    <path
      fill='#FBBC05'
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
    />
    <path
      fill='#EA4335'
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
    />
  </svg>
)

const LoginV1 = () => {
  const { t } = useTranslation()
  const { setUser } = useAuth()

  const loginSchema = z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')).min(6, t('auth.validation.passwordMin').replace('{min}', '6'))
  })

  type LoginFormValues = z.infer<typeof loginSchema>

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const { lang: locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('referralCode')
  const returnUrl = searchParams.get('returnUrl')
  const message = searchParams.get('message')
  const verified = searchParams.get('verified') === 'true'

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  useEffect(() => {
    if (verified) {
      setShowVerificationMessage(true)

      const timer = setTimeout(() => {
        setShowVerificationMessage(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [verified])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const response = await ClientApi.post<ILoginResponse>('/auth/Login', {
        email: data.email,
        password: data.password
      })

      const rawResponse = response.getRaw()

      if (rawResponse.success && rawResponse.data) {
        const responseData = rawResponse.data

        // Handle both wrapped response (with user object) and flat response structure
        const userData = responseData.user
          ? {
            id: responseData.user.id || responseData.id || Date.now().toString(),
            displayName: responseData.user.displayName || responseData.user.fullName || data.email,
            email: responseData.user.email || responseData.email || data.email,
            role: responseData.user.role || responseData.role || 3,
            accessToken: responseData.accessToken,
            referralCode: responseData.user.referralCode || responseData.referralCode,
            referralStatus: responseData.user.referralStatus || responseData.referralStatus,
            referredById: responseData.user.referredById || responseData.referredById,
            itemUploadCount: responseData.user.itemUploadCount || responseData.itemUploadCount,
            outfitUploadCount: responseData.user.outfitUploadCount || responseData.outfitUploadCount,
            virtualTryOnUsedCount: responseData.user.virtualTryOnUsedCount || responseData.virtualTryOnUsedCount,
            fullName: responseData.user.fullName || responseData.user.displayName,
            avatar: responseData.user.avatar || (responseData.user as any).profilePictureUrl,
            createdAt: responseData.user.createdAt,
            updatedAt: responseData.user.updatedAt,
            isActive: responseData.user.isActive
          }
          : {
            id: responseData.id || Date.now().toString(),
            displayName: responseData.displayName || data.email,
            email: responseData.email || data.email,
            role: responseData.role || 3,
            accessToken: responseData.accessToken,
            referralCode: responseData.referralCode,
            referralStatus: responseData.referralStatus,
            referredById: responseData.referredById,
            itemUploadCount: responseData.itemUploadCount,
            outfitUploadCount: responseData.outfitUploadCount,
            virtualTryOnUsedCount: responseData.virtualTryOnUsedCount,
            avatar: (responseData as any).avatar || (responseData as any).profilePictureUrl
          }

        localStorage.setItem('accessToken', responseData.accessToken)

        // Set user in AuthContext
        await setUser(userData as any)

        // Decode and log token expiration for debugging (optional)
        try {
          const tokenParts = responseData.accessToken.split('.')

          if (tokenParts.length === 3) {
            const payload = tokenParts[1]
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')

            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )

            const decoded = JSON.parse(jsonPayload)

            if (decoded.exp) {
              const expirationDate = new Date(decoded.exp * 1000)

              // Optional: log token expiration for debugging
              //console.log('✅ Token will expire at:', expirationDate.toLocaleString())
            }
          }
        } catch (error) {
          // Silently ignore token decode errors
        }

        showSuccessToast(t('auth.login.success'))

        // Role-based redirect
        const userRole = userData.role

        if (userRole === 1) {
          // Admin role
          router.push(returnUrl || '/admin')
        } else {
          // Regular user
          router.push(returnUrl || '/home')
        }
      } else {
        const errorMessage = rawResponse.message || t('auth.login.errorGeneric')

        showErrorToast(errorMessage)
      }
    } catch (error) {
      showErrorToast(t('auth.login.errorNetwork'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)

    try {
      // Build Google login URL with returnUrl and optional referralCode
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      // Default to /home if no returnUrl is specified
      const finalReturnUrl = returnUrl || `${currentOrigin}/${locale}/home`
      const encodedReturnUrl = encodeURIComponent(finalReturnUrl)

      let googleLoginUrl = `${baseUrl}/auth/login-google?returnUrl=${encodedReturnUrl}`

      if (referralCode) {
        googleLoginUrl += `&referralCode=${encodeURIComponent(referralCode)}`
      }

      // Redirect to Google OAuth
      window.location.href = googleLoginUrl
    } catch (error) {
      setIsGoogleLoading(false)
      showErrorToast(t('auth.login.errorGoogle'))
    }
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StarBackground />
      <AuthIllustrationWrapper>
        <Card className='flex flex-col' sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent className='p-8'>
            <div className='flex flex-col gap-1 mbe-6 justify-center items-center'>
              <Typography variant='h4'>{t('auth.login.title')}</Typography>
              <Typography>{t('auth.login.subtitle')}</Typography>
            </div>

            {/* Verification Message */}
            {showVerificationMessage && (
              <Alert severity='success' sx={{ mb: 3, borderRadius: 2 }}>
                {t('auth.login.verificationMessage')}
              </Alert>
            )}

            {/* Message from query params */}
            {message && !showVerificationMessage && (
              <Alert severity='info' sx={{ mb: 3, borderRadius: 2 }}>
                {message}
              </Alert>
            )}

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
              <CustomTextField
                autoFocus
                fullWidth
                label={t('auth.login.email')}
                placeholder={t('auth.login.emailPlaceholder')}
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <CustomTextField
                fullWidth
                label={t('auth.login.password')}
                placeholder={t('auth.login.passwordPlaceholder')}
                type={isPasswordShown ? 'text' : 'password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
              <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                <div></div>
                <Typography className='text-end' color='primary.main' component={Link} href={getLocalizedUrl('/forgot-password', locale as Locale)}>
                  {t('auth.login.forgotPassword')}
                </Typography>
              </div>
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={isLoading || isGoogleLoading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                  '&:disabled': {
                    background: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                    {t('auth.login.submitting')}
                  </>
                ) : (
                  t('auth.login.submit')
                )}
              </Button>

              {/* Divider */}
              <Divider sx={{ my: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ px: 2, bgcolor: 'background.default' }}>
                  {t('auth.login.divider')}
                </Typography>
              </Divider>

              {/* Google Login Button */}
              <Button
                fullWidth
                variant='outlined'
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                sx={{
                  py: 1.5,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                startIcon={isGoogleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
              >
                {isGoogleLoading ? t('auth.login.googleSigningIn') : t('auth.login.googleLogin')}
              </Button>

              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>{t('auth.login.noAccount')}</Typography>
                <Typography
                  component={Link}
                  href={getLocalizedUrl('/register', locale as Locale)}
                  color='primary.main'
                >
                  {t('auth.login.createAccount')}
                </Typography>
              </div>
            </form>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    </Box>
  )
}

export default LoginV1
