import type { headers } from 'next/headers'
import LangRedirect from '@components/LangRedirect'
import type { Locale } from '@configs/i18n'
import { i18n } from '@configs/i18n'
import type { ChildrenType } from '@core/types'
import { TranslationProvider } from '@/@core/contexts/translationContext'

const invalidLangs = ['_next']

const TranslationWrapper = (
  props: { headersList: Awaited<ReturnType<typeof headers>>; lang: Locale } & ChildrenType
) => {
  const doesLangExist = i18n.locales.includes(props.lang)

  const isInvalidLang = invalidLangs.includes(props.lang)

  if (!doesLangExist && !isInvalidLang) return <LangRedirect />

  return <TranslationProvider lang={props.lang}>{props.children}</TranslationProvider>
}

export default TranslationWrapper
