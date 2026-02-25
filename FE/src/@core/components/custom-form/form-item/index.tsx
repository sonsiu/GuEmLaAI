'use client'

import type { ReactNode } from 'react'

interface FormItemProps {
  children: ReactNode
  className?: string
}

export const FormItem = ({ children, className = '' }: FormItemProps) => {
  return <div className={`flex flex-col gap-1 ${className}`}>{children}</div>
}
