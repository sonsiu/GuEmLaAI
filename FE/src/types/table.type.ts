import type { USER_ROLE } from '@/@core/constants/global.const'
import type { IDummy, SortTypeRequest } from '.'
import type { ButtonColor, ButtonVariant } from './widgetTypes'

export interface ITableConfig {
  title: string
  key: string
  align?: 'center' | 'left' | 'right'
  width?: string
  fixed?: boolean
  sort?: boolean
  roles?: USER_ROLE[]
  isShowZero?: boolean
  prefix?: string
  suffix?: string
  hidden?: boolean
}

export interface ITableItem extends IDummy {
  disabled?: boolean
}

export interface ISelectOption {
  label: string
  value: boolean | number | string | null
}

export interface SearchQuery {
  sort: { key: string; value: SortTypeRequest } | undefined
  pageIndex: number
  pageSize: number
}

export interface ICheckedList {
  checkAll: boolean
  checkedList: ITableItem[]
}

export interface ICheckedData {
  checkAll: boolean
  checkedPage: {
    [pageIndex: number]: boolean
  }
}

export interface ITableData {
  data: ITableItem[]
  totalItem: number
  pageIndex: number
  pageSize: number
}

export type TableSearchOptions = {
  showSearch: boolean
  placeholder?: string
  debounceTime?: number
  searchField?: string
  className?: string
  searchWithButton?: {
    searchButtonText: string
    variant?: ButtonVariant
    color?: ButtonColor
    onClick?: () => void
  }
  onSearch?: (params: any) => void
}
