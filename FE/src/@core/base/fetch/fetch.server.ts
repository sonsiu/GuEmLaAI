import type { BaseQueryRequest, IBaseResponse } from '@/types'
import { DEFAULT_ERROR_MESSAGE, STORAGE_KEY } from '@/@core/constants/global.const'
import { getServerCookie, setServerCookieByNextHeaders } from '@/utils/cookie.helper'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
const DEFAULT_TIMEOUT = 15000

const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal
    })

    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export async function handleServerFetch<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount: number = 1,
  isHasHeader: boolean = true
): Promise<IBaseResponse<T>> {
  const defaultOptions: RequestInit = {
    headers: isHasHeader
      ? {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
          ...((await getServerCookie(STORAGE_KEY.accessToken))
            ? { Authorization: `Bearer ${await getServerCookie(STORAGE_KEY.accessToken)}` }
            : {})
        }
      : {
          ...((await getServerCookie(STORAGE_KEY.accessToken))
            ? { Authorization: `Bearer ${await getServerCookie(STORAGE_KEY.accessToken)}` }
            : {})
        },
    ...options
  }

  try {
    const response = await fetchWithTimeout(`${prefixUri(endpoint)}`, defaultOptions)

    const data: IBaseResponse<T> = await response.json()

    if (response.status === 401 || response.status === 403)
      return handleCheckAuth<T>(response, data, endpoint, retryCount, options)

    if (!response.ok) {
      return {
        statusCode: response.status,
        message: data?.errors || DEFAULT_ERROR_MESSAGE,
        data: null as T,
        success: false,
        errors: data?.errors || DEFAULT_ERROR_MESSAGE
      }
    }

    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        statusCode: 408,
        message: 'The request took too long to respond',
        data: null as T,
        success: false,
        errors: 'The request took too long to respond'
      }
    }

    const message = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE

    return {
      statusCode: 500,
      message,
      data: null as T,
      success: false,
      errors: message
    }
  }
}

const prefixUri = (uri: string) => (uri.startsWith('http') ? uri : `${BASE_URL}${uri}`)

export const Get = <T>(endpoint: string, options?: RequestInit) => {
  return handleServerFetch<T>(endpoint, { ...options, method: 'GET' })
}

export const GetAll = <T>(endpoint: string, params: BaseQueryRequest, options?: RequestInit) => {
  const queryString = toQueryString(params)

  return handleServerFetch<T>(endpoint + queryString, { ...options, method: 'GET' })
}

export const Post = <T>(endpoint: string, body: unknown, options?: RequestInit) =>
  handleServerFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  })

export const Upload = <T>(endpoint: string, body: unknown, options?: RequestInit) =>
  handleServerFetch<T>(
    endpoint,
    {
      ...options,
      method: 'POST',
      body: body as FormData
    },
    1,
    false
  )

export const Put = <T>(endpoint: string, body: unknown, options?: RequestInit) =>
  handleServerFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  })

export const Patch = <T>(endpoint: string, body: unknown, options?: RequestInit) =>
  handleServerFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  })

export const Delete = <T>(endpoint: string, options?: RequestInit) =>
  handleServerFetch<T>(endpoint, { ...options, method: 'DELETE' })

function toQueryString(params: Record<string, any> = { page: 1, size: 10 }) {
  return (
    '?' +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  )
}

const handleCheckAuth = async <T>(
  response: Response,
  data: IBaseResponse<T>,
  endpoint: string,
  retryCount: number,
  options?: RequestInit
): Promise<IBaseResponse<T>> => {
  if (retryCount === 0) {
    return {
      statusCode: 401,
      message: data?.message || 'Authentication failed',
      data: null as T,
      success: false,
      errors: data?.message || 'Authentication failed'
    }
  }

  const refreshToken = await getServerCookie(STORAGE_KEY.refreshToken)


  if (!refreshToken) {
    return {
      statusCode: 401,
      message: 'No refresh token available',
      data: null as T,
      success: false,
      errors: 'No refresh token available'
    }
  }

  const refreshResponse = await fetchWithTimeout(`${prefixUri('/auth/renew-token')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken
    })
  })

  const refreshData = await refreshResponse.json()

  //console.log('🚀 ~ refreshData:', refreshData)

  if (!refreshResponse.ok || !refreshData.success) {
    return {
      statusCode: 401,
      message: 'Authentication failed',
      data: null as T,
      success: false,
      errors: 'Authentication failed'
    }
  }

  await setServerCookieByNextHeaders(STORAGE_KEY.accessToken, refreshData.data)

  return handleServerFetch<T>(endpoint, options, retryCount - 1)
}
