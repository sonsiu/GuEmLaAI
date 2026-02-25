'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from '../../../@core/hooks/useTranslation'

const HeroSection: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, md: 6 },
        borderRadius: 4,
        background: 'linear-gradient(135deg, var(--mui-palette-primary-main), var(--mui-palette-error-main))',
        color: 'common.white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          background:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 45%)'
        }}
      />
      <Stack spacing={3} sx={{ position: 'relative' }}>
        <Chip
          label={t('productToModel.hero.badge')}
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'common.white',
            fontWeight: 600
          }}
        />
        <Typography
          component='h1'
          sx={{
            fontSize: { xs: '2.25rem', md: '3.25rem' },
            fontWeight: 700,
            lineHeight: 1.2
          }}
        >
          {t('productToModel.hero.title')}
          <Typography component='span' sx={{ display: 'block', fontWeight: 400, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {t('productToModel.hero.subtitle')}
          </Typography>
        </Typography>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, maxWidth: 720 }}>
          {t('productToModel.hero.description')}
        </Typography>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Chip
            label={t('productToModel.status.comingSoon')}
            color='warning'
            sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', color: 'common.white' }}
          />
          <Typography variant='body2' sx={{ opacity: 0.9 }}>
            {t('productToModel.hero.caption')}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default HeroSection


