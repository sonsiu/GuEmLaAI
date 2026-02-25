'use client'

import { memo } from 'react'
import type { FieldError } from 'react-hook-form'
import { useFormState } from 'react-hook-form'

interface FormErrorProps {
  name: string
  render: (error: FieldError | undefined) => React.ReactNode
}

export const FormError = memo(({ name, render }: FormErrorProps) => {
  const { errors } = useFormState({
    name
  })

  return <>{render(errors[name] as FieldError)}</>
})

FormError.displayName = 'FormError'
