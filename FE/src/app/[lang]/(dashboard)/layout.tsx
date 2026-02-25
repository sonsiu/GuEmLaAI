import { Suspense } from 'react'
import Button from '@mui/material/Button'
import type { ChildrenType } from '@core/types'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import ScrollToTop from '@core/components/scroll-to-top'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'
import Loading from '@/@core/components/loading/Loading'
import { PublicProvider } from '@/@core/providers/PublicProvider'

const Layout = async (props: ChildrenType) => {
  const { children } = props
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <PublicProvider isNotCheck>
      <Suspense fallback={<Loading />}>
        <LayoutWrapper
          systemMode={systemMode}
          verticalLayout={
            <VerticalLayout navigation={<Navigation mode={mode} />} navbar={<Navbar />} footer={null}>
              {children}
            </VerticalLayout>
          }
          horizontalLayout={
            <HorizontalLayout header={<Header />} footer={null}>
              {children}
            </HorizontalLayout>
          }
        />
      </Suspense>
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='tabler-arrow-up' />
        </Button>
      </ScrollToTop>
    </PublicProvider>
  )
}

export default Layout
