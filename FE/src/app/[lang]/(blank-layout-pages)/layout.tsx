// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'
import { PublicProvider } from '@/@core/providers/PublicProvider'

type Props = ChildrenType

const Layout = async (props: Props) => {
  const { children } = props

  const systemMode = await getSystemMode()

  return (
    <PublicProvider>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </PublicProvider>
  )
}

export default Layout
