export enum LOCALE {
  en = 'en',
  vi = 'vi'
}

export const LOCALES = [LOCALE.vi, LOCALE.en]

export const DEFAULT_LOCALE = LOCALE.vi

export enum USER_ROLE {
  ADMIN = 1,
  USER = 3
}

export enum STRING {
  ID = 'id',
  ASC = 'ascend',
  DESC = 'descend',
  TIME = 'time',
  DATE = 'date',
  NUMBER = 'number',
  STRING = 'string',
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  TOKEN = 'token'
}

export const DEFAULT_ERROR_MESSAGE = 'Server lỗi, vui lòng thử lại sau'

export const DEFAULT_URL = '/home'

export enum DateFormat {
  YMD = 'YYYY-MM-dd',
  YMD_H = 'YYYY-MM-dd HH',
  YMD_HM = 'YYYY-MM-dd HH:mm',
  YMD_HMS = 'YYYY-MM-dd HH:mm:ss',
  YMD_T_HMSZ = 'YYYY-MM-ddTHH:mm:ssZ',
  MDY = 'MM/dd/YYYY',
  MDY_HMS = 'MM/dd/YYYY HH:mm:ss',
  DMY = 'dd-MM-YYYY',
  DMY_HM = 'dd-MM-YYYY HH:mm',
  DMY_HMS = 'dd-MM-YYYY HH:mm:ss',
  YMD_SLASH = 'YYYY/MM/dd',
  YMD_SLASH_HM = 'YYYY/MM/dd HH:mm',
  YMD_SLASH_HMS = 'YYYY/MM/dd HH:mm:ss',
  FULL_READABLE = 'dddd, MMMM Do YYYY, h:mm:ss a',
  SHORT_DAY_HOUR = 'ddd, hA',
  TIME_HMS = 'HH:mm:ss',
  TIME_HM = 'HH:mm'
}

export const EXPIRES_IN = {
  ACCESS_TOKEN: 2 * 24 * 60 * 60 * 1000,
  REFRESH_TOKEN: 365 * 24 * 60 * 60 * 1000
}

export const STORAGE_KEY = {
  currentUser: 'current_user',
  refreshToken: 'refresh_token',
  accessToken: 'access_token'
}

export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/landing',
  '/reset-password',
  '/home',
  '/auth/session',
  '/api/auth/callback/*',
  '/api/auth/csrf',
  '/api/auth/providers'
]

export const DEFAULT_REDIRECT_ROUTES = {
  [USER_ROLE.ADMIN]: '/admin/dashboards',
  [USER_ROLE.USER]: '/home'
}
