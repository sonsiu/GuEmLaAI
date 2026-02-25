'use client'

// Third-party Imports
import { usePathname } from 'next/navigation'
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

// Styled Component Imports
import StyledMain from '@layouts/styles/shared/StyledMain'

const LayoutContent = ({ children }: ChildrenType) => {
  // Hooks
  const { settings } = useSettings()

  // Vars
  const contentCompact = settings.contentWidth === 'compact'
  const contentWide = settings.contentWidth === 'wide'
  const pathname = usePathname()
  const isDashboard = pathname?.includes('/dashboards')

  return (
    <StyledMain
      isContentCompact={isDashboard ? false : contentCompact}
      className={classnames(horizontalLayoutClasses.content, 'flex-auto', {
        [`${horizontalLayoutClasses.contentCompact} is-full`]: isDashboard ? false : contentCompact,
        [horizontalLayoutClasses.contentWide]: isDashboard ? true : contentWide
      })}
      style={{ padding: isDashboard ? 0 : themeConfig.layoutPadding }}
    >
      {children}
    </StyledMain>
  )
}

export default LayoutContent
