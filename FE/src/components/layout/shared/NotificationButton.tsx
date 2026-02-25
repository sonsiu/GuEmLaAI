'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import * as signalR from '@microsoft/signalr'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
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
import { showErrorToast } from '@/services/toast.service'
import { ClientApi } from '@/services/client-api.service'
import { USER_ROLE } from '@/@core/constants/global.const'

type NotificationType = 'success' | 'warning' | 'info' | 'default'

type NotificationItem = {
  id: number
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt?: string
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

const NotificationButton = () => {
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const hubUrl = useMemo(() => toWsUrl(apiUrl), [apiUrl])

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

        await connection.start()

        if (cancelled) {
          connection.stop()
          return
        }

        connectionRef.current = connection
        setConnected(true)
      } catch (error) {
      //  console.error('SignalR connection error:', error)
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
    //  console.error('Failed to mark read:', error)
    } finally {
      setNotifications(prev =>
        remove ? prev.filter(n => n.id !== id) : prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
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
    <>
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
            Thông báo
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
              {notifications.flatMap((item, index) => [
                <ListItem
                  key={item.id}
                  alignItems='flex-start'
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    bgcolor: item.read ? 'transparent' : 'action.hover',
                    position: 'relative',
                    '& .MuiListItemSecondaryAction-root': {
                      top: 6,
                      right: 6,
                      transform: 'none',
                      mt: 0
                    }
                  }}
                  onClick={() => markRead(item.id, true)}
                  secondaryAction={
                    <IconButton
                      edge='end'
                      size='small'
                      onClick={e => {
                        e.stopPropagation()
                        handleRemove(item.id)
                      }}
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  }
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
                          {item.message}
                        </Typography>
                        <Typography component='div' variant='caption' color='text.disabled'>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Vừa xong'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>,
                ...(index < notifications.length - 1
                  ? [<Divider key={`divider-${item.id}`} component='li' sx={{ mx: 2 }} />]
                  : [])
              ])}
            </List>
          )}
        </Box>
      </Popover>
    </>
  )
}

export default NotificationButton
