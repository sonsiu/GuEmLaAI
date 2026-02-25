import { ClientApi } from './client-api.service'
import type {
  ReferralInfo,
  ApplyReferralRequest,
  ApplyReferralResponse
} from '@/types/referral.type'

class ReferralService {
  /**
   * Get referral information
   */
  async getReferralInfo(): Promise<ReferralInfo | null> {
    const response = await ClientApi.get<ReferralInfo>('/Referral/referral-info')

    const raw = response.getRaw()
    if (!raw?.success || !raw.data) {
      return null
    }

    return raw.data
  }

  /**
   * Apply referral code
   */
  async applyReferralCode(data: ApplyReferralRequest): Promise<ApplyReferralResponse> {
    const response = await ClientApi.post<ApplyReferralResponse>(
      '/Referral/apply-referral',
      data
    )

    const raw = response.getRaw()
    if (!raw?.success || !raw.data) {
      throw new Error(raw?.message || 'Failed to apply referral code')
    }

    return raw.data
  }
}

export const referralService = new ReferralService()

