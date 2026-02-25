'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import * as signalR from '@microsoft/signalr'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Popover from '@mui/material/Popover'
import Divider from '@mui/material/Divider'

import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { userService } from '@/services/user.service'
import { showErrorToast } from '@/services/toast.service'
import { useCountdownToMidnight } from '../../../views/try-on/hooks/useCountdownToMidnight'
import { ClientApi } from '@/services/client-api.service'
import { USER_ROLE } from '@/@core/constants/global.const'
import { set } from 'date-fns'

type NotificationType = 'success' | 'warning' | 'info' | 'default'

type NotificationItem = {
  id: number
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt?: string
}

type CountUpdatePayload = {
  count: number
  timestamp?: string
}

type CountDailyLimitUpdatePayload = {
 maxImageGenerated: number
 maxItemGenerated: number
 maxModelGenerated: number
 timestamp?: string
}

const toWsUrl = (httpUrl?: string | null) => {
  if (!httpUrl) return null

  try {
    const url = new URL(httpUrl)

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${url.origin}/hubs/notifications`
  } catch (error) {
    //console.error('Invalid API URL for SignalR:', error)
    return null
  }
}

const iconMap: Record<NotificationType, string> = {
  success: 'tabler-check',
  warning: 'tabler-alert-triangle',
  info: 'tabler-info-circle',
  default: 'tabler-bell'
}

// Helper function to format notification message with translation
const formatNotificationMessage = (message: string | object, t: any, lang: string): string => {
  
  try {
    let parsed: any
    
    // Handle both string and object formats
    if (typeof message === 'string') {
      // Check if string looks like JSON (starts with { or [)
      const trimmed = message.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          parsed = JSON.parse(message)
          // console.log('[FORMAT] Parsed message:', parsed)
        } catch {
          // Not valid JSON, return as-is
          // console.log('[FORMAT] Not valid JSON, returning plain string:', message)
          return message
        }
      } else {
        // Plain string, return as-is
        // console.log('[FORMAT] Plain string, returning as-is:', message)
        return message
      }
    } else if (typeof message === 'object' && message !== null) {
      parsed = message
      // console.log('[FORMAT] Direct object:', parsed)
    } else {
      return String(message)
    }
    
    // Check if it has data.en/data.vn structure (GLOBAL NOTIFICATIONS)
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
      // console.log('[FORMAT] Checking data object:', parsed.data)
      if (parsed.data.en || parsed.data.vn) {
        const isVietnamese = lang === 'vi' || lang === 'vn'
        const result = isVietnamese ? (parsed.data.vn || parsed.data.en || '') : (parsed.data.en || parsed.data.vn || '')
        // console.log('[FORMAT] Global notification - lang:', lang, 'returning:', result)
        return result
      }
    }
    
    // Check if it's a global notification with en/vn attributes at root level
    if (parsed && typeof parsed === 'object' && (parsed.en || parsed.vn)) {
      const isVietnamese = lang === 'vi' || lang === 'vn'
      const result = isVietnamese ? (parsed.vn || parsed.en || '') : (parsed.en || parsed.vn || '')
      // console.log('[FORMAT] Root level en/vn - lang:', lang, 'returning:', result)
      return result
    }
    
    // Check if it has the expected notification structure (TEMPLATE-BASED)
    if (parsed && typeof parsed === 'object' && parsed.type && parsed.data) {
      // Get translation key for the notification type
      const translationKey = `notifications.${parsed.type}`
      
      const template = t(translationKey)
      
      // If translation exists (doesn't start with the key itself), replace variables
      if (template && !template.startsWith('notifications.')) {
        let formatted = template
        
        // Replace all variables in format {variableName}
        Object.entries(parsed.data).forEach(([key, value]) => {
          formatted = formatted.replace(`{${key}}`, String(value))
        })
        
        return formatted
      } else {
        //console.warn(`[FORMAT] Translation not found for type: ${parsed.type}, template:`, template)
      }
    }
  } catch (error) {
   // console.error('[FORMAT] Parse error:', error)
  }
  
  // Fallback: return original message if not JSON or translation not found
  const fallback = typeof message === 'string' ? message : JSON.stringify(message)
  return fallback
}

const RealtimeHeaderWidgets = () => {
  const { isAuthenticated, user } = useAuth()
  const { t, lang } = useTranslation()
  const [tryOnCount, setTryOnCount] = useState(0)
  const [modelCount, setModelCount] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [tryOnLimit, setTryOnLimit] = useState(40)
  const [itemLimit, setItemLimit] = useState(10)
  const [modelLimit, setModelLimit] = useState(20)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const countdown = useCountdownToMidnight()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const hubUrl = useMemo(() => toWsUrl(apiUrl), [apiUrl])

  // Fetch initial counters and limits from user profile
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) return

      try {
        // Load counts from model user endpoint
        const modelData = await userService.getModelUser()
        setTryOnCount(modelData.todayImageGeneratedCount || 0)
        setModelCount(modelData.todayModelPictureCreatedCount || 0)
        setItemCount(modelData.todayItemGeneratedCount || 0)
        // Load limits from user profile
        const profileData = await userService.getUserProfileFromBackend()
        setTryOnLimit(profileData.maxImageGeneratePerDay || 40)
        setItemLimit(profileData.maxItemGeneratePerDay || 10)
        setModelLimit(profileData.maxModelCreatePerDay || 20)
      } catch (error) {
       // console.error('Failed to load user data:', error)
      }
    }

    loadUserData()
  }, [isAuthenticated])

  // SignalR connection
  useEffect(() => {
    if (!isAuthenticated) return

    if (!hubUrl) {
      //console.warn('Missing SignalR hub url (NEXT_PUBLIC_API_URL)')
      return
    }

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

    if (!accessToken) return

    let cancelled = false

    const startConnection = async () => {
      setIsConnecting(true)

      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            withCredentials: false
          })
          .withAutomaticReconnect([0, 0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Information)
          .build()

        connection.onclose(() => setConnected(false))
        connection.onreconnecting(() => setConnected(false))
        connection.onreconnected(() => setConnected(true))

        connection.on('ReceiveNotification', (payload: any) => {
          //console.log('[SignalR] ReceiveNotification payload:', payload)
          //console.log('[SignalR] payload.content:', payload?.content)
          
          const newNotif: NotificationItem = {
            id: Date.now(),
            title: payload?.type || 'Notification',
            message: payload?.content || '',
            type: (payload?.type?.toLowerCase() as NotificationType) || 'info',
            read: false,
            createdAt: payload?.createdAt
          }

          setNotifications(prev => [newNotif, ...prev].slice(0, 50))
        })

        connection.on('ReceiveImageGenerationCountUpdate', (data: CountUpdatePayload) => {
          setTryOnCount(data?.count ?? 0)
        })

        connection.on('ReceiveModelPictureCountUpdate', (data: CountUpdatePayload) => {
          setModelCount(data?.count ?? 0)
        })

        connection.on('ReceiveItemGenerationCountUpdate', (data: CountUpdatePayload) => {
         // console.log('📦 ReceiveItemGenerationCountUpdate:', data)
          setItemCount(data?.count ?? 0)
        })

        connection.on('ReceiveDailyLimitCountUpdate', (data: CountDailyLimitUpdatePayload) => {
          // console.log('🔔 receiveDailyLimitCountUpdate received:', data)
          // console.log('📊 New limits:', {
          //   tryOn: data?.maxImageGenerated ?? 20,
          //   item: data?.maxItemGenerated ?? 10,
          //   model: data?.maxModelGenerated ?? 15
          // })
          setTryOnLimit(data?.maxImageGenerated ?? 20)
          setItemLimit(data?.maxItemGenerated ?? 10)
          setModelLimit(data?.maxModelGenerated ?? 15)
        })

        // Log all registered event handlers
        // console.log('✅ SignalR event handlers registered:', {
        //   handlers: [
        //     'ReceiveNotification',
        //     'ReceiveImageGenerationCountUpdate', 
        //     'ReceiveModelPictureCountUpdate',
        //     'ReceiveItemGenerationCountUpdate',
        //     'ReceiveDailyLimitCountUpdate'
        //   ]
        // })

        await connection.start()
        //console.log('🚀 SignalR connection started successfully')

        if (cancelled) {
          connection.stop()
          return
        }

        connectionRef.current = connection
        setConnected(true)
      } catch (error) {
       // console.error('SignalR connection error:', error)
        showErrorToast('Không thể kết nối realtime, vui lòng thử lại sau.')
        setConnected(false)
      } finally {
        if (!cancelled) setIsConnecting(false)
      }
    }

    startConnection()

    return () => {
      cancelled = true

      if (connectionRef.current) {
        connectionRef.current.stop()
      }
    }
  }, [hubUrl, isAuthenticated])

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchInitialNotifications = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const res = await ClientApi.get<any[]>('/notification?limit=1000&unreadOnly=false', undefined, false)
      const raw = res.getRaw()
      const payload = raw?.data

      const list = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.data) ? (payload as any).data : []

      const mapped: NotificationItem[] = list.map((item: any) => {
        const id = item.id ?? item.notificationId ?? Date.now()
        const type = (item.type || 'info').toLowerCase()

        //console.log('[API] Notification item:', item)
        //console.log('[API] item.content:', item.content)

        return {
          id,
          title: item.title || item.type || 'Notification',
          message: item.content || item.message || '',
          type: type as NotificationType,
          read: item.isRead ?? false,
          createdAt: item.createdAt
        }
      })

      setNotifications(prev => {
        const existing = new Set(prev.map(n => n.id))
        const merged = [...mapped.filter(n => !existing.has(n.id)), ...prev]

        return merged.slice(0, 50)
      })
    } catch (error) {
      //console.error('Failed to load initial notifications:', error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchInitialNotifications()
  }, [fetchInitialNotifications])

  const markRead = async (id: number, remove = false) => {
    try {
      await ClientApi.patch(`/notification/${id}/read`)
    } catch (error) {
      //console.error('Failed to mark read:', error)
    } finally {
      
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await ClientApi.patch('/notification/read-all')
    } catch (error) {
      //console.error('Failed to mark all as read:', error)
    } finally {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const handleRemove = async (id: number) => {
    await markRead(id, true)
  }

  const handleNotificationClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(prev => (prev ? null : event.currentTarget))
  }

  const open = Boolean(anchorEl)

  // Chỉ hiển thị cho USER role, không hiển thị cho ADMIN
  if (!isAuthenticated || user?.role !== USER_ROLE.USER) return null

  return (
    <Box display='flex' alignItems='center' gap={1.5}>
      <Box display={{ xs: 'none', md: 'flex' }} gap={1}>
        <Paper
          variant='outlined'
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper'
          }}
        >
          <Chip
            size='small'
            icon={<i className='tabler-bolt' />}
            label={
              <Typography variant='caption' fontWeight={600}>
                Item {itemCount}/{itemLimit}
              </Typography>
            }
            sx={{ pl: 0.5, pr: 1, height: 28, borderRadius: 2, fontWeight: 700 }}
          />
          <Chip
            size='small'
            icon={<i className='tabler-bolt' />}
            label={
              <Typography variant='caption' fontWeight={600}>
                Try-on {tryOnCount}/{tryOnLimit}
              </Typography>
            }
            sx={{ pl: 0.5, pr: 1, height: 28, borderRadius: 2, fontWeight: 700 }}
          />
          <Chip
            size='small'
            icon={<i className='tabler-user' />}
            label={
              <Typography variant='caption' fontWeight={600}>
                Model {modelCount}/{modelLimit}
              </Typography>
            }
            sx={{ pl: 0.5, pr: 1, height: 28, borderRadius: 2, fontWeight: 700 }}
          />
          <Chip
            size='small'
            icon={<i className='tabler-clock' />}
            label={
              <Typography variant='caption' fontWeight={600}>
                {countdown.formattedString}
              </Typography>
            }
            sx={{
              pl: 0.5,
              pr: 1,
              height: 28,
              borderRadius: 2,
              fontWeight: 700,
              borderColor: 'primary.main',
              color: 'primary.main',
              '& .tabler-clock': { color: 'primary.main' },
              opacity: connected ? 1 : 0.6
            }}
            color='primary'
            variant='outlined'
          />
        </Paper>
      </Box>

      <Tooltip title='Thông báo'>
        <IconButton color='inherit' onClick={handleNotificationClick} sx={{ position: 'relative' }}>
          <Badge badgeContent={unreadCount} color='error'>
            <i className='tabler-bell' />
          </Badge>
          {isConnecting && (
            <CircularProgress size={18} sx={{ position: 'absolute', inset: 0, m: 'auto', opacity: 0.6 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{ sx: { width: 340, maxHeight: 480 } }}
      >
        <Box px={2} py={1.5} display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='subtitle1' fontWeight={700}>
            Notifcation
          </Typography>
          <Box display='flex' alignItems='center' gap={1}>
            <Button size='small' onClick={handleMarkAllRead} disabled={!notifications.length}>
              Đọc tất cả
            </Button>
            <IconButton size='small' onClick={() => setAnchorEl(null)}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box px={2} py={3} textAlign='center' color='text.secondary'>
              <i className='tabler-bell-ringing' />
              <Typography variant='body2'>Chưa có thông báo</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {notifications.map(item => (
                <ListItem
                  key={item.id}
                  alignItems='flex-start'
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    bgcolor: item.read ? 'transparent' : 'action.hover',
                    position: 'relative',
                    borderBottom: theme => `1px solid ${theme.palette.divider}`,
                    '&:last-of-type': { borderBottom: 'none' },
                    '& .MuiListItemSecondaryAction-root': {
                      top: 6,
                      right: 6,
                      transform: 'none'
                    }
                  }}
                  // onClick={() => markRead(item.id, true)}
                  // secondaryAction={
                  //   <IconButton
                  //     edge='end'
                  //     size='small'
                  //     onClick={e => {
                  //       e.stopPropagation()
                  //       handleRemove(item.id)
                  //     }}
                  //     sx={{ mt: 0 }}
                  //   >
                  //     <i className='tabler-x' />
                  //   </IconButton>
                  // }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          item.type === 'success'
                            ? 'success.main'
                            : item.type === 'warning'
                              ? 'warning.main'
                              : item.type === 'info'
                                ? 'info.main'
                                : 'primary.main'
                      }}
                    >
                      <i className={iconMap[item.type] ?? iconMap.default} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography component='div' fontWeight={600} color='text.primary' variant='body2' pr={5}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Box component='div'>
                        <Typography component='div' variant='body2' color='text.secondary'>
                          {(() => {
                            // console.log('[RENDER] item.message before format:', item.message)
                            const formatted = formatNotificationMessage(item.message, t, lang)
                            // console.log('[RENDER] formatted result:', formatted)
                            return formatted
                          })()}
                        </Typography>
                        <Typography component='div' variant='caption' color='text.disabled'>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Vừa xong'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </Box>
  )
}

export default RealtimeHeaderWidgets
