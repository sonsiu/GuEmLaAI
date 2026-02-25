'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'

interface CategoryFilterBarProps {
  selectedCategory?: string
  onCategoryChange: (category: string | undefined) => void
}

const CATEGORY_LIST = ['Top', 'Bottom', 'Outerwear', 'Footwear', 'Bag', 'Accessory']

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const theme = useTheme()

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      // Deselect if clicking the same category
      onCategoryChange(undefined)
    } else {
      // Select new category
      onCategoryChange(category)
    }
  }

  const handleClearFilter = () => {
    onCategoryChange(undefined)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        mb: 3,
        pb: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'divider',
          borderRadius: '2px',
        },
        scrollBehavior: 'smooth',
      }}
    >
      {CATEGORY_LIST.map((category) => (
        <Button
          key={category}
          onClick={() => handleCategoryClick(category)}
          sx={{
            flexShrink: 0,
            px: 3,
            py: 1.25,
            borderRadius: '20px',
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: selectedCategory === category ? 700 : 500,
            border: '1px solid',
            borderColor: selectedCategory === category ? 'primary.main' : 'divider',
            bgcolor: selectedCategory === category ? 'primary.main' : 'transparent',
            color: selectedCategory === category ? 'primary.contrastText' : 'text.primary',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: selectedCategory === category ? 'primary.main' : 'action.hover',
            }
          }}
        >
          {category}
        </Button>
      ))}
      
      {selectedCategory && (
        <Button
          onClick={handleClearFilter}
          sx={{
            flexShrink: 0,
            px: 3,
            py: 1.25,
            borderRadius: '20px',
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: 500,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'transparent',
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            ml: 'auto',
            '&:hover': {
              borderColor: 'error.main',
              color: 'error.main',
            }
          }}
        >
          ✕ Clear
        </Button>
      )}
    </Box>
  )
}

export default CategoryFilterBar
