'use client'

import { useContext } from 'react'
import { TranslationContext } from '../contexts/translationContext'

export const useTranslation = () => {
  const context = useContext(TranslationContext)

  if (!context) {
    throw new Error('useTranslation must be used within TranslationWrapper')
  }

  return context
}
