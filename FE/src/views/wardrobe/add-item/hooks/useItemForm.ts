import { useState } from 'react'

export const useItemForm = () => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')
  const [selectedSubCategoryVn, setSelectedSubCategoryVn] = useState('')
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([])
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false)
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false)
  const [occasionDropdownOpen, setOccasionDropdownOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const resetForm = () => {
    setSelectedCategory('')
    setSelectedSubCategory('')
    setSelectedSubCategoryVn('')
    setSelectedCategoryCode('')
    setSelectedSize('')
    setItemName('')
    setItemDescription('')
    setSelectedColors([])
    setSelectedSeasons([])
    setSelectedSizes([])
    setSelectedOccasions([])
    setCategoryDropdownOpen(false)
    setSizeDropdownOpen(false)
    setColorDropdownOpen(false)
    setSeasonDropdownOpen(false)
    setOccasionDropdownOpen(false)
    setExpandedCategories([])
  }

  return {
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    selectedSubCategoryVn,
    setSelectedSubCategoryVn,
    selectedCategoryCode,
    setSelectedCategoryCode,
    selectedSize,
    setSelectedSize,
    itemName,
    setItemName,
    itemDescription,
    setItemDescription,
    selectedColors,
    setSelectedColors,
    selectedSeasons,
    setSelectedSeasons,
    selectedSizes,
    setSelectedSizes,
    selectedOccasions,
    setSelectedOccasions,
    categoryDropdownOpen,
    setCategoryDropdownOpen,
    sizeDropdownOpen,
    setSizeDropdownOpen,
    colorDropdownOpen,
    setColorDropdownOpen,
    seasonDropdownOpen,
    setSeasonDropdownOpen,
    occasionDropdownOpen,
    setOccasionDropdownOpen,
    expandedCategories,
    setExpandedCategories,
    resetForm
  }
}

