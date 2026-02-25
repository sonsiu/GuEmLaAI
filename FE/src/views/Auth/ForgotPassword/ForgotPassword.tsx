'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
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

const ForgotPassword = () => {
  const { t } = useTranslation()
  const { lang: locale } = useParams()

  const forgotPasswordSchema = z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid'))
  })

  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setIsSubmitted(false)
    setServerMessage(null)

    try {
      const response = await ClientApi.post<{ Message?: string }>(
        '/auth/forgot-password/request',
        { email: data.email },
        undefined,
        false
      )

      const rawResponse = response.getRaw()

      if (rawResponse.success) {
        const message = rawResponse.data?.Message || t('auth.forgotPassword.success')
        setIsSubmitted(true)
        setServerMessage(message)
        showSuccessToast(message)
      } else {
        const message = rawResponse.message || t('auth.forgotPassword.error')
        setServerMessage(message)
        showErrorToast(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.forgotPassword.error')
      setServerMessage(message)
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
              <Typography variant='h4'>{t('auth.forgotPassword.title')}</Typography>
              <Typography color='text.secondary'>{t('auth.forgotPassword.subtitle')}</Typography>
            </div>

            {serverMessage && (
              <Alert severity={isSubmitted ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 2 }}>
                {serverMessage}
              </Alert>
            )}

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
              <CustomTextField
                autoFocus
                fullWidth
                label={t('auth.login.email')}
                placeholder={t('auth.login.emailPlaceholder')}
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />

              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={isLoading}
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
                    {t('auth.forgotPassword.submitting')}
                  </>
                ) : (
                  t('auth.forgotPassword.submit')
                )}
              </Button>
            </form>

            <div className='flex justify-center items-center flex-wrap gap-2 mt-6'>
              <Typography color='text.secondary'>{t('auth.forgotPassword.backToLoginPrefix')}</Typography>
              <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
                {t('auth.forgotPassword.backToLogin')}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    </Box>
  )
}

export default ForgotPassword
