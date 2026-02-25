'use client'

import { useState } from 'react'
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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { z } from 'zod'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Locale } from '@configs/i18n'
import CustomTextField from '@core/components/mui/TextField'
import themeConfig from '@configs/themeConfig'
import { getLocalizedUrl } from '@/utils/i18n'
import { useTranslation } from '@/@core/hooks/useTranslation'
import AuthIllustrationWrapper from '../Login/AuthIllustrationWrapper'
import StarBackground from '../Login/StarBackground'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { ClientApi } from '@/services/client-api.service'

interface PasswordRuleProps {
  valid: boolean
  text: string
}

const PasswordRule: React.FC<PasswordRuleProps> = ({ valid, text }) => (
  <Box
    component='li'
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      color: valid ? 'success.main' : 'error.main',
      fontSize: '0.875rem'
    }}
  >
    <i className={valid ? 'tabler-check' : 'tabler-x'} style={{ fontSize: '1rem' }}></i>
    <span>{text}</span>
  </Box>
)

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

const RegisterV1 = () => {
  const { t } = useTranslation()

  const registerSchema = z
    .object({
      email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
      username: z.string().min(1, t('auth.validation.usernameRequired')).min(6, t('auth.validation.usernameMin').replace('{min}', '6')),
      password: z.string().min(1, t('auth.validation.passwordRequired')).min(8, t('auth.validation.passwordMin').replace('{min}', '8')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired'))
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordMismatch'),
      path: ['confirmPassword']
    })

  type RegisterFormValues = z.infer<typeof registerSchema>

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const { lang: locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('referralCode')
  const returnUrl = searchParams.get('returnUrl')

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    }
  })

  const email = watch('email') || ''
  const username = watch('username') || ''
  const password = watch('password') || ''
  const confirmPassword = watch('confirmPassword') || ''

  const meetsPasswordRules =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  const isFormReady =
    username.trim().length >= 6 &&
    email.trim().length > 0 &&
    meetsPasswordRules &&
    confirmPassword.length > 0 &&
    password === confirmPassword

  const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null)

    if (!meetsPasswordRules) {
      setError('password', { message: t('auth.register.passwordRequirementInline').replace('{min}', '8') })
      setFocus('password')
      setFormError(t('auth.register.passwordRequirementInline').replace('{min}', '8'))
      return
    }

    if (!isPasswordMatch) {
      setError('confirmPassword', { message: t('auth.validation.passwordMismatch') })
      setFocus('confirmPassword')
      setFormError(t('auth.validation.passwordMismatch'))
      return
    }

    setIsLoading(true)

    try {
      const requestBody: {
        username: string
        password: string
        confirmPassword: string
        email: string
        referralCode?: string
      } = {
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        email: data.email
      }

      if (referralCode) {
        requestBody.referralCode = referralCode
      }

      ; (await ClientApi.post('/auth/register', requestBody)).onSuccess(() => {
        showSuccessToast(t('auth.register.success'))
        setRegisteredEmail(data.email)
      }).onError(error => {
        const errorMessage = error?.message || t('auth.register.errorGeneric')

        if (errorMessage.toLowerCase().includes('email')) {
          const inlineMessage = t('auth.register.errorEmailExistsAction')
          setError('email', { message: inlineMessage })
          setFormError(inlineMessage)
        } else {
          setFormError(errorMessage)
        }
      })
    } catch (error) {
      const fallbackError = t('auth.register.errorNetwork')
      setFormError(fallbackError)
      showErrorToast(fallbackError)
    } finally {
      setIsLoading(false)
    }
  }

  const onInvalid = (invalidErrors: FieldErrors<RegisterFormValues>) => {
    const firstField = Object.keys(invalidErrors)[0] as keyof RegisterFormValues | undefined

    if (firstField) {
      setFocus(firstField)
      const message = invalidErrors[firstField]?.message
      setFormError(typeof message === 'string' ? message : t('auth.register.errorGeneric'))
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const finalReturnUrl = returnUrl || `${currentOrigin}/${locale}/home`
      const encodedReturnUrl = encodeURIComponent(finalReturnUrl)

      let googleSignUpUrl = `${baseUrl}/auth/login-google?returnUrl=${encodedReturnUrl}`

      if (referralCode) {
        googleSignUpUrl += `&referralCode=${encodeURIComponent(referralCode)}`
      }

      window.location.href = googleSignUpUrl
    } catch (error) {
      setIsGoogleLoading(false)
      showErrorToast(t('auth.register.errorGoogle'))
    }
  }

  if (registeredEmail) {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StarBackground />
        <AuthIllustrationWrapper>
          <Card className='flex flex-col' sx={{ maxWidth: 400, width: '100%' }}>
            <CardContent className='p-8'>
              <div className='flex flex-col gap-2 mbe-6 justify-center items-center text-center'>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1
                  }}
                >
                  <i className='tabler-mail' style={{ fontSize: '1.5rem' }}></i>
                </Box>
                <Typography variant='h4'>{t('auth.register.nextStepTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('auth.register.nextStepDescription').replace('{email}', registeredEmail)}
                </Typography>
              </div>

              <Box
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  p: 2,
                  mb: 4
                }}
              >
                <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                  {t('auth.register.nextStepCheckEmail')}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.7rem' }}>
                  {t('auth.register.nextStepSpam')}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant='contained'
                onClick={() => router.push(getLocalizedUrl('/login', locale as Locale))}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)'
                }}
              >
                {t('auth.register.nextStepLogin')}
              </Button>
            </CardContent>
          </Card>
        </AuthIllustrationWrapper>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StarBackground />
      <AuthIllustrationWrapper>
        <Card className='flex flex-col' sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent className='p-8'>
            <div className='flex flex-col gap-1 mbe-6 justify-center items-center'>
              <Typography variant='h4'>{t('auth.register.title').replace('{appName}', themeConfig.templateName)}</Typography>
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                {t('auth.register.subtitle')}
              </Typography>
            </div>

            <div className='flex justify-center items-center gap-2 mb-6'>
              <Typography variant='body2' color='text.secondary'>
                {t('auth.register.hasAccount')}
              </Typography>
              <Typography
                component={Link}
                href={getLocalizedUrl('/login', locale as Locale)}
                color='primary.main'
                sx={{ fontWeight: 600 }}
              >
                {t('auth.register.signIn')}
              </Typography>
            </div>

            {formError && (
              <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit, onInvalid)} className='flex flex-col gap-6'>
              {/* Email Input */}
              <CustomTextField
                autoFocus
                fullWidth
                label={t('auth.register.email')}
                placeholder={t('auth.register.emailPlaceholder')}
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-mail' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                      </InputAdornment>
                    )
                  }
                }}
              />

              {/* Username Input */}
              <CustomTextField
                fullWidth
                label={t('auth.register.username')}
                placeholder={t('auth.register.usernamePlaceholder')}
                error={!!errors.username}
                helperText={
                  errors.username?.message ||
                  (username && username.trim().length < 6
                    ? t('auth.validation.usernameMin').replace('{min}', '6')
                    : undefined)
                }
                {...register('username')}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-user' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                      </InputAdornment>
                    )
                  }
                }}
              />

              {/* Password Input */}
              <Box>
                <CustomTextField
                  fullWidth
                  label={t('auth.register.password')}
                placeholder={t('auth.register.passwordPlaceholder')}
                type={isPasswordShown ? 'text' : 'password'}
                error={!!errors.password}
                helperText={undefined}
                {...register('password')}
                slotProps={{
                  input: {
                    startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-lock' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                        </InputAdornment>
                      ),
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

                {/* Password Requirements */}
                {password && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>
                      {t('auth.register.passwordRequirements')}
                    </Typography>
                    <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <PasswordRule valid={password.length >= 8} text={t('auth.register.passwordRequirementMin').replace('{min}', '8')} />
                      <PasswordRule valid={/[A-Z]/.test(password)} text={t('auth.register.passwordRequirementUpper')} />
                      <PasswordRule valid={/[a-z]/.test(password)} text={t('auth.register.passwordRequirementLower')} />
                      <PasswordRule valid={/[0-9]/.test(password)} text={t('auth.register.passwordRequirementNumber')} />
                      <PasswordRule valid={/[^A-Za-z0-9]/.test(password)} text={t('auth.register.passwordRequirementSpecial')} />
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Confirm Password Input */}
              <Box>
                <CustomTextField
                  fullWidth
                  label={t('auth.register.confirmPassword')}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                type={isConfirmPasswordShown ? 'text' : 'password'}
                error={!!errors.confirmPassword}
                helperText={undefined}
                {...register('confirmPassword')}
                slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-lock' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none' }}>
                      <PasswordRule valid={isPasswordMatch} text={t('auth.register.passwordMatch')} />
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={isLoading || isGoogleLoading || !isFormReady}
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
                    {t('auth.register.submitting')}
                  </>
                ) : (
                  t('auth.register.submit')
                )}
              </Button>

              {/* Divider */}
              <Divider sx={{ my: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ px: 2, bgcolor: 'background.default' }}>
                  {t('auth.register.divider')}
                </Typography>
              </Divider>

              {/* Google Sign Up Button */}
              <Button
                fullWidth
                variant='outlined'
                onClick={handleGoogleSignUp}
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
                {isGoogleLoading ? t('auth.register.googleSigningUp') : t('auth.register.googleSignUp')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    </Box>
  )
}

export default RegisterV1
