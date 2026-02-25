import { useEffect, useState } from 'react'
import { Card, CardHeader, Chip } from '@mui/material/'
import { format } from 'date-fns'
import { CustomTable } from '@/@core/components/custom-table'
import { TABLE_USER_CONFIG } from '@/configs/table.config'
import type { ICheckedList, ITableData, ITableItem } from '@/types/table.type'
import type { BaseQueryRequest, IBaseResponseRecord } from '@/types'
import ConfirmDialog from '@/@core/components/dialogs/comfirm-dialog'
import { ClientApi } from '@/services/client-api.service'
import type { IAccount } from '@/types/auth.type'
import OptionMenu from '@/@core/components/option-menu'
import { showSuccessToast } from '@/services/toast.service'

const TableUser = () => {
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; isActive: boolean } | null>(null)
  const [totalItem, setTotalItem] = useState(0)

  const [tableData, setTableData] = useState<ITableData>({
    data: [],
    totalItem: 0,
    pageIndex: 1,
    pageSize: 10
  })

  const fetchUsers = async (params: BaseQueryRequest = {}) => {
    ;(await ClientApi.post<IBaseResponseRecord<IAccount>>('/api/auth/get-all', params)).onSuccess(res => {
      //console.log(res)

      setTableData({
        data: res.records || [],
        totalItem: res.total,
        pageIndex: res.page,
        pageSize: res.size
      })
      setTotalItem(res.total)
    })

    setLoading(false)
  }

  const handleCheckedChange = (checked: ICheckedList) => {
    //console.log('🚀 ~ handleCheckedChange ~ checked:', checked)
  }

  const handleRowClick = (row: ITableItem) => {
    //console.log('🚀 ~ handleRowClick ~ row:', row)
  }

  const handleChangeStatus = async (id: string, status: boolean) => {
    ;(await ClientApi.post('/api/users/change-status', { id, status })).onSuccess(() => {
      showSuccessToast('Cập nhật trạng thái thành công')
      fetchUsers()
    })
  }

  const handleStatusClick = (row: ITableItem) => {
    setSelectedUser({
      id: row.id,
      isActive: row.isActive
    })
    setIsOpen(true)
  }

  const status = (row: ITableItem) => {
    return (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        color={row.isActive ? 'success' : 'error'}
        onClick={() => handleStatusClick(row)}
        sx={{ cursor: 'pointer' }}
      />
    )
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <Card className='p-4'>
      <CardHeader title='Danh sách người dùng' subheader={`Tổng số người dùng đăng ký: ${totalItem}`} />
      <CustomTable
        tableConfig={TABLE_USER_CONFIG}
        {...tableData}
        showCheckbox={true}
        isLoading={loading}
        onSearch={fetchUsers}
        onCheckedChange={handleCheckedChange}
        searchOptions={{
          showSearch: true,
          placeholder: 'Search users',
          debounceTime: 500,
          searchWithButton: {
            searchButtonText: 'Search',
            variant: 'contained',
            color: 'primary'
          }
        }}
        onRowClick={handleRowClick}
        customRow={{
          isActive: (row: ITableItem) => status(row),
          createdAt: (row: ITableItem) => (
            <span className='text-warning'>{format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm')}</span>
          ),
          email: (row: ITableItem) => <span className='text-warning'>{row.email}</span>,
          action: (row: ITableItem) => (
            <OptionMenu
              options={[
                {
                  text: 'Xem chi tiết',
                  icon: <i className='tabler-eye' />,
                  menuItemProps: { onClick: () => alert('Xem chi tiết: ' + row.id) }
                },
                { divider: true },
                {
                  text: 'Xoá',
                  icon: <i className='tabler-trash' />,
                  menuItemProps: { onClick: () => alert('Xoá: ' + row.id), sx: { color: 'error.main' } }
                }
              ]}
              iconButtonProps={{ size: 'small', sx: { p: 0.5 } }}
            />
          )
        }}
      />

      <ConfirmDialog
        open={isOpen}
        setOpen={setIsOpen}
        title='Xác nhận thay đổi trạng thái'
        description={`Bạn có chắc chắn muốn ${!selectedUser?.isActive ? 'kích hoạt' : 'vô hiệu hóa'} người dùng này?`}
        confirmLabel='Xác nhận'
        rejectLabel='Hủy'
        onConfirm={() => selectedUser && handleChangeStatus(selectedUser.id, !selectedUser.isActive)}
      />
    </Card>
  )
}

export default TableUser
