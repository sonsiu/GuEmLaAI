'use client'

// Third-party Imports
import { useRouter } from 'next/navigation'
import classnames from 'classnames'

// Component Imports
import { Button } from '@mui/material'
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import RealtimeHeaderWidgets from '@components/layout/shared/RealtimeHeaderWidgets'
import GlobalNotifications from '@/components/GlobalNotifications'
import WeatherWidget from '@components/layout/shared/WeatherWidget'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import LanguageDropdown from '../shared/LanguageDropdown'
import { useAuth } from '@/@core/contexts/AuthContext'
import { USER_ROLE } from '@/@core/constants/global.const'

const NavbarContent = () => {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4 min-w-0 flex-1'>
        <NavToggle />
        <GlobalNotifications />
      </div>
      <div className='hidden md:block'>
        <WeatherWidget />
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        {isAuthenticated && user?.role === USER_ROLE.USER && <RealtimeHeaderWidgets />}
        
        <LanguageDropdown />
        <ModeDropdown />
        {isAuthenticated ? (
          <UserDropdown />
        ) : (
          <div className='flex gap-2'>
            <Button variant='outlined' color='primary' onClick={() => router.push('/login')}>
              Đăng nhập
            </Button>
            <Button variant='contained' color='primary' onClick={() => router.push('/register')}>
              Đăng ký
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NavbarContent
