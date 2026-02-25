export interface UserProfile {
  id: number
  username?: string
  displayName?: string
  email: string
  profilePicture?: string
  profilePictureUrl?: string
  modelPicture?: string
  modelPictureUrl?: string
  modelPictureUrls?: string[]
  bio?: string
  height?: number
  weight?: number
  bmi?: number
  createDate?: string
  updatedAt?: string
  availableToken?: number
  referralCode?: string
  todayModelPictureCreatedCount?: number
  todayImageGeneratedCount?: number
  todayItemGeneratedCount?: number
  maxImageGeneratePerDay?: number
  maxItemGeneratePerDay?: number
  maxModelCreatePerDay?: number
}

export interface ModelUserResponse {
  modelPictureUrls?: string[]
  defaultModelPictureUrl?: string // Filename of default model (e.g., "image.jpg")
  todayModelPictureCreatedCount: number
  todayImageGeneratedCount: number
  todayItemGeneratedCount: number
}

