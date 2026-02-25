
import { wardrobeService } from '@/services/wardrobe.service'

/**
 * Cache for item/outfit images to avoid repeated API calls
 * Key: id (number), Value: { url: string, timestamp: number }
 */
const imageCache = new Map<number, { url: string; timestamp: number }>()

const CACHE_DURATION = 55 * 60 * 1000 // 55 minutes

/**
 * Get cached or fetch item image URL
 */
export const getCachedItemImage = async (itemId: number): Promise<string> => {
    if (!itemId) return ''

    // Check cache first
    const cached = imageCache.get(itemId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.url
    }

    try {
        const data = await wardrobeService.getItemImage(itemId)
        if (data && data.src) {
            imageCache.set(itemId, {
                url: data.src,
                timestamp: Date.now()
            })
            return data.src
        }
    } catch (error) {
        //console.warn(`Failed to fetch image for item ${itemId}`, error)
    }

    return ''
}

/**
 * Get cached or fetch outfit image URL
 * Note: WardrobeService doesn't have explicit getOutfitImage but we can use getOutfit or similar if needed.
 * However, the source code uses GET_OUTFIT_IMAGE which returns { src: string }.
 * WardrobeService doesn't seem to have getOutfitImage exposed but it has getOutfit.
 * We might need to add getOutfitImage to WardrobeService or use ClientApi directly here.
 * Actually, let's use ClientApi directly here for now to match source logic if WardrobeService is missing it.
 * Wait, WardrobeService has getItemImage. Does it work for outfits?
 * Source config has GET_OUTFIT_IMAGE: (itemId) => .../api/Outfit/${itemId}/image
 * It seems distinct.
 */
import { ClientApi } from '@/services/client-api.service'

export const getCachedOutfitImage = async (outfitId: number): Promise<string> => {
    if (!outfitId) return ''

    // Check cache (using negative ID or separate cache? separate cache is better but let's use same map with offset or just separate map)
    // Let's use a separate map for outfits to avoid ID collision
    const cached = outfitImageCache.get(outfitId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.url
    }

    try {
        const response = await ClientApi.get<{ src: string }>(`/Outfit/${outfitId}/image`)
        const data = response.getRaw().data
        if (data && data.src) {
            outfitImageCache.set(outfitId, {
                url: data.src,
                timestamp: Date.now()
            })
            return data.src
        }
    } catch (error) {
        //console.warn(`Failed to fetch image for outfit ${outfitId}`, error)
    }

    return ''
}

const outfitImageCache = new Map<number, { url: string; timestamp: number }>()
