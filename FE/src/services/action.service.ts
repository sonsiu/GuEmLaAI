import { Delete, GetAll, Post, Put } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

export const actionService = {
  getAction: (params: BaseQueryRequest) => GetAll('/action/get-all', params),
  updateAction: (_id: string, rest: any) => Put(`/action/update/${_id}`, rest),
  updateActionView: (_id: string) => Put(`/action/update-view/${_id}`, {}),
  createAction: (data: any) => Post('/action/create', data),
  deleteAction: (_id: string) => Delete(`/action/delete/${_id}`)
}
