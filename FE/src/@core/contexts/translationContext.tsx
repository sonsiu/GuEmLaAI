'use client'

import { createContext } from 'react'
import type { Locale } from '@/configs/i18n'
import enTranslations from '@/translations/en.json'
import viTranslations from '@/translations/vi.json'

export type TranslationContextType = {
  lang: Locale
  t: (key: string, params?: Record<string, any>) => string
}

export const TranslationContext = createContext<TranslationContextType | null>(null)

export const TranslationProvider = ({ children, lang }: { children: React.ReactNode; lang: Locale }) => {
  const translations = {
    en: enTranslations,
    vi: viTranslations
  }

  const t = (key: string, params?: Record<string, any>): string => {
    try {
      const keys = key.split('.')
      let value: any = translations[lang]

      for (const k of keys) {
        value = value[k]
        if (value === undefined) return key
      }

      if (typeof value !== 'string') return key

      // Handle interpolation
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? String(params[paramKey]) : match
        })
      }

      return value
    } catch (error) {
      return key
    }
  }

  return <TranslationContext.Provider value={{ lang, t }}>{children}</TranslationContext.Provider>
}
