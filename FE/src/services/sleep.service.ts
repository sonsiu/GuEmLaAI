import { Delete, GetAll, Post } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

export const sleepService = {
  getSleep: (params: BaseQueryRequest) => GetAll('/sleep/get-all', params),
  getSleepAnalytic: (params: BaseQueryRequest) => GetAll('/sleep/analytic', params),
  createSleep: (data: any) => Post('/sleep/create', data),
  deleteSleep: (_id: string) => Delete(`/sleep/delete/${_id}`)
}
