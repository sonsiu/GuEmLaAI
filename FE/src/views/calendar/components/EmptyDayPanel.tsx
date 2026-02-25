'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useTranslation } from '@/@core/hooks/useTranslation'

interface EmptyDayPanelProps {
    onAddData?: () => void
}

const EmptyDayPanel: React.FC<EmptyDayPanelProps> = ({ onAddData }) => {
    const { t } = useTranslation()
    return (
        <Card
            sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: 'action.selected',
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 240, sm: 300 },
            }}
        >
            <CardContent sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {t('calendar.empty.title')}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary', mb: onAddData ? 2 : 0, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {t('calendar.empty.subtitle')}
                </Typography>
                {onAddData && (
                    <Button variant='contained' onClick={onAddData} size='small' sx={{ mt: 2 }}>
                        {t('calendar.empty.action')}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default EmptyDayPanel
