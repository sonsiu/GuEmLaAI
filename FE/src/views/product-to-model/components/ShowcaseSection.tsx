'use client'

import React from 'react'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from '../../../@core/hooks/useTranslation'
import { UploadCloudIcon, PhotoPlusIcon, CameraSparklesIcon, UserCircleIcon } from './icons'

const ShowcaseSection: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Paper
          variant='outlined'
          sx={{
            height: '100%',
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            borderStyle: 'dashed',
            borderColor: 'divider'
          }}
        >
          <Stack spacing={2}>
            <Stack direction='row' spacing={2} alignItems='flex-start'>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.lighterOpacity',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UploadCloudIcon width={24} height={24} color='var(--mui-palette-primary-main)' />
              </Box>
              <Box>
                <Typography variant='h5' fontWeight={600}>
                  {t('productToModel.upload.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('productToModel.upload.description')}
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                flex: 1,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                py: 7,
                px: 3,
                textAlign: 'center',
                bgcolor: 'action.hover'
              }}
            >
              <PhotoPlusIcon width={40} height={40} color='var(--mui-palette-text-secondary)' />
              <Typography fontWeight={600} sx={{ mt: 2 }}>
                {t('productToModel.upload.placeholderTitle')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('productToModel.upload.placeholderDescription')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper
          variant='outlined'
          sx={{
            height: '100%',
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            borderStyle: 'dashed',
            borderColor: 'divider'
          }}
        >
          <Stack spacing={2}>
            <Stack direction='row' spacing={2} alignItems='flex-start'>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'error.lighterOpacity',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CameraSparklesIcon width={24} height={24} color='var(--mui-palette-error-main)' />
              </Box>
              <Box>
                <Typography variant='h5' fontWeight={600}>
                  {t('productToModel.result.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('productToModel.result.description')}
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                flex: 1,
                borderRadius: 3,
                py: 7,
                px: 3,
                textAlign: 'center',
                bgcolor: 'background.paper'
              }}
            >
              <UserCircleIcon width={42} height={42} color='var(--mui-palette-text-disabled)' />
              <Typography fontWeight={600} sx={{ mt: 2 }}>
                {t('productToModel.result.placeholderTitle')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('productToModel.result.placeholderDescription')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default ShowcaseSection


