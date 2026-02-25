/**
 * Referral Type Definitions
 * Types for managing referral program
 */

/**
 * Referee Response Model
 */
export interface Referee {
  refereeId: string
  refereeName: string
  refereeStatus: 'Pending' | 'Completed'
  createDate: string
}

/**
 * Referral Info Response
 */
export interface ReferralInfo {
  referralCode: string
  referralStatus: string
  referredById: number | null
  referrer: string | null
  itemsCreatedCount: number
  outfitsCreatedCount: number
  vtoUsedCount: number
  referees: Referee[]
}

/**
 * Apply Referral Request
 */
export interface ApplyReferralRequest {
  referralCode: string
}

/**
 * Apply Referral Response
 */
export interface ApplyReferralResponse {
  success: boolean
  message: string
}

