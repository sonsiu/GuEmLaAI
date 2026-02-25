import { ClientApi } from './client-api.service'
import { showSuccessToast } from './toast.service'
import type {
  WardrobeItem,
  Board,
  BoardImageResponse,
  Outfit,
  Collection,
  CollectionDetail,
  GetUserBoardsResponse,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CreateItemRequest,
  UpdateItemRequest,
  CreateOutfitRequest,
  UpdateOutfitRequest,
  PaginatedResponse
} from '@/types/wardrobe.type'

class WardrobeService {
  /**
   * Get user's items with pagination and optional filters
   */
  async getUserItems(
    userId: number,
    pageNumber: number = 1,
    pageSize: number = 8,
    filters?: {
      category?: string
      colors?: string[]
      occasions?: string[]
      sizes?: string[]
      seasons?: string[]
      isFavorite?: boolean
      isPublic?: boolean
      searchQuery?: string
    }
  ): Promise<PaginatedResponse<WardrobeItem> | null> {
    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.append('pageNumber', pageNumber.toString())
    queryParams.append('pageSize', pageSize.toString())

    //console.log('🔧 [wardrobeService] getUserItems called')
    //console.log('👤 [wardrobeService] userId:', userId)
   //console.log('📄 [wardrobeService] pageNumber:', pageNumber, 'pageSize:', pageSize)
   //console.log('🔍 [wardrobeService] Filters object:', filters)

    // Add optional filters if provided
    if (filters) {
      if (filters.category) queryParams.append('category', filters.category)
      if (filters.colors && filters.colors.length > 0) {
        queryParams.append('colors', filters.colors.join(','))
      }
      if (filters.occasions && filters.occasions.length > 0) {
        queryParams.append('occasions', filters.occasions.join(','))
      }
      if (filters.sizes && filters.sizes.length > 0) {
        queryParams.append('sizes', filters.sizes.join(','))
      }
      if (filters.seasons && filters.seasons.length > 0) {
        queryParams.append('seasons', filters.seasons.join(','))
      }
      if (filters.isFavorite !== undefined) {
        queryParams.append('isFavorite', filters.isFavorite.toString())
      }
      if (filters.isPublic !== undefined) {
        queryParams.append('isPublic', filters.isPublic.toString())
      }
      if (filters.searchQuery) {
       // console.log('🔎 [wardrobeService] Search param found:', filters.searchQuery)
        queryParams.append('searchQuery', filters.searchQuery)
      }
    }

    const queryString = queryParams.toString()
    const fullUrl = `/Item/${userId}/items?${queryString}`

   //console.log('📡 [wardrobeService] Final URL:', fullUrl)
    //console.log('🔗 [wardrobeService] Query string:', queryString)

    const response = await ClientApi.get<PaginatedResponse<WardrobeItem>>(fullUrl)

    //console.log('📦 [wardrobeService] API Response:', response)

    const raw = response.getRaw()
    return raw?.data || null
  }

  /**
   * Get user's boards
   */
  async getUserBoards(userId: number): Promise<GetUserBoardsResponse | null> {
    const response = await ClientApi.get<GetUserBoardsResponse>(
      `/Board/${userId}/boards`
    )

    const raw = response.getRaw()
    return raw?.data || null
  }

  /**
   * Create a new board
   */
  async createBoard(data: CreateBoardRequest): Promise<Board> {
    const response = await ClientApi.post<Board>('/Board/create', data)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Tạo board thành công!')
    }

    return raw.data
  }

  /**
   * Update a board
   */
  async updateBoard(boardId: number, data: UpdateBoardRequest): Promise<Board> {
    const response = await ClientApi.put<Board>(`/Board/${boardId}`, data)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Cập nhật board thành công!')
    }

    return raw.data
  }

  /**
   * Delete a board
   */
  async deleteBoard(boardId: number): Promise<void> {
    const response = await ClientApi.delete(`/Board/remove-board/${boardId}`)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Xóa board thành công!')
    }
  }

  /**
   * Get board images
   */
  async getBoardImages(boardId: number): Promise<BoardImageResponse[]> {
    const response = await ClientApi.get<BoardImageResponse[]>(`/Board/${boardId}/images`)

    return response.getRaw().data || []
  }

  /**
   * Upload image to board
   */
  async uploadBoardImage(boardId: number, imageFile: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', imageFile)

    const response = await ClientApi.upload(`/Board/save-to-board?boardId=${boardId}`, formData)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Tải ảnh lên thành công!')
    }
  }

  /**
   * Remove image from board
   */
  async removeBoardImage(imageId: number): Promise<void> {
    const response = await ClientApi.delete(`/Board/remove-image/${imageId}`)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Xóa ảnh thành công!')
    }
  }

  /**
   * Get user's outfits with pagination and optional filters
   */
  async getUserOutfits(
    userId: number,
    pageNumber: number = 1,
    pageSize: number = 12,
    filters?: {
      searchQuery?: string
      isFavorite?: boolean
      isPublic?: boolean
    }
  ): Promise<PaginatedResponse<Outfit>> {
    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.append('pageNumber', pageNumber.toString())
    queryParams.append('pageSize', pageSize.toString())

    // Add optional filters if provided
    if (filters) {
      if (filters.searchQuery) {
        queryParams.append('searchQuery', filters.searchQuery)
      }
      if (filters.isFavorite !== undefined) {
        queryParams.append('isFavorite', filters.isFavorite.toString())
      }
      if (filters.isPublic !== undefined) {
        queryParams.append('isPublic', filters.isPublic.toString())
      }
    }

    const queryString = queryParams.toString()
    const fullUrl = `/Outfit/${userId}/outfits?${queryString}`

    const response = await ClientApi.get<PaginatedResponse<Outfit>>(fullUrl)

    return response.getRaw().data
  }

  /**
   * Get a single outfit
   */
  async getOutfit(outfitId: number): Promise<Outfit> {
    const response = await ClientApi.get<Outfit>(`/Outfit/${outfitId}`)
    const rawResponse = response.getRaw()
    return rawResponse.data
  }

  /**
   * Create a new outfit
   */
  async createOutfit(data: CreateOutfitRequest): Promise<Outfit> {
    const formData = new FormData()
    formData.append('UserId', data.userId.toString())
    formData.append('JsonTemplate', data.jsonTemplate)
    formData.append('ImageFile', data.imageFile)
    formData.append('IsPublic', String(data.isPublic))
    formData.append('IsFavorite', String(data.isFavorite))

    if (data.name) {
      formData.append('Name', data.name)
    }
    if (data.comment) {
      formData.append('Comment', data.comment)
    }
    if (data.seasons && data.seasons.length > 0) {
      data.seasons.forEach((season) => {
        formData.append('Seasons', season)
      })
    }

    const response = await ClientApi.upload<Outfit>('/Outfit/create', formData)

    const raw = response.getRaw()
    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to create outfit')
    }

    if (raw.success) {
      showSuccessToast('Tạo outfit thành công!')
    }

    return raw.data
  }

  /**
   * Update an outfit
   */
  async updateOutfit(outfitId: number, data: UpdateOutfitRequest): Promise<Outfit> {
    // If there's an image or jsonTemplate, use FormData for file upload
    if (data.imageFile || data.jsonTemplate) {
      const formData = new FormData()

      if (data.jsonTemplate) {
        formData.append('JsonTemplate', data.jsonTemplate)
      }
      if (data.imageFile) {
        formData.append('ImageFile', data.imageFile)
      }
      if (data.name !== undefined) {
        formData.append('Name', data.name || '')
      }
      if (data.comment !== undefined) {
        formData.append('Comment', data.comment || '')
      }
      if (data.isPublic !== undefined) {
        formData.append('IsPublic', String(data.isPublic))
      }
      if (data.isFavorite !== undefined) {
        formData.append('IsFavorite', String(data.isFavorite))
      }
      if (data.seasons && data.seasons.length > 0) {
        data.seasons.forEach((season) => {
          formData.append('Seasons', season)
        })
      }

      const response = await ClientApi.uploadPut<Outfit>(`/Outfit/update/${outfitId}`, formData)

      const raw = response.getRaw()
      if (!raw?.success || !raw.data) {
        throw new Error(raw?.message || 'Failed to update outfit')
      }

      return raw.data
    }

    // Otherwise, use JSON for simple updates
    const response = await ClientApi.put<Outfit>(`/Outfit/update/${outfitId}`, {
      name: data.name,
      comment: data.comment,
      isPublic: data.isPublic,
      isFavorite: data.isFavorite,
      seasons: data.seasons
    })

    const raw = response.getRaw()
    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to update outfit')
    }

    // If backend doesn't return the updated outfit data, return a partial outfit
    // The frontend will refetch the complete data
    return raw.data || ({
      id: outfitId,
      name: data.name,
      isFavorite: data.isFavorite,
      outfitSeasons: data.seasons
    } as Outfit)
  }

  /**
   * Delete an outfit
   */
  async deleteOutfit(outfitId: number): Promise<void> {
    const response = await ClientApi.delete(`/Outfit/${outfitId}`)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Xóa outfit thành công!')
    }
  }

  /**
   * Get item image for outfit builder
   */
  async getItemImage(itemId: number): Promise<{ src: string; name: string; itemId: number }> {
    const response = await ClientApi.get<{ src: string; name: string; itemId: number }>(
      `/Item/${itemId}/image`
    )

    return response.getRaw().data
  }

  /**
   * Generate clean garment (AI processing)
   */
  async generateCleanGarment(
    imageBase64: string,
    constraintsJson?: any
  ): Promise<{
    imageBase64: string
    colors?: string[]
    categories?: string[]
    name?: string
    description?: string
    sizes?: string[]
    seasons?: string[]
    occasions?: string[]
  }> {
    const payload: any = { imageBase64 }
    if (constraintsJson) {
      payload.ConstraintsJson = constraintsJson
    }

    const response = await ClientApi.post<{
      imageBase64: string
      colors?: string[]
      categories?: string[]
      name?: string
      description?: string
      sizes?: string[]
      seasons?: string[]
      occasions?: string[]
    }>('/Item/generateCleanGarment', payload)

    const raw = response.getRaw()

    if (!raw?.success || !raw.data) {
      const errorMessage = raw?.message || 'Failed to generate clean garment'
      throw new Error(errorMessage)
    }

    return raw.data
  }

  /**
   * Remove background from image
   */
  async removeBackground(userId: number, imageFile: File): Promise<{ imageBase64: string }> {
    const formData = new FormData()
    formData.append('userId', userId.toString())
    formData.append('imageFile', imageFile)

    const response = await ClientApi.upload<{ imageBase64: string }>(
      '/Item/remove-background',
      formData
    )

    const raw = response.getRaw()

    if (!raw?.success) {
      throw new Error(raw?.message || 'Failed to remove background')
    }

    // Handle nested data structure: raw.data.data.imageBase64
    // API returns: { success: true, data: { success: true, data: { imageBase64: "..." } } }
    let imageBase64: string | undefined

    // Check nested structure first (raw.data.data.imageBase64)
    const nestedData = (raw.data as any)?.data
    if (nestedData?.imageBase64) {
      imageBase64 = nestedData.imageBase64
    } else if ((raw.data as any)?.imageBase64) {
      // Direct structure: { success: true, data: { imageBase64: "..." } }
      imageBase64 = (raw.data as any).imageBase64
    }

    if (!imageBase64) {
      throw new Error(
        raw?.message ||
        'No imageBase64 found in response. Please check the API response structure.'
      )
    }

    return { imageBase64 }
  }

  /**
   * Create a new item
   */
  async createItem(data: CreateItemRequest): Promise<WardrobeItem> {
    if (!data.userId) {
      throw new Error('UserId is required to create an item')
    }

    const formData = new FormData()
    formData.append('UserId', data.userId.toString())
    formData.append('CategoryName', data.categoryName)
    formData.append('ImageFile', data.imageFile)
    formData.append('IsFavorite', String(data.isFavorite))
    formData.append('IsPublic', String(data.isPublic ?? false))
    if (data.size) {
      formData.append('Size', data.size)
    }
    formData.append('ItemName', data.itemName || data.comment || '')
    formData.append('Comment', data.comment || data.itemName || '')
    if (data.description) {
      formData.append('Description', data.description)
    }

    if (data.colors && data.colors.length > 0) {
      data.colors.forEach((color) => {
        formData.append('Colors', color)
      })
    }

    if (data.sizes && data.sizes.length > 0) {
      data.sizes.forEach((size) => {
        formData.append('Sizes', size)
      })
    }

    if (data.seasons && data.seasons.length > 0) {
      data.seasons.forEach((season) => {
        formData.append('Seasons', season)
      })
    }

    if (data.occasions && data.occasions.length > 0) {
      // Deduplicate occasions before sending to API
      const uniqueOccasions = Array.from(new Set(data.occasions))
      uniqueOccasions.forEach((occasion) => {
        formData.append('Occasions', occasion)
      })
    }

    const response = await ClientApi.upload<WardrobeItem>('/Item/create', formData)

    const raw = response.getRaw()
    
    // For this endpoint, backend returns Ok() with no body or minimal response
    // If we got here without an exception, the HTTP request succeeded
    // Check if there's an explicit success: false (error case)
    if (raw && raw.success === false) {
      throw new Error(raw?.message || 'Failed to create item')
    }

    // Don't show toast here - let the calling component handle success message with proper localization

    // Return data if exists, otherwise return a basic response
    return raw?.data || ({} as WardrobeItem)
  }

  /**
   * Update an item
   */
  async updateItem(itemId: number, data: UpdateItemRequest): Promise<WardrobeItem> {
    const formData = new FormData()

    // Required fields - always append
    if (data.categoryName) formData.append('CategoryName', data.categoryName)
    if (data.size) formData.append('Size', data.size)
    if (data.isFavorite !== undefined) formData.append('IsFavorite', String(data.isFavorite))

    // ItemName - the name of the item
    if (data.itemName !== undefined) {
      formData.append('ItemName', data.itemName || '')
    }

    // Description - optional description for the item
    if (data.description !== undefined) {
      formData.append('Description', data.description || '')
    }

    // Optional fields
    if (data.imageFile) formData.append('ImageFile', data.imageFile)
    if (data.isPublic !== undefined) formData.append('IsPublic', String(data.isPublic))

    // Add colors as array (append multiple times)
    if (data.colors && data.colors.length > 0) {
      data.colors.forEach((color) => {
        formData.append('Colors', color)
      })
    }

    // Add seasons as array (append multiple times)
    if (data.seasons && data.seasons.length > 0) {
      data.seasons.forEach((season) => {
        formData.append('Seasons', season)
      })
    }

    // Add occasions as array (append multiple times)
    if (data.occasions && data.occasions.length > 0) {
      data.occasions.forEach((occasion) => {
        formData.append('Occasions', occasion)
      })
    }

    const response = await ClientApi.uploadPut<WardrobeItem>(
      `/Item/update/${itemId}`,
      formData
    )

    const raw = response.getRaw()
    
    // For this endpoint, backend returns Ok() with no body or minimal response
    // If we got here without an exception, the HTTP request succeeded
    // Check if there's an explicit success: false (error case)
    if (raw && raw.success === false) {
      throw new Error(raw?.message || 'Failed to update item')
    }

    // Don't show toast here - let the calling component handle success message with proper localization

    // Return data if exists, otherwise return a basic response
    return raw?.data || ({} as WardrobeItem)
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: number): Promise<void> {
    const response = await ClientApi.delete(`/Item/${itemId}`)

    const raw = response.getRaw()
  }

  /**
   * Get user's collections
   */
  async getMyCollections(): Promise<Collection[]> {
    const response = await ClientApi.get<Collection[]>('/Collection/my-collections')

    const raw = response.getRaw()
    return raw?.data || []
  }

  /**
   * Get collection details
   */
  async getCollectionDetails(collectionId: number): Promise<CollectionDetail> {
    const response = await ClientApi.get<CollectionDetail>(
      `/Collection/${collectionId}/details`
    )

    return response.getRaw().data
  }

  /**
   * Create a new collection
   */
  async createCollection(data: CreateCollectionRequest): Promise<Collection> {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (data.imageCoverFile) formData.append('imageCoverFile', data.imageCoverFile)
    formData.append('isPublic', String(data.isPublic))

    const response = await ClientApi.upload<Collection>('/Collection/create', formData)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Tạo collection thành công!')
    }

    return raw.data
  }

  /**
   * Update a collection
   */
  async updateCollection(
    collectionId: number,
    data: UpdateCollectionRequest
  ): Promise<Collection> {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.description !== undefined) formData.append('description', data.description || '')
    if (data.imageCoverFile) formData.append('imageCoverFile', data.imageCoverFile)
    if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic))

    const response = await ClientApi.upload<Collection>(
      `/Collection/${collectionId}`,
      formData
    )

    const raw = response.getRaw()


    return raw.data
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: number): Promise<void> {
    const response = await ClientApi.delete(`/Collection/${collectionId}`)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Xóa collection thành công!')
    }
  }

  /**
   * Add outfit to collection
   */
  async addOutfitToCollection(
    collectionId: number,
    outfitId: number
  ): Promise<void> {
    const response = await ClientApi.post(`/Collection/${collectionId}/outfits`, { outfitId })

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Thêm outfit vào collection thành công!')
    }
  }

  /**
   * Remove outfit from collection
   */
  async removeOutfitFromCollection(
    collectionId: number,
    outfitId: number
  ): Promise<void> {
    const response = await ClientApi.delete(`/Collection/${collectionId}/outfits/${outfitId}`)

    const raw = response.getRaw()
    if (raw?.success) {
      showSuccessToast('Xóa outfit khỏi collection thành công!')
    }
  }

  /**
   * Get wardrobe wear statistics
   */
  async getWardrobeWearStatistics(): Promise<any> {
    const response = await ClientApi.get<any>('/Item/wardrobe/wear-statistics')

    const raw = response.getRaw()
    return raw?.data?.data || null
  }
}

export const wardrobeService = new WardrobeService()

