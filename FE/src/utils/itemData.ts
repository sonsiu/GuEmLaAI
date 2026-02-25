// Helper to load item.json from public folder
let itemDataCache: any = null

export const loadItemData = async () => {
  if (itemDataCache) {
    return itemDataCache
  }

  try {
    const response = await fetch('/item.json')
    if (!response.ok) {
      throw new Error('Failed to load item.json')
    }
    itemDataCache = await response.json()
    return itemDataCache
  } catch (error) {
    //console.error('Error loading item.json:', error)
    throw error
  }
}

// Helper function to flatten category data from JSON
export const flattenCategoryData = (itemData: any) => {
  const flattened: {
    name: string
    subcategories: { name: string; name_vn?: string; category_code: string }[]
  }[] = []
  const categories = itemData.category

  Object.entries(categories).forEach(([mainCategory, items]) => {
    const subcategories = items as { name: string; name_vn?: string; category_code: string }[]

    flattened.push({
      name: mainCategory,
      subcategories
    })
  })

  return flattened
}

// Helper function to get hex code for a color name
export const getColorHex = (itemData: any, colorName: string): string => {
  const colorObj = itemData.colors.find((c: any) => c.name.toLowerCase() === colorName.toLowerCase())
  return colorObj?.hex || '#CCCCCC'
}

// Helper function to get localized color name
export const getColorDisplayName = (itemData: any, colorName: string, lang: string = 'en'): string => {
  const colorObj = itemData.colors.find((c: any) => c.name.toLowerCase() === colorName.toLowerCase())
  if (!colorObj) return colorName
  return lang === 'vi' ? (colorObj.name_vn || colorObj.name) : colorObj.name
}

// Helper function to get Vietnamese category/subcategory name
export const getCategoryVietnameseName = (itemData: any, categoryCode: string): string => {
  for (const [mainCat, items] of Object.entries(itemData.category)) {
    const foundItem = (items as Array<{ name: string; name_vn: string; category_code: string }>).find(
      item => item.category_code === categoryCode
    )
    if (foundItem) {
      return foundItem.name_vn || foundItem.name
    }
  }
  return categoryCode
}

// Helper function to get localized category name based on language
export const getCategoryDisplayName = (itemData: any, categoryCode: string, lang: string = 'en'): string => {
  for (const [mainCat, items] of Object.entries(itemData.category)) {
    const foundItem = (items as Array<{ name: string; name_vn: string; category_code: string }>).find(
      item => item.category_code === categoryCode
    )
    if (foundItem) {
      return lang === 'vi' ? (foundItem.name_vn || foundItem.name) : foundItem.name
    }
  }
  return categoryCode
}
