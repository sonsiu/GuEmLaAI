/**
 * Wardrobe Filtering Type Definitions
 * Types and constants for advanced wardrobe item filtering
 */

/**
 * Represents active filter selections by the user
 */
export interface WardrobeFilters {
    category?: string
    colors?: string[]
    occasions?: string[]
    sizes?: string[]
    seasons?: string[]
    isFavorite?: boolean
    isPublic?: boolean
    searchQuery?: string
}

/**
 * Represents available filter options with metadata
 */
export interface FilterOptions {
    categories: FilterOption[]
    colors: FilterOption[]
    occasions: FilterOption[]
    sizes: FilterOption[]
    seasons: FilterOption[]
}

/**
 * Individual filter option
 */
export interface FilterOption {
    value: string
    label: string
    count?: number // Number of items matching this filter
}

/**
 * Filter state for UI components
 */
export interface FilterState {
    isOpen: boolean
    selectedCategory: string | null
    selectedColors: Set<string>
    selectedOccasions: Set<string>
    selectedSizes: Set<string>
    selectedSeasons: Set<string>
    searchQuery: string
    filterMode: 'all' | 'favorite' | 'public' // Existing filter type
}

/**
 * Sample filter values extracted from item.json
 */
export const FILTER_DEFAULTS = {
    CATEGORIES: [
        { value: 'Top', label: 'Top' },
        { value: 'Bottom', label: 'Bottom' },
        { value: 'Outerwear', label: 'Outerwear' },
        { value: 'Footwear', label: 'Footwear' },
        { value: 'Bag', label: 'Bag' },
        { value: 'Accessory', label: 'Accessory' }
    ],

    SIZES: [
        'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL',
        '1X', '2X', '3X', '4XL', '5XL', '6XL', 'S/M', 'M/L',
        'EU 35', 'EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40',
        'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45', 'EU 46',
        'One size', 'Free size', 'Adjustable', 'No size', 'Other'
    ],

    SEASONS: [
        'Spring', 'Summer', 'Autumn', 'Winter', 'All year round', 'No season'
    ],

    OCCASIONS: [
        'Casual', 'Formal', 'Business', 'Party', 'Sports', 'Beach',
        'Workout', 'Date Night', 'Wedding', 'Travel', 'Office', 'Concert',
        'Festival', 'Clubbing', 'Bar', 'Gym', 'Yoga', 'Outdoor',
        'Picnic', 'Gala', 'Graduation', 'Birthday', 'Anniversary',
        'Interview', 'Presentation', 'Conference', 'Pajamas', 'Swimwear',
        'Ski Trip', 'Mountain', 'Honeymoon', 'Resort', 'Other'
    ],

    COLORS: [
        'Red', 'Pink', 'Hot Pink', 'Light Pink', 'Bordeaux', 'Magenta',
        'Purple', 'Lavender', 'Orange', 'Coral', 'Neon Orange', 'Yellow',
        'Light Yellow', 'Mustard', 'Neon Yellow', 'Green', 'Light Green',
        'Emerald Green', 'Neon Green', 'Khaki', 'Olive', 'Blue', 'Baby Blue',
        'Light Blue', 'Turquoise', 'Navy', 'Royal Blue', 'Neon Blue',
        'Brown', 'Tan', 'Beige', 'Cream', 'Ecru', 'White', 'Off-White',
        'Grey', 'Light Gray', 'Charcoal', 'Black', 'Gold', 'Silver',
        'Copper', 'Denim', 'Black Denim', 'Multicolor'
    ]
}

/**
 * Helper function to build filter query object from selected filters
 */
export const buildFilterQuery = (filters: WardrobeFilters): Record<string, any> => {
    const query: Record<string, any> = {}

    if (filters.category) query.category = filters.category
    if (filters.colors?.length) query.colors = filters.colors
    if (filters.occasions?.length) query.occasions = filters.occasions
    if (filters.sizes?.length) query.sizes = filters.sizes
    if (filters.seasons?.length) query.seasons = filters.seasons
    if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite
    if (filters.isPublic !== undefined) query.isPublic = filters.isPublic
    if (filters.searchQuery) query.search = filters.searchQuery

    return query
}

/**
 * Helper function to check if any filters are active
 */
export const hasActiveFilters = (filters: WardrobeFilters): boolean => {
    return !!(
        filters.category ||
        filters.colors?.length ||
        filters.occasions?.length ||
        filters.sizes?.length ||
        filters.seasons?.length ||
        filters.isFavorite !== undefined ||
        filters.isPublic !== undefined ||
        filters.searchQuery
    )
}

/**
 * Helper function to get filter count for UI badge
 */
export const getActiveFilterCount = (filters: WardrobeFilters): number => {
    let count = 0
    if (filters.category) count++
    if (filters.colors?.length) count++
    if (filters.occasions?.length) count++
    if (filters.sizes?.length) count++
    if (filters.seasons?.length) count++
    if (filters.isFavorite !== undefined) count++
    if (filters.isPublic !== undefined) count++
    if (filters.searchQuery) count++
    return count
}
