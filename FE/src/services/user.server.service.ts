import { Get } from '@/@core/base/fetch/fetch.server'
import type { IAccount } from '@/types/auth.type'

const USER_ENDPOINTS = {
  GET_ME: '/users/me'
} as const

export const userServerService = {
  getProfile: () => Get<IAccount>(USER_ENDPOINTS.GET_ME)
}

