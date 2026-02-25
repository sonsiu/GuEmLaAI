import type { USER_ROLE } from '@/@core/constants/global.const'

export interface IAccount {
  id: string | number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  fullName?: string
  displayName?: string
  email: string
  role: USER_ROLE
  isActive?: boolean
  password?: string
  managedBy?: string | null
  accessToken?: string
  refreshToken?: string
  avatar?: string | null
  referralCode?: string
  referralStatus?: string
  referredById?: number
  itemUploadCount?: number
  outfitUploadCount?: number
  virtualTryOnUsedCount?: number
  modelPicture?: string
  modelPictureUrl?: string
}

export interface IRegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface Twofa {
  enable: boolean
}

export interface ILoginResponse {
  user?: Omit<IAccount, 'password'>
  accessToken: string
  refreshToken?: string

  // Direct response fields (when API returns flat structure)
  id?: string | number
  displayName?: string
  email?: string
  role?: USER_ROLE
  referralCode?: string
  referralStatus?: string
  referredById?: number
  itemUploadCount?: number
  outfitUploadCount?: number
  virtualTryOnUsedCount?: number
}

export interface ILoginRequest {
  email: string
  password: string
  code?: string
}

export interface IJwtPayload extends IAccount {
  accessToken: string
  refreshToken: string
}

export type AuthGuardProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export type GuestGuardProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export enum HealthGoal {
  LOSE_WEIGHT = 'LOSE WEIGHT',
  GAIN_WEIGHT = 'GAIN WEIGHT',
  GAIN_MUSCLE = 'GAIN MUSCLE',
  MAINTAIN = 'MAINTAIN WEIGHT',
  IMPROVE_ENDURANCE = 'IMPROVE ENDURANCE',
  INCREASE_ENERGY = 'INCREASE ENERGY',
  IMPROVE_FLEXIBILITY = 'IMPROVE FLEXIBILITY',
  REDUCE_STRESS = 'REDUCE STRESS',
  IMPROVE_SLEEP = 'IMPROVE SLEEP QUALITY',
  BETTER_NUTRITION = 'BETTER NUTRITION',
  HEALTHY_AGING = 'HEALTHY AGING'
}

export const HealthGoalOptions = [
  { label: 'Giảm cân', value: HealthGoal.LOSE_WEIGHT },
  { label: 'Tăng cân', value: HealthGoal.GAIN_WEIGHT },
  { label: 'Tăng cơ', value: HealthGoal.GAIN_MUSCLE },
  { label: 'Duy trì cân nặng', value: HealthGoal.MAINTAIN },
  { label: 'Cải thiện sức bền', value: HealthGoal.IMPROVE_ENDURANCE },
  { label: 'Tăng năng lượng', value: HealthGoal.INCREASE_ENERGY },
  { label: 'Cải thiện độ dẻo dai', value: HealthGoal.IMPROVE_FLEXIBILITY },
  { label: 'Giảm căng thẳng', value: HealthGoal.REDUCE_STRESS },
  { label: 'Cải thiện giấc ngủ', value: HealthGoal.IMPROVE_SLEEP },
  { label: 'Dinh dưỡng tốt hơn', value: HealthGoal.BETTER_NUTRITION },
  { label: 'Lão hóa lành mạnh', value: HealthGoal.HEALTHY_AGING }
]

export enum MealPreference {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACKS = 'SNACKS',
  ALL_MEALS = 'ALL MEALS',
  NO_PREFERENCE = 'NO PREFERENCE'
}

export enum ActivityFactorEnum {
  LOW = 1.2,
  MODERATE = 1.55,
  HIGH = 1.75,
  VERY_HIGH = 1.9
}

export const ActivityFactorValues = [
  { label: 'Thấp (ít hoặc không vận động)', value: ActivityFactorEnum.LOW },
  { label: 'Trung bình (vận động vừa phải hoặc tập luyện 3-5 lần/tuần)', value: ActivityFactorEnum.MODERATE },
  { label: 'Cao (vận động mạnh hoặc tập luyện 6-7 lần/tuần)', value: ActivityFactorEnum.HIGH },
  { label: 'Rất cao (vận động mạnh hoặc tập luyện 2 lần/ngày)', value: ActivityFactorEnum.VERY_HIGH }
]

export interface IProfile {
  userId: string
  weight: number
  height: number
  waist?: number
  bmi?: number
  healthGoal: HealthGoal
  targetWeight?: number
  bodyFatPercentage?: number
  muscleMass?: number
  dailyWaterIntake?: number
  dailySteps?: number
  allergies?: string[]
  foodRestrictions?: string[]
  dietaryPreference?: string
  mealPreference?: MealPreference
  dailyCalorieGoal?: number
  dailyCalorieBurn?: number
  medicalConditions?: string
  supplements?: string
  workoutSchedule?: ActivityFactorEnum
  age?: number
  gender?: 'male' | 'female'
  deletedAt?: Date | null
}
