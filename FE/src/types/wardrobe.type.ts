/**
 * Wardrobe Type Definitions
 * Types for managing wardrobe items, boards, outfits, and collections
 */

/**
 * Item Response Model
 */
export interface WardrobeItem {
  id: number
  categoryName: string
  imagePreview: string
  imageUrl: string | null
  isPublic: boolean
  isFavorite: boolean
  comment: string | null
  createdAt: string
  updatedAt: string | null
  itemSeasons: string[]
  itemColors: string[]
  itemOccasions?: string[]
  size: string
  description: string | null
}

/**
 * Board Response Model
 */
export interface Board {
  id: number
  title: string
  description: string | null
  createdAt: string
  coverImageId: number | null
  coverImageUrl: string | null
}

/**
 * History Board Response Model
 */
export interface HistoryBoard {
  id: number
  userId: number
  image: string
  imageUrl: string
  createdAt: string
  expiredAt: string
}

/**
 * Get User Boards Responses
 */
export interface GetUserBoardsResponse {
  boards: Board[]
  historyBoard: HistoryBoard | null
}

/**
 * Board Image Response
 */
export interface BoardImage {
  id: number
  fileName: string
  url: string
}

/**
 * Board Image Response from API
 */
export interface BoardImageResponse {
  id: number
  fileName: string
  url: string
}

/**
 * Outfit Response Model
 */
export interface Outfit {
  id: number
  name?: string | null
  imagePreview: string
  imageUrl: string | null
  isPublic: boolean
  isFavorite: boolean
  comment?: string | null
  createdAt: string
  updatedAt?: string | null
  outfitSeasons: string[]
  jsonTemplate?: string | null
  itemIds?: (string | number)[]
  poseImages?: string[]
  itemImages?: ItemData[]
}

export interface ItemData {
  id: number
  imageUrl: string
  name: string
  categoryCode: string
}

/**
 * Collection Response Model
 */
export interface Collection {
  id: number
  userId: number
  name: string
  description?: string | null
  imageCover?: string | null
  imageCoverUrl?: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  outfitCount: number
}

/**
 * Collection Detail Response Model
 */
export interface CollectionDetail extends Collection {
  outfits: Outfit[]
}

/**
 * Create Board Request
 */
export interface CreateBoardRequest {
  title: string
  description?: string | null
}

/**
 * Update Board Request
 */
export interface UpdateBoardRequest {
  title?: string
  description?: string | null
}

/**
 * Create Collection Request
 */
export interface CreateCollectionRequest {
  name: string
  description?: string
  imageCoverFile?: File
  isPublic: boolean
}

/**
 * Update Collection Request
 */
export interface UpdateCollectionRequest {
  name?: string
  description?: string
  imageCoverFile?: File
  isPublic?: boolean
}

/**
 * Create Item Request
 */
export interface CreateItemRequest {
  userId?: number
  categoryName: string
  imageFile: File
  isPublic?: boolean
  isFavorite: boolean
  comment?: string
  itemName?: string
  description?: string
  seasons?: string[]
  colors?: string[]
  size?: string
  sizes?: string[]
  occasions?: string[]
}

/**
 * Update Item Request
 */
export interface UpdateItemRequest {
  categoryName?: string
  imageFile?: File
  isPublic?: boolean
  isFavorite?: boolean
  itemName?: string
  description?: string
  seasons?: string[]
  colors?: string[]
  occasions?: string[]
  size?: string
}

/**
 * Create Outfit Request
 */
export interface CreateOutfitRequest {
  userId: number
  name?: string
  imageFile: File
  jsonTemplate: string
  isPublic: boolean
  isFavorite: boolean
  comment?: string
  seasons?: string[]
}

/**
 * Update Outfit Request
 */
export interface UpdateOutfitRequest {
  name?: string
  imageFile?: File
  jsonTemplate?: string
  isPublic?: boolean
  isFavorite?: boolean
  comment?: string
  seasons?: string[]
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
  }
}
/**
 * Wardrobe Statistics Types
 */
export interface WearStats {
  id: string
  comment: string
  categoryCode: string
  wearCount: number
  colors: string[]
}

export interface CategoryData {
  category: string
  count: number
}

export interface ColorData {
  color: string
  count: number
}

export interface WearCountData {
  name: string
  wearCount: number
}
