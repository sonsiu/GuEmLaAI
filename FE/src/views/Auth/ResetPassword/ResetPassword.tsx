'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Locale } from '@configs/i18n'
import CustomTextField from '@core/components/mui/TextField'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { getLocalizedUrl } from '@/utils/i18n'
import AuthIllustrationWrapper from '@/views/Auth/Login/AuthIllustrationWrapper'
import StarBackground from '@/views/Auth/Login/StarBackground'
import { ClientApi } from '@/services/client-api.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'

const PasswordRule = ({ valid, text }: { valid: boolean; text: string }) => (
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

const ResetPassword = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { lang: locale } = useParams()
  const searchParams = useSearchParams()

  const id = searchParams.get('id')
  const validator = searchParams.get('validator')

  const resetPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(1, t('auth.validation.passwordRequired'))
        .min(8, t('auth.validation.passwordMin').replace('{min}', '8')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired'))
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('auth.validation.passwordMismatch'),
      path: ['confirmPassword']
    })

  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword') || ''
  const confirmPassword = watch('confirmPassword') || ''

  const meetsPasswordRules =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword)

  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const isFormReady = meetsPasswordRules && isPasswordMatch && !!id && !!validator

  useEffect(() => {
    if (!id || !validator) {
      setFormError(t('auth.resetPassword.invalidLink'))
    }
  }, [id, validator, t])

  useEffect(() => {
    if (!isSuccess) return

    setCountdown(5)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push(getLocalizedUrl('/login', locale as Locale))
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isSuccess, locale, router])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!id || !validator) {
      setFormError(t('auth.resetPassword.invalidLink'))
      return
    }

    if (!meetsPasswordRules) {
      const message = t('auth.register.passwordRequirementInline').replace('{min}', '8')
      setError('newPassword', { message })
      setFocus('newPassword')
      setFormError(message)
      return
    }

    if (!isPasswordMatch) {
      const message = t('auth.validation.passwordMismatch')
      setError('confirmPassword', { message })
      setFocus('confirmPassword')
      setFormError(message)
      return
    }

    setIsLoading(true)
    setFormError(null)

    try {
      const response = await ClientApi.post<{ Message?: string }>(
        '/auth/forgot-password/reset',
        {
          id,
          validator,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        },
        undefined,
        false
      )

      const rawResponse = response.getRaw()

      if (rawResponse.success) {
        const message = rawResponse.data?.Message || t('auth.resetPassword.success')
        setIsSuccess(true)
        showSuccessToast(message)
      } else {
        const message = rawResponse.message || t('auth.resetPassword.error')
        setFormError(message)
        showErrorToast(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.resetPassword.error')
      setFormError(message)
      showErrorToast(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StarBackground />
      <AuthIllustrationWrapper>
        <Card className='flex flex-col' sx={{ maxWidth: 420, width: '100%' }}>
          <CardContent className='p-8'>
            <div className='flex flex-col gap-1 mbe-6 justify-center items-center text-center'>
              <Typography variant='h4'>{t('auth.resetPassword.title')}</Typography>
              <Typography color='text.secondary'>{t('auth.resetPassword.subtitle')}</Typography>
            </div>

            {formError && !isSuccess && (
              <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            {isSuccess ? (
              <Alert severity='success' sx={{ mb: 3, borderRadius: 2 }}>
                {t('auth.resetPassword.successRedirect').replace('{seconds}', countdown.toString())}
              </Alert>
            ) : (
              <form autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                <Box>
                  <CustomTextField
                    fullWidth
                    label={t('auth.resetPassword.newPassword')}
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    type={isPasswordShown ? 'text' : 'password'}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message}
                    {...register('newPassword')}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-lock' style={{ color: 'var(--mui-palette-text-disabled)' }}></i>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton edge='end' onClick={() => setIsPasswordShown(show => !show)} onMouseDown={e => e.preventDefault()}>
                              <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  {newPassword && (
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
                        <PasswordRule valid={newPassword.length >= 8} text={t('auth.register.passwordRequirementMin').replace('{min}', '8')} />
                        <PasswordRule valid={/[A-Z]/.test(newPassword)} text={t('auth.register.passwordRequirementUpper')} />
                        <PasswordRule valid={/[a-z]/.test(newPassword)} text={t('auth.register.passwordRequirementLower')} />
                        <PasswordRule valid={/[0-9]/.test(newPassword)} text={t('auth.register.passwordRequirementNumber')} />
                        <PasswordRule valid={/[^A-Za-z0-9]/.test(newPassword)} text={t('auth.register.passwordRequirementSpecial')} />
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box>
                  <CustomTextField
                    fullWidth
                    label={t('auth.resetPassword.confirmPassword')}
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
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
                              onClick={() => setIsConfirmPasswordShown(show => !show)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

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

                <Button
                  fullWidth
                  variant='contained'
                  type='submit'
                  disabled={isLoading || !id || !validator || !isFormReady}
                  sx={{
                    py: 1.5,
                    background:
                      'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-error-main) 100%)',
                    '&:disabled': {
                      background: 'action.disabledBackground',
                      color: 'action.disabled'
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      {t('auth.resetPassword.submitting')}
                    </>
                  ) : (
                    t('auth.resetPassword.submit')
                  )}
                </Button>
              </form>
            )}

            <div className='flex justify-center items-center flex-wrap gap-2 mt-6'>
              <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
                {t('auth.resetPassword.backToLogin')}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    </Box>
  )
}

export default ResetPassword
