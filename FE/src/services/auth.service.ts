import type { NextResponse } from 'next/server'
import { Get, GetAll, Patch, Post, Put, Upload } from '@/@core/base/fetch/fetch.server'
import type { ILoginRequest, ILoginResponse, IRegisterRequest } from '@/types/auth.type'
import { EXPIRES_IN, STORAGE_KEY } from '@/@core/constants/global.const'
import { removeServerCookie, setServerCookie } from '@/utils/cookie.helper'
import type { BaseQueryRequest } from '@/types'

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  GET_ALL_USERS: '/users/get-all',
  REGISTER: '/auth/register',
  GET_PROFILE: '/profile/get-one',
  UPDATE_PROFILE: '/profile/update',
  CHANGE_STATUS: '/users/change-status/',
  UPLOAD: '/galleries/create',
  UPDATE_INFO: '/users/update'
} as const

export const authService = {
  login: (data: ILoginRequest) => Post<ILoginResponse>(AUTH_ENDPOINTS.LOGIN, data),

  logout: () => Post(AUTH_ENDPOINTS.LOGOUT, {}),

  getAllUsers: (params: BaseQueryRequest) => GetAll(AUTH_ENDPOINTS.GET_ALL_USERS, params),

  register: (data: IRegisterRequest) => Post(AUTH_ENDPOINTS.REGISTER, data),

  getProfile: () => Get(AUTH_ENDPOINTS.GET_PROFILE),

  updateProfile: (data: any) => Post(AUTH_ENDPOINTS.UPDATE_PROFILE, data),

  changeStatus: ({ id, status }: { id: string; status: boolean }) => Put(AUTH_ENDPOINTS.CHANGE_STATUS + id, { status }),

  upload: (data: any) => Upload(AUTH_ENDPOINTS.UPLOAD, data),

  updateInfo: (data: any) => Patch(AUTH_ENDPOINTS.UPDATE_INFO, data)
}

type SetAuthCookiesParams = {
  accessToken: string
  refreshToken: string
  response: NextResponse
}

export const startSession = async ({ accessToken, refreshToken, response }: SetAuthCookiesParams) => {
  setServerCookie(response, STORAGE_KEY.accessToken, accessToken, {
    maxAge: EXPIRES_IN.ACCESS_TOKEN
  })

  setServerCookie(response, STORAGE_KEY.refreshToken, refreshToken, {
    maxAge: EXPIRES_IN.REFRESH_TOKEN
  })
}

export const endSession = async (response: NextResponse) => {
  removeServerCookie(response, STORAGE_KEY.accessToken)
  removeServerCookie(response, STORAGE_KEY.refreshToken)
}
