'use client'

import { ClientApi } from './client-api.service'
import { showSuccessToast } from './toast.service'
import type {
  PublicOutfit,
  PublicOutfitDetail,
  PublicOutfitItem,
  UpsertPublicOutfitItemPayload,
  UpsertPublicOutfitPayload
} from '@/types/public-collection.type'

// Admin endpoints need explicit /api prefix to hit protected routes
const BASE_PATH = '/PublicCollection/admin'

class PublicCollectionService {
  private buildOutfitFormData(payload: UpsertPublicOutfitPayload) {
    const formData = new FormData()

    formData.append('Name', payload.name)

    if (payload.description !== undefined) {
      formData.append('Description', payload.description || '')
    }

    formData.append('IsActive', String(payload.isActive))
    formData.append('DisplayOrder', String(payload.displayOrder ?? 0))

    const seasons = payload.seasons || []

    seasons.forEach(season => formData.append('Seasons', season))

    if (payload.imageFile) {
      formData.append('ImageFile', payload.imageFile)
    }

    return formData
  }

  private buildItemFormData(payload: UpsertPublicOutfitItemPayload) {
    const formData = new FormData()

    formData.append('Name', payload.name)

    if (payload.buyLink !== undefined) {
      formData.append('BuyLink', payload.buyLink || '')
    }

    if (payload.color !== undefined) {
      formData.append('Color', payload.color || '')
    }

    formData.append('DisplayOrder', String(payload.displayOrder ?? 0))

    if (payload.imageFile) {
      formData.append('ImageFile', payload.imageFile)
    }

    return formData
  }

  async getOutfits(): Promise<PublicOutfit[]> {
    const response = await ClientApi.get<PublicOutfit[]>(`${BASE_PATH}/outfits`)
    const raw = response.getRaw()

    const payload = raw?.data

    if (payload && Array.isArray((payload as any).data)) {
      return (payload as any).data as PublicOutfit[]
    }

    return (payload as PublicOutfit[]) || []
  }

  async getOutfitDetail(outfitId: number): Promise<PublicOutfitDetail> {
    const response = await ClientApi.get<PublicOutfitDetail>(`${BASE_PATH}/outfits/${outfitId}`)
    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to load outfit detail')
    }

    return raw.data
  }

  async createOutfit(payload: UpsertPublicOutfitPayload): Promise<PublicOutfit> {
    const formData = this.buildOutfitFormData(payload)
    const response = await ClientApi.upload<PublicOutfit>(`${BASE_PATH}/outfits`, formData)
    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to create outfit')
    }

    showSuccessToast('Tạo outfit public thành công')
    return raw.data
  }

  async updateOutfit(outfitId: number, payload: UpsertPublicOutfitPayload): Promise<PublicOutfit> {
    const formData = this.buildOutfitFormData(payload)
    const response = await ClientApi.uploadPut<PublicOutfit>(`${BASE_PATH}/outfits/${outfitId}`, formData)
    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to update outfit')
    }

    showSuccessToast('Cập nhật outfit public thành công')
    return raw.data
  }

  async deleteOutfit(outfitId: number): Promise<void> {
    const response = await ClientApi.delete(`${BASE_PATH}/outfits/${outfitId}`)
    const raw = response.getRaw()

    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to delete outfit')
    }

    showSuccessToast('Đã xóa outfit public')
  }

  async addItem(outfitId: number, payload: UpsertPublicOutfitItemPayload): Promise<PublicOutfitItem> {
    const formData = this.buildItemFormData(payload)
    const response = await ClientApi.upload<PublicOutfitItem>(`${BASE_PATH}/outfits/${outfitId}/items`, formData)
    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to add item')
    }

    showSuccessToast('Đã thêm item vào outfit')
    return raw.data
  }

  async updateItem(itemId: number, payload: UpsertPublicOutfitItemPayload): Promise<PublicOutfitItem> {
    const formData = this.buildItemFormData(payload)
    const response = await ClientApi.uploadPut<PublicOutfitItem>(`${BASE_PATH}/items/${itemId}`, formData)
    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to update item')
    }

    showSuccessToast('Cập nhật item thành công')
    return raw.data
  }

  async deleteItem(itemId: number): Promise<void> {
    const response = await ClientApi.delete(`${BASE_PATH}/items/${itemId}`)
    const raw = response.getRaw()

    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to delete item')
    }

    showSuccessToast('Đã xóa item')
  }

  async tryOnWithItems(modelImage: File, itemImageUrls: string[]): Promise<string> {
    const formData = new FormData()

    formData.append('personImageFile', modelImage)

    await Promise.all(
      itemImageUrls.map(async (imageUrl, index) => {
        const blob = await fetch(imageUrl).then(r => r.blob())

        formData.append('garmentImageFiles', blob, `item-${index + 1}.png`)
      })
    )

    const response = await ClientApi.upload<{ imageBase64?: string; data?: { imageBase64?: string } }>(
      '/Workshop/multiTryOn',
      formData
    )

    const raw = response.getRaw()

    const imageBase64 =
      (raw?.data as any)?.imageBase64 ||
      (raw?.data as any)?.data?.imageBase64 ||
      (raw as any)?.imageBase64 ||
      null

    if (!raw?.success || !imageBase64) {
      throw new Error(raw?.message || 'AI Try-On failed')
    }

    return imageBase64
  }
}

export const publicCollectionService = new PublicCollectionService()

