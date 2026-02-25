import { ClientApi } from './client-api.service'
import { showSuccessToast } from './toast.service'
import type { ModelUserResponse, UserProfile } from './user.types'

export const userService = {

  /**
   * Get user profile from backend API (direct call)
   */
  getUserProfileFromBackend: async (): Promise<UserProfile> => {
    const response = await ClientApi.get<UserProfile>('/UserProfile/profile')
    const raw = response.getRaw()
    const profileData = raw.data
    return profileData
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (profileData: {
    displayName?: string
    bio?: string
    height?: number
    weight?: number
    profileImage?: File
  }): Promise<UserProfile> => {
    const formData = new FormData()

    // Only append fields that are provided
    // Backend expects: DisplayName, Bio, Height, Weight, ProfileImage
    if (profileData.displayName !== undefined) {
      formData.append('DisplayName', profileData.displayName)
    }
    if (profileData.bio !== undefined) {
      formData.append('Bio', profileData.bio)
    }
    if (profileData.height !== undefined) {
      formData.append('Height', profileData.height.toString())
    }
    if (profileData.weight !== undefined) {
      formData.append('Weight', profileData.weight.toString())
    }
    if (profileData.profileImage) {
      formData.append('ProfileImage', profileData.profileImage)
    }

    const response = await ClientApi.uploadPut<UserProfile>('/UserProfile/profile', formData)

    const raw = response.getRaw()

    if (raw?.success) {
      showSuccessToast('Cập nhật profile thành công!')

      // Backend may return { message: "...", profile: {...} } or direct profile
      if (raw.data && typeof raw.data === 'object' && 'profile' in raw.data) {
        return (raw.data as { profile: UserProfile }).profile
      }

      return raw.data
    } else {
      throw new Error(raw?.message || raw?.errors || 'Failed to update profile')
    }
  },

  /**
   * Get model picture metadata & daily counters for try-on
   */
  getModelUser: async (): Promise<ModelUserResponse> => {
    const response = await ClientApi.get<ModelUserResponse>('/UserProfile/loadModelPicture')

    return response.getRaw().data
  },

  /**
   * Get default model picture from profile
   */
  getDefaultModelPicture: async (): Promise<{ modelPicture: string | null; modelPictureUrl: string | null }> => {
    const response = await ClientApi.get<{ modelPicture: string | null; modelPictureUrl: string | null }>('/UserProfile/defaultModelPicture')
    return response.getRaw().data
  }
}
