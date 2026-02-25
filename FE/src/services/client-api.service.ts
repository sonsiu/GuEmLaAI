'use client'

import { DEFAULT_ERROR_MESSAGE, LOCALE, LOCALES, PUBLIC_ROUTES } from '@/@core/constants/global.const'
import { showErrorToast } from './toast.service'
import type { IBaseResponse } from '@/types'

class ApiResponseHandler<T> {
  private response: IBaseResponse<T>

  constructor(response: IBaseResponse<T>) {
    this.response = response
  }

  onSuccess(callback: (data: T) => void) {
    if (this.response.success) {
      callback(this.response.data)
    }

    return this
  }

  onError(callback: (error: { message: string; statusCode: number }) => void) {
    if (!this.response.success) {
      callback({
        message: this.response.message,
        statusCode: this.response.statusCode
      })
    }

    return this
  }

  getRaw() {
    return this.response
  }
}

class ClientApiService {
  private baseUrl: string
  private accessToken: string | null = null
  private unauthorizedHandler?: () => void

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL!
  }

  /**
   * Normalize response to IBaseResponse format
   * Handles cases where backend returns:
   * 1. IBaseResponse format (with success, data, message, statusCode)
   * 2. Error format with "error" field: { "error": "message" }
   * 3. Direct array/object (fallback - wrap it)
   */
  private normalizeResponse<T>(data: unknown, statusCode: number = 200): IBaseResponse<T> {
    // Check if response already has IBaseResponse structure
    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'data' in data &&
      'statusCode' in data &&
      'message' in data
    ) {
      return data as IBaseResponse<T>
    }

    // Handle error format: { "error": "message" }
    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
    ) {
      return {
        success: false,
        message: (data as { error: string }).error,
        errors: (data as { error: string }).error,
        data: null as unknown as T,
        statusCode
      }
    }

    // Fallback: wrap direct array/object response
    return {
      success: true,
      message: 'Success',
      errors: '',
      data: data as T,
      statusCode
    }
  }

  private async request<T>(
    url: string,
    options?: RequestInit,
    isShowErrorToast: boolean = true,
    hasHeader: boolean = true,
    skipContentType: boolean = false
  ): Promise<ApiResponseHandler<T>> {
    const headers = hasHeader ? await this.getHeaders(url, options?.headers, LOCALE.vi, skipContentType) : {}

    try {
      const response = await fetch(this.prefixUri(url), {
        ...options,
        headers,
        ...(this.isCredentials(url) && { credentials: 'include' })
      })

      const rawText = await response.text()
      let data: unknown = null

      if (rawText) {
        try {
          data = JSON.parse(rawText)
        } catch (parseError) {
         console.warn('Failed to parse JSON response:', parseError)
          data = rawText
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorized()
          throw new Error('Vui lòng đăng nhập để thực hiện hành động này')
        }

        let errorMessage = DEFAULT_ERROR_MESSAGE

        if (typeof data === 'string' && data.trim().length > 0) {
          errorMessage = data
        } else if (data && typeof data === 'object') {
          if ('error' in data && typeof (data as { error: unknown }).error === 'string') {
            errorMessage = (data as { error: string }).error
          } else if ('message' in data && typeof (data as { message: unknown }).message === 'string') {
            errorMessage = (data as { message: string }).message
          }
        }

        throw new Error(errorMessage)
      }

      // Normalize response to handle both IBaseResponse format and direct array/object
      const normalizedResponse = this.normalizeResponse<T>(data as T, response.status)

      return new ApiResponseHandler<T>(normalizedResponse)
    } catch (error) {
     console.log('🚀 ~ ClientApiService ~ request ~ error:', error)
      const message = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE

      isShowErrorToast && showErrorToast(message)

      const errorData: IBaseResponse<T> = {
        success: false,
        message,
        errors: message,
        data: null as unknown as T,
        statusCode: 500
      }

      return new ApiResponseHandler<T>(errorData)
    }
  }

  get<T>(url: string, options?: RequestInit, isShowErrorToast: boolean = true) {
    return this.request<T>(url, { ...options, method: 'GET' }, isShowErrorToast)
  }

  post<T>(url: string, body?: unknown, options?: RequestInit, isShowErrorToast: boolean = true) {
    return this.request<T>(
      url,
      {
        ...options,
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {})
      },
      isShowErrorToast
    )
  }

  put<T>(url: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      ...(body ? { body: JSON.stringify(body) } : {})
    })
  }

  patch<T>(url: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      ...(body ? { body: JSON.stringify(body) } : {})
    })
  }

  delete<T>(url: string, options?: RequestInit) {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }

  upload<T>(url: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: body as FormData
      },
      false,
      true, // hasHeader = true để có Authorization token
      true // skipContentType = true vì FormData tự động set Content-Type với boundary
    )
  }

  uploadPut<T>(url: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: body as FormData
      },
      false,
      true, // hasHeader = true để có Authorization token
      true // skipContentType = true vì FormData tự động set Content-Type với boundary
    )
  }

  prefixUri(uri: string) {
    return uri.startsWith('http') || uri.startsWith('/api') ? uri : `${this.baseUrl}${uri}`
  }

  private isCredentials(uri: string, condition?: boolean) {
    if (condition) return true
    return !uri.startsWith('http') && !PUBLIC_ROUTES.some(route => uri.includes(route))
  }

  private async getHeaders(
    uri: string,
    customHeaders?: HeadersInit,
    lang: LOCALE = LOCALE.vi,
    skipContentType: boolean = false
  ): Promise<HeadersInit> {
    // Get accessToken from localStorage if not set
    if (!this.accessToken && this.isCredentials(uri)) {
      this.accessToken = localStorage.getItem('accessToken') || ''
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': lang,
      ...(this.accessToken && this.isCredentials(uri) ? { Authorization: `Bearer ${this.accessToken}` } : {})
    }

    // Only add Content-Type if not skipping (for FormData, browser sets it automatically)
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json'
    }

    // Merge with custom headers
    return {
      ...headers,
      ...(customHeaders as Record<string, string>)
    }
  }

  public setAccessToken(token: string) {
    this.accessToken = token
  }

  public clearToken() {
    this.accessToken = null
  }

  public setUnauthorizedHandler(handler: () => void) {
    this.unauthorizedHandler = handler
  }

  public clearUnauthorizedHandler() {
    this.unauthorizedHandler = undefined
  }

  private handleUnauthorized() {
    if (this.unauthorizedHandler) {
      this.unauthorizedHandler()
    } else {
      // Fallback: clear local storage if no handler registered
      localStorage.removeItem('accessToken')
      this.clearToken()
    }

    this.redirectToLogin()
  }

  private redirectToLogin() {
    if (typeof window === 'undefined') return

    const segments = window.location.pathname.split('/').filter(Boolean)
    const currentLang = segments[0] && LOCALES.includes(segments[0] as LOCALE) ? segments[0] : LOCALE.vi

    window.location.href = `/${currentLang}/login`
  }
}

export const ClientApi = new ClientApiService()
