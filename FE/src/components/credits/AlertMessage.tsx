'use client'

import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

interface AlertMessageProps {
  type: 'success' | 'error'
  message: string
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Alert
        severity={type}
        icon={
          <i
            className={type === 'success' ? 'tabler-check-circle' : 'tabler-alert-circle'}
            style={{ fontSize: '1.5rem' }}
          ></i>
        }
        sx={{
          borderRadius: 2,
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
      >
        {message}
      </Alert>
    </Box>
  )
}

