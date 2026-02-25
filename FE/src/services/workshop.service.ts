import type { SaveTryOnOutfitRequest, SaveTryOnOutfitResponse } from '@/views/try-on/types'
import { ClientApi } from './client-api.service'

export interface GeminiTryOnRequest {
  Images: string[] // Array of filenames: [modelFileName, garment1FileName, garment2FileName, ...] or [modelFileName, outfitFileName]
  Prompt?: string
  PoseInstruction?: string
  OutfitStackItems?: string[] // Array of all item filenames currently in outfit stack (both associated and newly added)
}

export interface TryOnResponse {
  imageUrl: string
  fileName: string
  mimeType?: string
  historyBoardId?: number
}

export interface GeminiImageResponse {
  imageUrl?: string
  ImageBase64?: string
  fileName?: string
  mimeType?: string
}

export interface ModelPictureRequest {
  ImageBase64: string
}

export interface ModelPictureResponse {
  fileName: string
  imageUrl: string

}

class WorkshopService {
  /**
   * Gemini Try-On API - Multi image try-on
   */
  async geminiTryOn(data: GeminiTryOnRequest, endpoint: string = '/Workshop/multiTryOn'): Promise<TryOnResponse> {
    // console.log('🎬 WorkshopService.geminiTryOn called with:')
    // console.log('  Endpoint:', endpoint)
    // console.log('  Data:', JSON.stringify(data, null, 2))
    // console.log('  Images:', data.Images)
    // console.log('  OutfitStackItems:', data.OutfitStackItems)
    // console.log('  clothingItemIds:', (data as any).clothingItemIds)
    const response = await ClientApi.post<TryOnResponse>(endpoint, data)
    const raw = response.getRaw()
    
    // Handle error response (BadRequest or other errors)
    if (!raw.success) {
      let errorMessage = raw.message || (raw as any).errors || (raw as any).error || 'Failed to generate try-on image'
      
      // If errors is an object or array, try to extract string message
      if (typeof errorMessage !== 'string') {
        if (Array.isArray(errorMessage) && errorMessage.length > 0) {
          errorMessage = errorMessage[0]
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = JSON.stringify(errorMessage)
        }
      }
      
      throw new Error(errorMessage)
    }

    return raw.data
  }

  /**
   * Generate model enhancement
   */
  async generateModelEnhancement(data: GeminiTryOnRequest): Promise<GeminiImageResponse> {
    // Disable auto error toast - errors will be handled with friendly messages by components
    const response = await ClientApi.post<GeminiImageResponse>('/Workshop/backgroundGeminiImageGenerate', data, {}, false)
    const raw = response.getRaw()
    
    //console.log('🎨 generateModelEnhancement response:', { success: raw.success, message: raw.message, statusCode: raw.statusCode })
    
    // Handle error response (BadRequest or other errors)
    if (!raw.success) {
      // Extract error message from BadRequest response
      // Priority: message field > errors field > error field > default message
      let errorMessage = raw.message || (raw as any).errors || (raw as any).error || 'Failed to generate model enhancement'
      
      // If errors is an object or array, try to extract string message
      if (typeof errorMessage !== 'string') {
        if (Array.isArray(errorMessage) && errorMessage.length > 0) {
          errorMessage = errorMessage[0]
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = JSON.stringify(errorMessage)
        }
      }
      
      //console.log('🎨 generateModelEnhancement error extracted:', errorMessage)
      throw new Error(errorMessage)
    }
    
    return raw.data
  }

  /**
   * Request pose variation
   */
  async requestPoseVariation(data: GeminiTryOnRequest): Promise<GeminiImageResponse> {
    const response = await ClientApi.post<GeminiImageResponse>('/Workshop/poseVariation', data)
    const raw = response.getRaw()
    
    // Handle error response (BadRequest or other errors)
    if (!raw.success) {
      let errorMessage = raw.message || (raw as any).errors || (raw as any).error || 'Failed to generate pose variation'
      
      // If errors is an object or array, try to extract string message
      if (typeof errorMessage !== 'string') {
        if (Array.isArray(errorMessage) && errorMessage.length > 0) {
          errorMessage = errorMessage[0]
        } else if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = JSON.stringify(errorMessage)
        }
      }
      
      throw new Error(errorMessage)
    }

    return raw.data
  }

  /**
   * Save model picture
   */
  async saveModelPicture(data: ModelPictureRequest): Promise<ModelPictureResponse> {
    const response = await ClientApi.post<ModelPictureResponse>('/Workshop/modelPicture', data)

    return response.getRaw().data
  }

  /**
   * Delete model picture
   */
  async deleteModelPicture(fileName: string): Promise<{ message: string }> {
    const response = await ClientApi.delete<{ message: string }>(`/Workshop/${encodeURIComponent(fileName)}`)

    return response.getRaw().data
  }

  /**
   * Set default model picture
   */
  async setDefaultModel(fileName: string): Promise<void> {
    const response = await ClientApi.get<void>(
      `/OutfitSuggest/setDefaultModel?fileName=${encodeURIComponent(fileName)}`
    )
    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to set default model')
    }
  }

  /**
   * Save try-on result as outfit
   */
  async saveTryOnOutfit(data: SaveTryOnOutfitRequest): Promise<SaveTryOnOutfitResponse> {
    // console.log('💾 WorkshopService.saveTryOnOutfit called with:')
    // console.log('  HistoryBoardId:', data.HistoryBoardId)
    // console.log('  Name:', data.Name)
    // console.log('  Comment:', data.Comment)
    // console.log('  Seasons:', data.Seasons)
    // console.log('  IsFavorite:', data.IsFavorite)
    // console.log('  modelFileName:', data.modelFileName)
    // console.log('  ClothingItemIds:', data.ClothingItemIds)
    // console.log('  ClothingItemIds type:', typeof data.ClothingItemIds)
    // if (data.ClothingItemIds) {
    //   console.log('  ClothingItemIds.length:', data.ClothingItemIds.length)
    //   console.log('  ClothingItemIds values:', data.ClothingItemIds.map((id, idx) => `[${idx}]: ${id} (type: ${typeof id})`).join(', '))
    // }
    const response = await ClientApi.post<SaveTryOnOutfitResponse>('/Outfit/save-from-tryon', data)

    return response.getRaw().data
  }
}

export const workshopService = new WorkshopService()
