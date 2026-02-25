import { Delete, GetAll, Post, Put } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

export const spiritService = {
  getSpirit: (params: BaseQueryRequest) => GetAll('/spirit/get-all', params),
  createSpirit: (data: any) => Post('/spirit/create', data),
  deleteSpirit: (_id: string) => Delete(`/spirit/delete/${_id}`),
  getAllFeedback: (params: BaseQueryRequest) => GetAll('/feedback/get-all', params),
  createFeedback: (data: any) => Post('/feedback/create', data),
  updateFeedback: (_id: string, isShow: boolean) => Put(`/feedback/update/${_id}`, { isShow })
}
