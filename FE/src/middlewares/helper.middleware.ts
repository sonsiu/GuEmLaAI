import type { NextRequest } from 'next/server'
import { i18n } from '@/configs/i18n'

export const getLocale = (request: NextRequest) => {
  return (
    request.cookies.get('NEXT_LOCALE')?.value ??
    request.headers.get('accept-language')?.split(',')[0].split('-')[0] ??
    i18n.defaultLocale
  )
}

export const checkLocale = (pathname: string) => {
  // Check root locale (vd: /en, /vi)
  const isLangRoot = i18n.locales.some(locale => pathname === `/${locale}`)

  if (isLangRoot) {
    const lang = pathname.slice(1)

    return {
      isRoot: true,
      locale: lang,
      hasLocale: true
    }
  }

  const hasLocale = i18n.locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  const locale = hasLocale ? pathname.split('/')[1] : null

  return {
    isRoot: false,
    locale,
    hasLocale
  }
}
