'use client'

import React from 'react'
import Box from '@mui/material/Box'
import { useTranslation } from '../../@core/hooks/useTranslation'
import HeroSection from './components/HeroSection'
import ShowcaseSection from './components/ShowcaseSection'
import WorkflowSection from './components/WorkflowSection'

const ProductToModelView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box
      component='main'
      aria-label={t('productToModel.hero.title')}
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 6, md: 10 },
        px: { xs: 3, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 6, md: 8 }
      }}
    >
      <HeroSection />
      <ShowcaseSection />
      <WorkflowSection />
    </Box>
  )
}

export default ProductToModelView