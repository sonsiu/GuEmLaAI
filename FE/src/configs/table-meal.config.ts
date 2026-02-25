import type { ITableConfig } from '@/types/table.type'

export const TABLE_MEAL_CONFIG: ITableConfig[] = [
  { title: 'Tên thực đơn', key: 'name', width: '200px', sort: true },
  { title: 'Ghi chú', key: 'note', width: '200px' },
  { title: 'Ngày tạo', key: 'createdAt', width: '120px', sort: true },
  { title: 'Ngày cập nhật', key: 'updatedAt', width: '120px', sort: true }
]

export const TABLE_FAV_CONFIG: ITableConfig[] = [
  { title: 'Tên món ăn', key: 'dish_name', width: '200px', sort: true },
  { title: 'Nguyên liệu', key: 'ingredients', width: '120px' },
  { title: 'Dinh dưỡng', key: 'dinh_duong', width: '120px' },
  { title: 'Ngày tạo', key: 'createdAt', width: '120px', sort: true },
  { title: 'Ngày cập nhật', key: 'updatedAt', width: '120px', sort: true },
  { title: 'Hành động', key: 'action', width: '120px' }
]

export const TABLE_ACTION_CONFIG: ITableConfig[] = [
  { title: 'Tên video', key: 'title', width: '200px', sort: true },
  { title: 'Loại video', key: 'tags', width: '120px' },
  { title: 'Lượt xem', key: 'viewCount', width: '120px' },
  { title: 'Ngày tạo', key: 'createdAt', width: '120px', sort: true },
  { title: 'Ngày cập nhật', key: 'updatedAt', width: '120px', sort: true },
  { title: 'Hành động', key: 'action', width: '120px' }
]
