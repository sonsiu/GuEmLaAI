// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const Navbar = ({ children, isBreakpointReached }: ChildrenType & { isBreakpointReached?: boolean }) => {
  return (
    <>
      {isBreakpointReached ? (
        <div className={classnames(horizontalLayoutClasses.navbar, 'flex items-center justify-between is-full')}>
          {children}
        </div>
      ) : null}
    </>
  )
}

export default Navbar
