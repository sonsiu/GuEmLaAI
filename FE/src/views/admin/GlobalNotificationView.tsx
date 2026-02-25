'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { notificationService } from '@/services/notification.service'
import type { GlobalNotification, SendGlobalNotificationRequest } from '@/types/notification.type'
import { NotificationType } from '@/types/notification.type'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

const GlobalNotificationView: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { isAdmin, user } = useAdminAuth()

  // State
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState<SendGlobalNotificationRequest>({
    en: '',
    vn: '',
    type: NotificationType.SYSTEM
  })

  // Character count validation
  const MAX_CHARACTERS = 100

  const countCharacters = (text: string): number => {
    return text.length
  }

  const enCharCount = countCharacters(formData.en || '')
  const vnCharCount = countCharacters(formData.vn || '')
  const enExceedsLimit = enCharCount > MAX_CHARACTERS
  const vnExceedsLimit = vnCharCount > MAX_CHARACTERS

  useEffect(() => {
    if (user?.accessToken && isAdmin) {
      loadNotifications()
    }
  }, [user, isAdmin])

  const loadNotifications = async () => {
    if (!user?.accessToken) return

    setLoading(true)
    setError(null)

    try {
      const data = await notificationService.getGlobalNotifications(false, 100)
      setNotifications(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async () => {
    if (!user?.accessToken) return

    if (!formData.en?.trim() && !formData.vn?.trim()) {
      showErrorToast(t('admin.globalNotifications.messages.requireContent'))
      return
    }

    if (enExceedsLimit || vnExceedsLimit) {
      showErrorToast(t('admin.globalNotifications.messages.exceedsLimit', { max: MAX_CHARACTERS }))
      return
    }

    setCreateLoading(true)

    try {
      await notificationService.sendGlobalNotification(formData)
      setFormData({ en: '', vn: '', type: NotificationType.SYSTEM })
      setShowCreateModal(false)
      showSuccessToast(t('admin.globalNotifications.messages.createSuccess'))
      await loadNotifications()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notification'
      showErrorToast(errorMessage)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    if (!user?.accessToken) return

    try {
      const newStatus = !currentStatus
      await notificationService.setGlobalNotificationStatus(id, newStatus)
      setNotifications(
        notifications.map(n =>
          n.id === id ? { ...n, isRead: newStatus } : n
        )
      )
      showSuccessToast(newStatus ? t('admin.globalNotifications.messages.deactivatedSuccess') : t('admin.globalNotifications.messages.activatedSuccess'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification'
      showErrorToast(errorMessage)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    if (!user?.accessToken) return

    if (!window.confirm(t('admin.globalNotifications.messages.deleteConfirm'))) {
      return
    }

    try {
      await notificationService.deleteGlobalNotification(id)
      setNotifications(notifications.filter(n => n.id !== id))
      showSuccessToast(t('admin.globalNotifications.messages.deleteSuccess'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification'
      showErrorToast(errorMessage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseNotificationContent = (content: string) => {
    try {
      const parsed = JSON.parse(content)
      return {
        en: parsed.en || parsed.data?.en || '',
        vn: parsed.vn || parsed.data?.vn || ''
      }
    } catch {
      return { en: content, vn: '' }
    }
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{t('admin.globalNotifications.errors.accessDenied')}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {t('admin.globalNotifications.title')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowCreateModal(true)}
        >
          {t('admin.globalNotifications.createButton')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography color="textSecondary" sx={{ textAlign: 'center', p: 3 }}>
              {t('admin.globalNotifications.empty')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
                    <TableCell>{t('admin.globalNotifications.table.content')}</TableCell>
                    <TableCell>{t('admin.globalNotifications.table.type')}</TableCell>
                    <TableCell>{t('admin.globalNotifications.table.status')}</TableCell>
                    <TableCell>{t('admin.globalNotifications.table.created')}</TableCell>
                    <TableCell align="right">{t('admin.globalNotifications.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map(notification => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {(() => {
                            const content = parseNotificationContent(notification.content)
                            return (
                              <>
                                {content.en && (
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Chip
                                      label="EN"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 600,
                                        minWidth: '40px',
                                        height: '22px'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ maxWidth: 280, wordBreak: 'break-word', flex: 1 }}>
                                      {content.en}
                                    </Typography>
                                  </Box>
                                )}
                                {content.vn && (
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Chip
                                      label="VN"
                                      size="small"
                                      sx={{
                                        backgroundColor: 'warning.main',
                                        color: theme.palette.mode === 'dark' ? 'black' : 'white',
                                        fontWeight: 600,
                                        minWidth: '40px',
                                        height: '22px'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ maxWidth: 280, wordBreak: 'break-word', flex: 1 }}>
                                      {content.vn}
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.type as string}
                          size="small"
                          color={notification.type === NotificationType.SYSTEM ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.isRead ? t('admin.globalNotifications.status.inactive') : t('admin.globalNotifications.status.active')}
                          size="small"
                          color={notification.isRead ? 'default' : 'success'}
                          variant={notification.isRead ? 'outlined' : 'filled'}
                          onClick={() => handleToggleActive(notification.id, notification.isRead)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <i className='tabler-trash' style={{ fontSize: '18px' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.globalNotifications.modal.title')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('admin.globalNotifications.modal.englishLabel')}
              multiline
              rows={4}
              fullWidth
              value={formData.en}
              onChange={e => setFormData({ ...formData, en: e.target.value })}
              placeholder={t('admin.globalNotifications.modal.englishPlaceholder')}
              variant="outlined"
              error={enExceedsLimit}
              helperText={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{enExceedsLimit ? t('admin.globalNotifications.modal.exceedsLimit', { count: enCharCount - MAX_CHARACTERS }) : t('admin.globalNotifications.modal.maxCharacters')}</span>
                  <span style={{ color: enExceedsLimit ? theme.palette.error.main : 'inherit' }}>
                    {enCharCount}/{MAX_CHARACTERS}
                  </span>
                </Box>
              }
            />
            <TextField
              label={t('admin.globalNotifications.modal.vietnameseLabel')}
              multiline
              rows={4}
              fullWidth
              value={formData.vn}
              onChange={e => setFormData({ ...formData, vn: e.target.value })}
              placeholder={t('admin.globalNotifications.modal.vietnamesePlaceholder')}
              variant="outlined"
              error={vnExceedsLimit}
              helperText={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{vnExceedsLimit ? t('admin.globalNotifications.modal.exceedsLimit', { count: vnCharCount - MAX_CHARACTERS }) : t('admin.globalNotifications.modal.maxCharacters')}</span>
                  <span style={{ color: vnExceedsLimit ? theme.palette.error.main : 'inherit' }}>
                    {vnCharCount}/{MAX_CHARACTERS}
                  </span>
                </Box>
              }
            />
            <FormControl fullWidth>
              <InputLabel>{t('admin.globalNotifications.modal.typeLabel')}</InputLabel>
              <Select
                value={formData.type || NotificationType.SYSTEM}
                onChange={e => setFormData({ ...formData, type: e.target.value as NotificationType })}
                label="Type"
              >
                {Object.keys(NotificationType)
                  .filter(key => isNaN(Number(key)))
                  .map((key, index) => (
                    <MenuItem key={`${key}-${index}`} value={NotificationType[key as keyof typeof NotificationType]}>
                      {key}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>{t('admin.globalNotifications.modal.cancel')}</Button>
          <Button
            onClick={handleCreateNotification}
            variant="contained"
            disabled={createLoading || (!formData.en?.trim() && !formData.vn?.trim()) || enExceedsLimit || vnExceedsLimit}
          >
            {createLoading ? <CircularProgress size={24} /> : t('admin.globalNotifications.modal.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GlobalNotificationView
