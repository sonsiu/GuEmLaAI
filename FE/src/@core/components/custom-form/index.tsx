'use client'

import { useCallback, useRef } from 'react'
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm } from 'react-hook-form'
import type { TranslationContextType } from '@/@core/contexts/translationContext'

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'email' | 'pattern' | 'minNumber' | 'maxNumber' | 'date' | 'custom'
  message: string
  value?: any
}

interface SimpleValidationRule {
  required?: boolean | string
  min?: number | [number, string]
  max?: number | [number, string]
  email?: boolean | string
  pattern?: RegExp | [RegExp, string]
  minNumber?: number | [number, string]
  maxNumber?: number | [number, string]
  date?: boolean | string
  custom?: [(value: any) => boolean, string]
}

type FormField<T = any> = [T, SimpleValidationRule?]

type FormDefinition = {
  [key: string]: FormField<any>
}

type FormValues<T extends FormDefinition> = {
  [K in keyof T]: ExtractFieldValue<T[K]>
}

type ExtractFieldValue<T> = T extends FormField<infer V> ? V : never

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => void
  children: React.ReactNode
}

const getDefaultMessage = (field: string, rule: string, value?: any): string => {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1)

  switch (rule) {
    case 'required':
      return `${fieldName} is required`
    case 'min':
      return `${fieldName} must be at least ${value} characters`
    case 'max':
      return `${fieldName} must not exceed ${value} characters`
    case 'minNumber':
      return `${fieldName} must be at least ${value}`
    case 'maxNumber':
      return `${fieldName} must not exceed ${value}`
    case 'email':
      return `Invalid email format`
    case 'date':
      return `Invalid date format`
    default:
      return `Invalid ${fieldName}`
  }
}

const validateEmail = (email: string): boolean => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
}

const validateDate = (value: any): boolean => {
  if (!value) return true
  const date = new Date(value)

  return date instanceof Date && !isNaN(date.getTime())
}

const normalizeRules = (
  field: string,
  rules?: SimpleValidationRule,
  t?: TranslationContextType['t']
): ValidationRule[] => {
  if (!rules) return []

  const normalized: ValidationRule[] = []
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1)

  const getMessage = (key: string, value?: any) => {
    if (t) {
      const message = t(`validation.${key}`)

      return message.replace('{field}', fieldName).replace('{value}', value?.toString() || '')
    }

    return getDefaultMessage(field, key, value)
  }

  if (rules.required) {
    normalized.push({
      type: 'required',
      message: typeof rules.required === 'string' ? rules.required : getMessage('required')
    })
  }

  if (rules.min !== undefined) {
    normalized.push({
      type: 'min',
      value: Array.isArray(rules.min) ? rules.min[0] : rules.min,
      message: Array.isArray(rules.min) ? rules.min[1] : getMessage('min', rules.min)
    })
  }

  if (rules.max !== undefined) {
    normalized.push({
      type: 'max',
      value: Array.isArray(rules.max) ? rules.max[0] : rules.max,
      message: Array.isArray(rules.max) ? rules.max[1] : getMessage('max', rules.max)
    })
  }

  if (rules.minNumber !== undefined) {
    normalized.push({
      type: 'minNumber',
      value: Array.isArray(rules.minNumber) ? rules.minNumber[0] : rules.minNumber,
      message: Array.isArray(rules.minNumber) ? rules.minNumber[1] : getMessage('minNumber', rules.minNumber)
    })
  }

  if (rules.maxNumber !== undefined) {
    normalized.push({
      type: 'maxNumber',
      value: Array.isArray(rules.maxNumber) ? rules.maxNumber[0] : rules.maxNumber,
      message: Array.isArray(rules.maxNumber) ? rules.maxNumber[1] : getMessage('maxNumber', rules.maxNumber)
    })
  }

  if (rules.email) {
    normalized.push({
      type: 'email',
      message: typeof rules.email === 'string' ? rules.email : getMessage('email')
    })
  }

  if (rules.pattern) {
    normalized.push({
      type: 'pattern',
      value: Array.isArray(rules.pattern) ? rules.pattern[0] : rules.pattern,
      message: Array.isArray(rules.pattern) ? rules.pattern[1] : getMessage('pattern')
    })
  }

  if (rules.date) {
    normalized.push({
      type: 'date',
      message: typeof rules.date === 'string' ? rules.date : getMessage('date')
    })
  }

  if (rules.custom && Array.isArray(rules.custom)) {
    normalized.push({
      type: 'custom',
      value: rules.custom[0],
      message: rules.custom[1]
    })
  }

  return normalized
}

export const Form = <T extends FieldValues>({ form, onSubmit, children }: FormProps<T>) => {
  const { handleSubmit } = form

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        {children}
      </form>
    </FormProvider>
  )
}

export const useAppForm = <T extends FormDefinition>(initialFormDefinition: T, t: TranslationContextType['t']) => {
  type Values = FormValues<T>
  const formDefinitionRef = useRef(initialFormDefinition)

  const resolver = useCallback(async (values: Values) => {
    const errors: Record<string, any> = {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(formDefinitionRef.current).forEach(([field, [_, rules]]) => {
      const normalizedRules = normalizeRules(field, rules, t)

      if (!normalizedRules.length) return

      const value = values[field]
      let fieldError: { type: string; message: string } | null = null

      for (const rule of normalizedRules) {
        switch (rule.type) {
          case 'required':
            if (value === undefined || value === null || value === '') {
              fieldError = { type: 'required', message: rule.message }
            }

            break

          case 'min':
            if (typeof value === 'string' && value.length < rule.value) {
              fieldError = { type: 'min', message: rule.message }
            }

            break

          case 'max':
            if (typeof value === 'string' && value.length > rule.value) {
              fieldError = { type: 'max', message: rule.message }
            }

            break

          case 'minNumber':
            if (typeof value === 'number' && value < rule.value) {
              fieldError = { type: 'minNumber', message: rule.message }
            }

            break

          case 'maxNumber':
            if (typeof value === 'number' && value > rule.value) {
              fieldError = { type: 'maxNumber', message: rule.message }
            }

            break

          case 'email':
            if (!validateEmail(String(value))) {
              fieldError = { type: 'email', message: rule.message }
            }

            break

          case 'pattern':
            if (!rule.value.test(String(value))) {
              fieldError = { type: 'pattern', message: rule.message }
            }

            break

          case 'date':
            if (!validateDate(value)) {
              fieldError = { type: 'date', message: rule.message }
            }

            break

          case 'custom':
            if (!rule.value(value)) {
              fieldError = { type: 'custom', message: rule.message }
            }

            break
        }

        if (fieldError) break
      }

      if (fieldError) {
        errors[field] = fieldError
      }
    })

    return {
      values,
      errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<Values>({
    defaultValues: Object.entries(formDefinitionRef.current).reduce((acc, [key, [value]]) => {
      acc[key as keyof Values] = value
      return acc
    }, {} as DefaultValues<Values>),
    resolver,
    mode: 'onChange'
  })

  const setValidationRules = useCallback((newRules: T) => {
    formDefinitionRef.current = newRules
  }, [])

  return {
    ...form,
    setValidationRules
  }
}
