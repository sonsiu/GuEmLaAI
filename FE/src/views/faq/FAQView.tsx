'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface FAQItem {
  question: string
  answer: string
}

const FAQView: React.FC = () => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | false>(false)

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const faqItems: FAQItem[] = [
    {
      question: t('faq.items.aiTryOn.question'),
      answer: t('faq.items.aiTryOn.answer')
    },
    {
      question: t('faq.items.fileFormats.question'),
      answer: t('faq.items.fileFormats.answer')
    },
    {
      question: t('faq.items.processingTime.question'),
      answer: t('faq.items.processingTime.answer')
    },
    {
      question: t('faq.items.saveResults.question'),
      answer: t('faq.items.saveResults.answer')
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Box sx={{ maxWidth: 'md', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 } }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <i className='tabler-question-mark text-white' style={{ fontSize: '2.5rem' }}></i>
          </Box>
          <Typography variant='h3' fontWeight={700} gutterBottom>
            {t('faq.title')}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('faq.subtitle')}
          </Typography>
        </Box>

        {/* FAQ Items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqItems.map((item, index) => {
            const panelId = `faq-panel-${index}`
            const isExpanded = expanded === panelId

            return (
              <Accordion
                key={index}
                expanded={isExpanded}
                onChange={handleChange(panelId)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:before': {
                    display: 'none'
                  },
                  '&.Mui-expanded': {
                    margin: 0,
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: isExpanded ? 'primary.main' : 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isExpanded ? 'primary.dark' : 'action.selected'
                        }
                      }}
                    >
                      <i
                        className={`tabler-chevron-${isExpanded ? 'up' : 'down'}`}
                        style={{
                          fontSize: '1.25rem',
                          color: isExpanded ? 'white' : 'var(--mui-palette-text-secondary)',
                          transition: 'transform 0.3s ease'
                        }}
                      ></i>
                    </Box>
                  }
                  sx={{
                    px: 3,
                    py: 2.5,
                    minHeight: 64,
                    '&.Mui-expanded': {
                      minHeight: 64,
                      bgcolor: 'action.hover'
                    },
                    '& .MuiAccordionSummary-content': {
                      my: 0,
                      '&.Mui-expanded': {
                        my: 0
                      }
                    }
                  }}
                >
                  <Typography variant='h6' fontWeight={600} sx={{ pr: 2 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 3,
                    pb: 3,
                    pt: 0,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.8 }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Box>

        {/* Additional Help Section */}
        <Card
          sx={{
            mt: 6,
            background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-info-main) 100%)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center', color: 'white' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <i className='tabler-mail text-white' style={{ fontSize: '2rem' }}></i>
            </Box>
            <Typography variant='h5' fontWeight={700} gutterBottom>
              {t('faq.help.title')}
            </Typography>
            <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
              {t('faq.help.description')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default FAQView

