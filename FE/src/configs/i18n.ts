import { DEFAULT_LOCALE, LOCALE, LOCALES } from '@/@core/constants/global.const'

export const i18n = {
  defaultLocale: DEFAULT_LOCALE,
  locales: LOCALES,
  langDirection: {
    [LOCALE.en]: 'ltr',
    [LOCALE.vi]: 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
