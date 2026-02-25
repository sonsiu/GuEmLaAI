export interface TryOnWardrobeItem {
  id: string
  name: string
  url: string
  isPublic?: boolean
}

export interface PoseImage {
  url: string // Presigned URL for display
  fileName: string // Extracted filename (e.g., 'image.webp') for API calls
}

export interface OutfitLayer {
  garment: TryOnWardrobeItem | null
  poseImages: Record<string, PoseImage>
}

// Helper function to extract filename from presigned URL
export const extractFileNameFromUrl = (url: string): string => {
  if (!url) return ''
  
  // Handle case where url is just a filename (no path or query)
  if (!url.includes('/') && !url.includes('?')) {
    return url
  }
  
  // Extract the part after the last slash and before the first query param
  const pathPart = url.split('?')[0] // Remove query params
  const fileName = pathPart.split('/').pop() || ''
  
  // If we got an empty filename, something went wrong, return original
  return fileName || url
}

export interface HistoryBoardImage {
  id: number
  fileName: string
  url: string
}

export interface ItemTemplate {
  id: number
  imagePreview: string
  imageUrl: string
  name: string
  categoryCode: string
}

export interface HistoryBoardImageInfo {
  id: number
  url: string
  itemsTemplate: ItemTemplate[]
}

export interface SaveTryOnOutfitRequest {
  HistoryBoardId: number
  Name?: string
  Comment?: string
  Seasons?: string[]
  IsFavorite?: boolean
  modelFileName?: string[]
  ClothingItemIds?: number[]
}

export interface SaveTryOnOutfitResponse {
  outfitId: number
  message: string
}

