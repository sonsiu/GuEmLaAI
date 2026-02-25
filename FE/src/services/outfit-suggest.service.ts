import { ClientApi } from './client-api.service'

// New Options-based interface
export interface StylingOptionRequest {
  title: string
  description: string
  isFromWardrobe: boolean
  itemIds: number[]
  generatedImageUrl?: string | null
}

export interface StylingOptionResponse {
  title: string
  description: string
  isFromWardrobe: boolean
  itemIds: number[]
  generatedImageUrl?: string | null
}

export interface SaveSuggestionHistoryRequest {
  queryText: string
  wardrobeVersion?: string | null
  modelImageUrl?: string | null
  previewImageUrl?: string | null
  options: StylingOptionRequest[]
}

export interface SaveSuggestionHistoryResponse {
  id: number
}

export interface OutfitSuggestionHistory {
  id: number
  queryText: string
  wardrobeVersion?: string | null
  previewImageUrl?: string | null
  modelImageUrl?: string | null
  createdAt: string
  options: StylingOptionResponse[]
  optionsJson?: string
  outfitItemNames?: string[][]
  outfitItemCategories?: (string | null)[][]
}

export interface UserModels {
  defaultModelName ?: string | null
  modelUrls ?: string[] | null
}

export interface SaveSuggestionOutfitRequest {
  userId: number
  name: string
  imagePreview: string
  itemIds: number[]
}

export interface SaveSuggestionOutfitResponse {
  message: string
}

export interface CheckItemRequirementResponse {
  requirementMet: boolean
}



const resolvePresignedUrl = (raw?: { url?: string; presignedUrl?: string; src?: string }): string | null => {
  if (!raw) return null
  return raw.url || raw.presignedUrl || raw.src || null
}

export const outfitSuggestService = {

  getPresignedUrl: async (fileName: string, folder: string = 'items'): Promise<string | null> => {
    if (!fileName) return null
    const encodedFileName = encodeURIComponent(fileName)
    const response = await ClientApi.get<{ url?: string; presignedUrl?: string; src?: string }>(
      `/Wasabi/presigned-url/${encodedFileName}?folder=${folder}`,
      undefined,
      false
    )
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to fetch presigned URL')
    }
    return resolvePresignedUrl(raw.data)
  },
  saveHistory: async (payload: SaveSuggestionHistoryRequest) => {
    const response = await ClientApi.post<SaveSuggestionHistoryResponse>('/OutfitSuggest/history', payload)
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to save suggestion history')
    }
    return raw.data
  },
  getHistory: async (limit = 50) => {
    const tryParse = (raw: any) => {
      if (!raw?.success) {
        throw new Error(raw?.message || 'Failed to load suggestion history')
      }
      return raw.data?.data || []
    }

    const safeLimit = Math.max(1, Math.min(limit, 200))

    const fetchViaGet = async () => {
      const getRes = await ClientApi.get<{ data: OutfitSuggestionHistory[] }>(
        `/OutfitSuggest/history?limit=${safeLimit}`
      )
      return tryParse(getRes.getRaw())
    }

    const fetchViaPost = async () => {
      // API expects a raw number in the body, not an object
      const postRes = await ClientApi.post<{ data: OutfitSuggestionHistory[] }>(
        `/OutfitSuggest/history/list`,
        safeLimit
      )
      return tryParse(postRes.getRaw())
    }

    let history: OutfitSuggestionHistory[] = []
    let lastError: unknown = null

    try {
      // Primary: GET endpoint
      history = await fetchViaGet()
    } catch (err) {
      lastError = err
    }

    // Fallback to POST if GET failed or returned empty
    if (!history.length) {
      try {
        history = await fetchViaPost()
      } catch (err) {
        lastError = err
      }
    }

    if (!history.length && lastError) {
      throw lastError instanceof Error ? lastError : new Error('Failed to load suggestion history')
    }

    const safeParseArray = <T>(value: unknown): T[] => {
      if (Array.isArray(value)) return value as T[]
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    }

    const safeParseOptions = (options: unknown, optionsJson?: string): StylingOptionResponse[] => {
      // First try the parsed Options array
      if (Array.isArray(options) && options.length > 0) {
        return options as StylingOptionResponse[]
      }
      // Then try parsing optionsJson
      if (optionsJson && typeof optionsJson === 'string') {
        try {
          const parsed = JSON.parse(optionsJson)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as StylingOptionResponse[]
          }
        } catch {
          // Fall through to empty array
        }
      }
      return []
    }

    return history.map(item => ({
      ...item,
      options: safeParseOptions(item.options, item.optionsJson),
      outfitItemNames: safeParseArray<string[]>(item.outfitItemNames),
      outfitItemCategories: safeParseArray<string[]>(item.outfitItemCategories)
    }))
  },
  getModelUser: async (): Promise<UserModels> => {
      const response = await ClientApi.get<UserModels>('/OutfitSuggest/loadModels')
      const raw = response.getRaw()
      
      if (!raw?.success) {
        throw new Error(raw?.message || 'Failed to load user models')
      }
      
      // The actual data is nested in raw.data.data due to API wrapper
      const data = (raw.data as any)?.data || raw.data
      
      return {
        defaultModelName: data?.defaultModelName || null,
        modelUrls: data?.modelUrls || []
      }
    },

  setDefaultModel: async (fileName: string): Promise<void> => {
    const response = await ClientApi.get<void>(
      `/OutfitSuggest/setDefaultModel?fileName=${encodeURIComponent(fileName)}`
    )
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to set default model')
    }
  },

  deleteModel: async (fileName: string): Promise<void> => {
    const response = await ClientApi.delete<void>(
      `/OutfitSuggest/deleteModel?fileName=${encodeURIComponent(fileName)}`
    )
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to delete model')
    }
  },

  saveOutfitFromSuggestion: async (request: SaveSuggestionOutfitRequest): Promise<SaveSuggestionOutfitResponse> => {
    const response = await ClientApi.post<SaveSuggestionOutfitResponse>('/OutfitSuggest/save-from-suggestion', request)
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to save outfit from suggestion')
    }
    return raw.data
  },

  checkItemCreatedRequirement: async (): Promise<CheckItemRequirementResponse> => {
    const response = await ClientApi.get<CheckItemRequirementResponse>('/OutfitSuggest/checkItemCreatedRequirement')
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to check item requirement')
    }
    return raw.data
  },

  deleteHistory: async (id: number | string): Promise<void> => {
    const response = await ClientApi.delete<void>(`/OutfitSuggest/history/${id}`)
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to delete suggestion history')
    }
  },

  clearHistory: async (): Promise<void> => {
    const response = await ClientApi.delete<void>('/OutfitSuggest/history/clear')
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to clear suggestion history')
    }
  },

    
}
