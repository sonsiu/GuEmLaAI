'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'
import * as signalR from '@microsoft/signalr'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { notificationService } from '@/services/notification.service'
import type { GlobalNotification } from '@/types/notification.type'
import { NotificationType } from '@/types/notification.type'
import { showErrorToast } from '@/services/toast.service'

interface GlobalNotificationsProps {
  limit?: number
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

// Helper function to extract language-specific content
const extractNotificationContent = (content: string, lang: string): string => {
  try {
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const parsed = JSON.parse(content)
      
      // Check if it has data.en/data.vn structure
      if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
        if (parsed.data.en || parsed.data.vn) {
          const isVietnamese = lang === 'vi' || lang === 'vn'
          return isVietnamese ? (parsed.data.vn || parsed.data.en || '') : (parsed.data.en || parsed.data.vn || '')
        }
      }
      
      // Check if it has en/vn at root level
      if (parsed && typeof parsed === 'object' && (parsed.en || parsed.vn)) {
        const isVietnamese = lang === 'vi' || lang === 'vn'
        return isVietnamese ? (parsed.vn || parsed.en || '') : (parsed.en || parsed.vn || '')
      }
    }
  } catch (error) {
    // If parsing fails, return original content
  }
  
  return content
}

const GlobalNotifications: React.FC<GlobalNotificationsProps> = ({ limit = 50 }) => {
  const { isAuthenticated, user } = useAuth()
  const { lang } = useTranslation()
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const hubUrl = toWsUrl(apiUrl)

  const visibleNotifications = notifications.slice(0, 1)
  const hiddenCount = Math.max(0, notifications.length - visibleNotifications.length)

  // Setup SignalR connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !hubUrl) return

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!accessToken) return

    let cancelled = false

    const setupConnection = async () => {
      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            withCredentials: true
          })
          .withAutomaticReconnect([0, 0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Information)
          .build()

        connection.on('ReceiveGlobalNotification', (payload: any) => {
          if (!cancelled && payload) {
            if (payload.isRead) {
              // Remove notification if it becomes inactive
              setNotifications(prev => prev.filter(n => n.id !== payload.id))
            } else {
              // Add notification if it's active
              const newNotif: GlobalNotification = {
                id: payload.id,
                userId: payload.userId,
                type: payload.type,
                content: payload.content,
                isRead: payload.isRead,
                createdAt: payload.createdAt,
                category: undefined
              }
              setNotifications(prev => [newNotif, ...prev].slice(0, limit))
            }
          }
        })

        await connection.start()

        if (!cancelled) {
          connectionRef.current = connection
        }
      } catch (error) {
      //  console.error('SignalR connection error:', error)
      }
    }

    setupConnection()

    return () => {
      cancelled = true
      if (connectionRef.current) {
        connectionRef.current.stop()
      }
    }
  }, [isAuthenticated, hubUrl, limit])

  // Load initial active notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.accessToken) return

    const loadNotifications = async () => {
      try {
        const data = await notificationService.getGlobalNotifications(true, limit)
        setNotifications(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications'
        showErrorToast(errorMessage)
      }
    }

    loadNotifications()
  }, [isAuthenticated, user?.accessToken, limit])

  const getSeverity = (type: NotificationType | string | number): 'success' | 'info' | 'warning' | 'error' => {
    const typeNum = typeof type === 'number' ? type : (typeof type === 'string' ? NotificationType[type as keyof typeof NotificationType] : type)
    switch (typeNum) {
      case NotificationType.SYSTEM:
        return 'info'
      case NotificationType.WELCOME:
        return 'success'
      case NotificationType.CREDIT:
        return 'success'
      case NotificationType.REFERRAL:
        return 'success'
      case NotificationType.PAYMENT:
        return 'warning'
      case NotificationType.REMINDER:
        return 'warning'
      default:
        return 'info'
    }
  }

  const getChipColor = (type: NotificationType | string | number): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    const severity = getSeverity(type)
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      success: 'success',
      info: 'info',
      warning: 'warning',
      error: 'error'
    }
    return colorMap[severity] as any
  }

  const getTypeLabel = (type: NotificationType | string | number): string => {
    const typeNum = typeof type === 'number' ? type : (typeof type === 'string' ? NotificationType[type as keyof typeof NotificationType] : type)
    const labels: Record<number, string> = {
      [NotificationType.SYSTEM]: 'System',
      [NotificationType.WELCOME]: 'Welcome',
      [NotificationType.CREDIT]: 'Credit',
      [NotificationType.REFERRAL]: 'Referral',
      [NotificationType.PAYMENT]: 'Payment',
      [NotificationType.REMINDER]: 'Reminder'
    }
    return labels[typeNum] || 'Notification'
  }

  if (!isAuthenticated || notifications.length === 0) {
    return null
  }

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      {/* Desktop: Show full notification chips */}
      <Box
        ref={containerRef}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'row',
          gap: 0.75,
          alignItems: 'center',
          flex: 1,
          minWidth: 0
        }}
      >
        {visibleNotifications.map(notification => {
          const displayContent = extractNotificationContent(notification.content, lang)
          return (
            <Tooltip key={notification.id} title={displayContent}>
              <Chip
                label={displayContent}
                size='small'
                color={getChipColor(notification.type)}
                variant='filled'
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  minWidth: 60,
                  flex: '0 1 auto',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  },
                  animation: 'slideIn 0.3s ease-in-out',
                  '@keyframes slideIn': {
                    from: {
                      opacity: 0,
                      transform: 'scale(0.8)'
                    },
                    to: {
                      opacity: 1,
                      transform: 'scale(1)'
                    }
                  }
                }}
              />
            </Tooltip>
          )
        })}
        {hiddenCount > 0 && (
          <>
            <Tooltip title={`${hiddenCount} more notification${hiddenCount !== 1 ? 's' : ''}`}>
              <IconButton
                onClick={handlePopoverOpen}
                size='small'
                sx={{
                  height: 32,
                  width: 32,
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <Badge badgeContent={hiddenCount} color='error'>
                  <i className='tabler-mail' style={{ fontSize: '1rem' }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Mobile: Show only a compact mail icon with badge */}
      <Tooltip title={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}>
        <IconButton
          onClick={handlePopoverOpen}
          size='small'
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            height: 40,
            width: 40,
            padding: 0,
          }}
        >
          <Badge badgeContent={notifications.length} color='error' max={99} overlap='circular'>
            <Box component='i' className='tabler-mail' sx={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }} />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Popover for all notifications */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        slotProps={{
          paper: {
            sx: { zIndex: 1300 }
          }
        }}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75, maxWidth: 400 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 1, color: 'text.secondary' }}>No notifications</Box>
          ) : (
            notifications.map(notification => {
              const displayContent = extractNotificationContent(notification.content, lang)
              return (
                <Tooltip key={notification.id} title={displayContent}>
                  <Chip
                    label={displayContent}
                    size='small'
                    color={getChipColor(notification.type)}
                    variant='filled'
                    sx={{
                      fontSize: '0.75rem',
                      maxWidth: 350,
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }}
                  />
                </Tooltip>
              )
            })
          )}
        </Box>
      </Popover>
    </>
  )
}
export default GlobalNotifications
