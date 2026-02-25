'use client'

export interface PublicOutfitItem {
  id: number
  outfitId: number
  name: string
  imageUrl: string
  buyLink?: string | null
  color?: string | null
  displayOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface PublicOutfit {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
  displayOrder: number
  seasons: string[]
  items?: PublicOutfitItem[]
  itemsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PublicOutfitDetail extends PublicOutfit {
  items: PublicOutfitItem[]
}

export interface UpsertPublicOutfitPayload {
  name: string
  description?: string
  isActive: boolean
  displayOrder: number
  seasons: string[]
  imageFile?: File | null
}

export interface UpsertPublicOutfitItemPayload {
  name: string
  buyLink?: string
  color?: string
  displayOrder: number
  imageFile?: File | null
}

