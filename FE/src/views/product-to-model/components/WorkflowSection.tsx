'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from '../../../@core/hooks/useTranslation'
import { UploadCloudIcon, SparklesIcon, PhotoIcon } from './icons'

const WorkflowSection: React.FC = () => {
  const { t } = useTranslation()

  const steps = [
    {
      icon: <UploadCloudIcon />,
      title: t('productToModel.workflow.steps.upload.title'),
      description: t('productToModel.workflow.steps.upload.description')
    },
    {
      icon: <SparklesIcon />,
      title: t('productToModel.workflow.steps.aiMagic.title'),
      description: t('productToModel.workflow.steps.aiMagic.description')
    },
    {
      icon: <PhotoIcon />,
      title: t('productToModel.workflow.steps.result.title'),
      description: t('productToModel.workflow.steps.result.description')
    }
  ]

  return (
    <Paper
      variant='outlined'
      sx={{
        borderRadius: 3,
        p: { xs: 3, md: 4 }
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant='h5' fontWeight={600} sx={{ mb: 1 }}>
            {t('productToModel.workflow.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('productToModel.workflow.subtitle')}
          </Typography>
        </Box>

        <Divider />

        <Grid container spacing={3}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction='row' spacing={2} alignItems='center'>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {React.cloneElement(step.icon, { width: 22, height: 22, color: 'var(--mui-palette-primary-main)' })}
                  </Box>
                  <Typography variant='subtitle1' fontWeight={600}>
                    {t('productToModel.workflow.stepLabel').replace('{index}', (index + 1).toString())}
                  </Typography>
                </Stack>
                <Typography variant='h6'>{step.title}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {step.description}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Button
            variant='contained'
            disabled
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, var(--mui-palette-primary-main), var(--mui-palette-error-main))',
              color: 'common.white',
              fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, var(--mui-palette-primary-dark), var(--mui-palette-error-dark))' }
            }}
          >
            {t('productToModel.actions.getStarted')}
          </Button>
          <Typography variant='body2' color='text.secondary'>
            {t('productToModel.actions.hint')}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default WorkflowSection


