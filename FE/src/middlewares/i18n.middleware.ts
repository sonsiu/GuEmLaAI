import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from '@/configs/i18n'
import { checkLocale, getLocale } from './helper.middleware'
import { DEFAULT_URL } from '@/@core/constants/global.const'

export function i18nMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { isRoot, locale, hasLocale } = checkLocale(pathname)

  if (hasLocale) {
    if (isRoot && locale) return NextResponse.redirect(new URL(`/${locale}${DEFAULT_URL}`, request.url))

    return null
  }

  const finalLocale = i18n.locales.includes(getLocale(request) as any) ? getLocale(request) : i18n.defaultLocale

  const newUrl = new URL(`/${finalLocale}${pathname}`, request.url)

  newUrl.search = request.nextUrl.search

  return NextResponse.redirect(newUrl)
}
