'use client'

import type { ReactNode } from 'react'
import Typography from '@mui/material/Typography'

interface FormLabelProps {
  children: ReactNode
  required?: boolean
}

export const FormLabel = ({ children, required }: FormLabelProps) => {
  return (
    <Typography component='label' className='text-sm font-medium'>
      {children}
      {required && <span className='text-error ms-1'>*</span>}
    </Typography>
  )
}
