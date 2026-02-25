'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@/@core/hooks/useTranslation'

const REMIX_SUGGESTIONS = [
  'tryOn.footer.suggestion1',
  'tryOn.footer.suggestion2',
  'tryOn.footer.suggestion3',
  'tryOn.footer.suggestion4',
  'tryOn.footer.suggestion5'
]

interface FooterProps {
  isOnDressingScreen?: boolean
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false }) => {
  const { t } = useTranslation()
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % REMIX_SUGGESTIONS.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      component='footer'
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: 1.5,
        backdropFilter: 'blur(10px)',
        display: isOnDressingScreen ? { xs: 'none', sm: 'block' } : 'block'
      }}
    >
      <Box
        sx={{
          maxWidth: 'xl',
          mx: 'auto',
          px: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {t('tryOn.footer.virtualTryOn')}{' '}
          <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
            Gu Em Là AI
          </Box>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 16,
            overflow: 'hidden',
            mt: { xs: 0.5, sm: 0 }
          }}
        >
          <AnimatePresence mode='wait'>
            <motion.div
              key={suggestionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Typography variant='caption' color='text.secondary' sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                {t(REMIX_SUGGESTIONS[suggestionIndex])}
              </Typography>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer

