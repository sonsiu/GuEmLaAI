'use client'

// Component Imports
import Navigation from './Navigation'
import LayoutHeader from '@layouts/components/horizontal/Header'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'
import NavbarContent from './NavbarContent'
import Navbar from '@/@layouts/components/horizontal/Navbar'

const Header = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <>
      <LayoutHeader>
        <Navbar isBreakpointReached={isBreakpointReached}>
          <NavbarContent />
        </Navbar>
        {!isBreakpointReached && <Navigation />}
      </LayoutHeader>
      {isBreakpointReached && <Navigation />}
    </>
  )
}

export default Header
