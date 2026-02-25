'use client'

import React from 'react'
import Box from '@mui/material/Box'
import TryOnComponent from './components/TryOnComponent'

const TryOnView: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TryOnComponent />
    </Box>
  )
}

export default TryOnView

