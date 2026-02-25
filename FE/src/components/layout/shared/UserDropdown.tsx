'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { Clock } from 'lucide-react'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { showSuccessToast } from '@/services/toast.service'
import { useAuth } from '@/@core/contexts/AuthContext'
import { userService } from '@/services/user.service'
import { useCountdownToMidnight } from '@/views/try-on/hooks/useCountdownToMidnight'
import { USER_ROLE } from '@/@core/constants/global.const'
import WeatherWidget from './WeatherWidget'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

type UserDropdownProps = {
  layout?: 'vertical' | 'horizontal'
}

const UserDropdown = ({ layout = 'vertical' }: UserDropdownProps) => {
  // States
  const [open, setOpen] = useState(false)
  const [tryOnCount, setTryOnCount] = useState(0)
  const [modelCount, setModelCount] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [tryOnLimit, setTryOnLimit] = useState(40)
  const [itemLimit, setItemLimit] = useState(10)
  const [modelLimit, setModelLimit] = useState(20)

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const { lang, t } = useTranslation()
  const countdown = useCountdownToMidnight()

  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Load counts from model user endpoint
        const data = await userService.getModelUser()
        setTryOnCount(data.todayImageGeneratedCount || 0)
        setModelCount(data.todayModelPictureCreatedCount || 0)
        setItemCount(data.todayItemGeneratedCount || 0)
        
        // Load limits from user profile
        const profileData = await userService.getUserProfileFromBackend()
        setTryOnLimit(profileData.maxImageGeneratePerDay || 40)
        setItemLimit(profileData.maxItemGeneratePerDay || 10)
        setModelLimit(profileData.maxModelCreatePerDay || 20)
      } catch (err) {
        //console.error('Failed to load model user counts:', err)
      }
    }

    loadCounts()
  }, [])

  if (!user) {
    return null
  }

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    setOpen(false)

    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }
  }

  const handleUserLogout = async () => {
    await logout()
    router.push('/vi/landing')
    showSuccessToast('Đăng xuất thành công')
  }

  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
  const displayName = user?.displayName || user?.fullName || user?.email || ''
  const defaultAvatarUrl = '/images/avatars/1.png'
  
  // Get avatar URL with fallback to default
  const avatarUrl = user?.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${storageUrl}${user.avatar}`)
    : defaultAvatarUrl

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
          alt={user?.fullName || user?.displayName || user?.email || ''}
          src={avatarUrl}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-50'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Avatar 
                      alt={user?.fullName || user?.displayName || user?.email || ''} 
                      src={avatarUrl}
                    />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {displayName}
                      </Typography>
                      <Typography variant='caption'>{user?.email || ''}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  {/* Stats - chỉ hiển thị cho USER role */}
                  {/* Ở horizontal layout: hiển thị cho cả mobile và desktop */}
                  {/* Ở vertical layout: chỉ hiển thị trên mobile */}
                  {user?.role === USER_ROLE.USER && (
                    <Box className={`flex ${layout === 'horizontal' ? '' : 'md:hidden'} flex-col gap-1 px-4 py-2`}>
                      {/* First row: Try-on and Item counts */}
                      <Box display='flex' gap={1} flexWrap='wrap'>
                        <Chip
                          size='small'
                          icon={<i className='tabler-bolt' />}
                          label={`Try-on ${tryOnCount}/${tryOnLimit}`}
                          variant='outlined'
                        />
                        <Chip
                          size='small'
                          icon={<i className='tabler-bolt' />}
                          label={`Item ${itemCount}/${itemLimit}`}
                          variant='outlined'
                        />
                        <Chip
                          size='small'
                          icon={<i className='tabler-user' />}
                          label={`Model ${modelCount}/${modelLimit}`}
                          variant='outlined'
                        />
                      </Box>
                      {/* Second row: Countdown and Weather */}
                      <Box display='flex' gap={1} flexWrap='wrap'>
                        <Chip
                          size='small'
                          icon={<Clock size={14} />}
                          label={countdown.formattedString}
                          variant='outlined'
                        />
                        <WeatherWidget />
                      </Box>
                    </Box>
                  )}
                  {user?.role === USER_ROLE.USER && <Divider className='mlb-1' />}
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, `/${lang}/profile`)}>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>{t('profile.viewProfile') || 'View Profile'}</Typography>
                  </MenuItem>
                  <Divider className='mlb-1' />
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
