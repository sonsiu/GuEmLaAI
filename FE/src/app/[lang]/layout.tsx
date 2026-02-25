import { headers } from 'next/headers'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import 'react-perfect-scrollbar/dist/css/styles.css'
import type { ChildrenType } from '@core/types'
import { getSystemMode } from '@core/utils/serverHelpers'
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'
import { i18n, type Locale } from '@/configs/i18n'
import TranslationWrapper from '@/hocs/TranslationWrapper'
import Providers from '@/components/Providers'
import Customizer from '@/@core/components/customizer'
import AppReactToastify from '@/@core/components/toast'

export const metadata = {
  title: 'GuEmLaAi - Phối đồ thời gian bằng AI',
  description:
    'GuEmLaAi giúp bạn phối đồ thời trang một cách thông minh và nhanh chóng bằng trí tuệ nhân tạo.',
  icons: {
    icon: '/images/logo/logo-page.png',
    shortcut: '/images/logo/logo-page.png',
    apple: '/images/logo/logo-page.png'
  }
}

const RootLayout = async (props: ChildrenType & { params: Promise<{ lang: Locale }> }) => {
  const params = await props.params
  const { children } = props
  const headersList = await headers()
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[params.lang]

  return (
    <TranslationWrapper headersList={headersList} lang={params.lang}>
      <html id='__next' lang={params.lang} dir={direction} suppressHydrationWarning>
        <head>
          <link rel='icon' href='/images/logo/logo-page.png' />
          <link rel='apple-touch-icon' href='/images/logo/logo-page.png' />
        </head>
        <body className='flex is-full min-bs-full flex-auto flex-col overflow-x-hidden'>
          <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
          <Providers direction={direction}>
            {children}
            <Customizer dir={direction} />
            <AppReactToastify />
          </Providers>
        </body>
      </html>
    </TranslationWrapper>
  )
}

export default RootLayout
