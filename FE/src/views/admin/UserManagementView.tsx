'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import TextField from '@mui/material/TextField'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { useTheme } from '@mui/material/styles'
import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { adminService } from '@/services/admin.service'
import type { AdminUser } from '@/types/admin.type'
import { USER_ROLE } from '@/@core/constants/global.const'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

const UserManagementView: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { isAdmin, user } = useAdminAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (user?.accessToken && isAdmin) {
      loadUsers()
    }
  }, [user, isAdmin])

  const loadUsers = async () => {
    if (!user?.accessToken) return

    setLoading(true)
    setError(null)

    try {
      const usersData = await adminService.getAllUsers()
      setUsers(usersData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('admin.userManagement.errors.loadUsers') || 'Failed to load users'

      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (newRole: number) => {
    if (!user?.accessToken || !selectedUser) return

    setUpdatingRole(true)

    try {
      await adminService.updateUserRole(selectedUser.id, newRole)

      setUsers(users.map(u => (u.id === selectedUser.id ? { ...u, role: newRole } : u)))

      setShowRoleModal(false)
      setSelectedUser(null)
      showSuccessToast(t('admin.userManagement.roleModal.updateSuccess') || 'User role updated successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('admin.userManagement.roleModal.updateError') || 'Failed to update user role'

      showErrorToast(errorMessage)
    } finally {
      setUpdatingRole(false)
    }
  }

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          {t('admin.userManagement.errors.accessDenied') || 'Access denied. Admin privileges required.'}
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            {t('admin.userManagement.loading') || 'Loading users...'}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
          color: 'white',
          py: 4,
          px: { xs: 2, md: 4 },
          mb: 4
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="tabler-users" style={{ fontSize: '32px' }} />
              </Box>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {t('admin.userManagement.title') || 'User Management'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('admin.userManagement.subtitle') || 'Manage user accounts and roles'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={loadUsers}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
              startIcon={<i className="tabler-refresh" />}
            >
              {t('admin.userManagement.refresh') || 'Refresh'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, pb: 4 }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {t('admin.userManagement.errors.title') || 'Error'}
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Users Table */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {t('admin.userManagement.table.title') || 'All Users'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredUsers.length} {t('admin.userManagement.table.totalUsers') || 'total users'}
                </Typography>
              </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField
                placeholder={t('admin.userManagement.filters.search') || 'Search by name or email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ minWidth: 250, flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: <i className="tabler-search" style={{ marginRight: '8px' }} />
                  }
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('admin.userManagement.filters.role') || 'Filter by Role'}</InputLabel>
                <Select
                  value={roleFilter}
                  label={t('admin.userManagement.filters.role') || 'Filter by Role'}
                  onChange={(e) => setRoleFilter(e.target.value as number | 'all')}
                >
                  <MenuItem value="all">{t('admin.userManagement.filters.allRoles') || 'All Roles'}</MenuItem>
                  <MenuItem value={USER_ROLE.ADMIN}>{t('admin.userManagement.filters.admin') || 'Admin'}</MenuItem>
                  <MenuItem value={USER_ROLE.USER}>{t('admin.userManagement.filters.user') || 'User'}</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
                }}
                startIcon={<i className="tabler-x" />}
              >
                {t('admin.userManagement.filters.reset') || 'Reset'}
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.id') || 'ID'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.name') || 'Name'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.email') || 'Email'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.role') || 'Role'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.created') || 'Created'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('admin.userManagement.table.actions') || 'Actions'}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {user.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{user.displayName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role === USER_ROLE.ADMIN ? t('admin.userManagement.table.admin') || 'Admin' : t('admin.userManagement.table.user') || 'User'}
                        color={user.role === USER_ROLE.ADMIN ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => openRoleModal(user)}
                        startIcon={<i className="tabler-edit" />}
                      >
                        {t('admin.userManagement.table.editRole') || 'Edit Role'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsers.length === 0 && !loading && (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery || roleFilter !== 'all'
                  ? t('admin.userManagement.table.noResults') || 'No users match your filters'
                  : t('admin.userManagement.table.noUsers') || 'No users found'}
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('admin.userManagement.pagination.showing') || 'Showing'} {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} {t('admin.userManagement.pagination.of') || 'of'}{' '}
                {filteredUsers.length} {t('admin.userManagement.pagination.users') || 'users'}
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Card>
      </Box>

      {/* Update Role Modal */}
      <Dialog
        open={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setSelectedUser(null)
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle>
          {t('admin.userManagement.roleModal.title') || 'Update User Role'}
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedUser.displayName} ({selectedUser.email})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Button
              fullWidth
              variant={selectedUser?.role === USER_ROLE.USER ? 'contained' : 'outlined'}
              onClick={() => handleUpdateRole(USER_ROLE.USER)}
              disabled={updatingRole}
              startIcon={<i className="tabler-users" />}
              sx={{ py: 1.5 }}
            >
              {t('admin.userManagement.roleModal.userRole') || 'User (Role 3)'}
            </Button>
            <Button
              fullWidth
              variant={selectedUser?.role === USER_ROLE.ADMIN ? 'contained' : 'outlined'}
              onClick={() => handleUpdateRole(USER_ROLE.ADMIN)}
              disabled={updatingRole}
              startIcon={<i className="tabler-shield" />}
              sx={{ py: 1.5 }}
            >
              {t('admin.userManagement.roleModal.adminRole') || 'Admin (Role 1)'}
            </Button>
          </Box>
          <Alert severity="warning" sx={{ mt: 3 }}>
            {t('admin.userManagement.roleModal.warning') || 'Changing user role will affect their access permissions'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRoleModal(false)
              setSelectedUser(null)
            }}
            disabled={updatingRole}
          >
            {t('admin.userManagement.roleModal.cancel') || 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserManagementView

