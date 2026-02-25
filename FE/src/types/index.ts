import type { STRING, USER_ROLE } from '@/@core/constants/global.const'

export interface IBaseResponse<T> {
  success: boolean
  message: string
  errors: string
  data: T
  statusCode: number
}

export interface IBaseResponseRecord<T> {
  records: T[]
  total: number
  page: number
  size: number
}
export interface IJwtResponse {
  userId: string
  tokenType?: STRING.ACCESS_TOKEN | STRING.REFRESH_TOKEN
  role: USER_ROLE
  iat: number
  exp: number
}

export interface BaseResponseRecords<T> {
  page: number
  size: number
  total: number
  lastPage: number
  records: T[]
}

export interface BaseQueryRequest {
  page?: number
  size?: number
  text?: string
  sortBy?: string
  sortType?: SortTypeRequest
  searchBy?: string[]
  [key: string]: any
}

export type SortTypeRequest = 'asc' | 'desc'

export interface ToastOptions {
  duration?: number
  style?: React.CSSProperties
  icon?: React.ReactNode
}

export interface ToastStyles {
  success: ToastOptions
  error: ToastOptions
  warning: ToastOptions
  info: ToastOptions
}

export interface IDummy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}



