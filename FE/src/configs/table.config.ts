import type { ITableConfig } from '@/types/table.type'

export const TABLE_DEMO_CONFIG: ITableConfig[] = [
  { title: 'table.header.username', key: 'username', width: '150px', sort: true },
  { title: 'table.header.email', key: 'email', width: '100px', sort: true },
  { title: 'table.header.phone', key: 'phone', width: '100px', sort: true },
  { title: 'table.header.status', key: 'status', width: '100px', sort: true },
  { title: 'table.header.action', key: 'action', width: '100px', sort: true }
]

export const TABLE_USER_CONFIG: ITableConfig[] = [
  { title: 'Họ tên', key: 'fullName', width: '150px', sort: true },
  { title: 'Email', key: 'email', width: '100px', sort: true },
  { title: 'Ngày gia nhập', key: 'createdAt', width: '100px', sort: true },
  { title: 'Trạng thái', key: 'isActive', width: '100px', sort: true },
  { title: 'Hành động', key: 'action', width: '100px' }
]

export const TABLE_FEEDBACK_CONFIG: ITableConfig[] = [
  { title: 'Người gửi', key: 'user', width: '150px', sort: true },
  { title: 'Phản hồi', key: 'feedback', width: '150px', sort: true },
  { title: 'Trạng thái', key: 'isActive', width: '100px', sort: true },
  { title: 'Ngày gửi', key: 'createdAt', width: '100px', sort: true },
  { title: 'Hành động', key: 'action', width: '100px' }
]
