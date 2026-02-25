'use client'

import type { ChangeEvent, ReactNode } from 'react'
import { cloneElement, isValidElement, memo, useCallback, useRef } from 'react'
import { DatePicker } from '@mui/x-date-pickers'
import moment from 'moment'
import type { FieldError, FieldErrors, FieldErrorsImpl, Merge } from 'react-hook-form'
import { useController, useFormContext } from 'react-hook-form'

interface FormControlProps {
  children: ReactNode
  error?: FieldError | FieldErrors | undefined
  helperText?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  name: string
}

type DatePickerProps = {
  format?: string
}

const FormInput = memo(({ children, name }: { children: ReactNode; name: string }) => {
  const { field } = useController({ name })
  const { trigger } = useFormContext()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedValidate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      await trigger(name)
    }, 500)
  }, [name, trigger])

  if (!isValidElement(children)) return children

  if (children.type === DatePicker) {
    const { format = 'YYYY-MM-DD' } = children.props as DatePickerProps

    return cloneElement(children, {
      ...children.props,
      value: moment(field.value),
      onChange: (newValue: any) => {
        field.onChange(moment(newValue).format(format))
        debouncedValidate()
      },
      onBlur: field.onBlur,
      slotProps: {
        ...children.props.slotProps,
        textField: {
          ...children.props.slotProps?.textField,
          fullWidth: true
        }
      }
    })
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e || !e.target) {
      field.onChange(e)
      debouncedValidate()
      return
    }

    const inputType = e.target.type
    let value: any = e.target.value

    switch (inputType) {
      case 'number':
        value = e.target.value === '' ? '' : Number(e.target.value)
        break
      case 'checkbox':
        value = e.target.checked
        break
      case 'date':
        value = e.target.value ? new Date(e.target.value) : null
        break
      default:
        value = e.target.value
    }

    field.onChange(value)
    debouncedValidate()
  }

  return cloneElement(children, {
    ...children.props,
    ...field,
    onChange: handleChange,
    onBlur: async () => {
      field.onBlur()
      await trigger(name)
    }
  })
})

FormInput.displayName = 'FormInput'

const HelperText = memo(
  ({
    error,
    helperText
  }: {
    error?: FieldError | FieldErrors | undefined
    helperText?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  }) => {
    if (!helperText) return null

    return <span className={`text-sm ${error ? 'text-error' : 'text-muted'}`}>{helperText.toString()}</span>
  }
)

HelperText.displayName = 'HelperText'

export const FormControl = ({ children, error, helperText, name }: FormControlProps) => {
  return (
    <div className='flex flex-col gap-1'>
      <FormInput name={name}>{children}</FormInput>
      <HelperText error={error} helperText={helperText} />
    </div>
  )
}
