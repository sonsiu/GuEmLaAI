import { useRef, useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import type { TableSearchOptions } from '@/types/table.type'
import { useTranslation } from '@/@core/hooks/useTranslation'
import CustomTextField from '../../mui/TextField'
import { useDebouncedCallback } from '@/@core/hooks/useDebouncedCallBack'
import { showInfoToast } from '@/services/toast.service'

interface Props {
  searchOptions: TableSearchOptions
  onSearch: (params: any) => void
}

export default function TableSearchBar({ searchOptions, onSearch }: Props) {
  const { t } = useTranslation()

  const {
    searchButtonText = t('table.search'),
    variant = 'contained',
    color = 'primary',
    onClick
  } = searchOptions.searchWithButton || {}

  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const debounceTime = searchOptions?.debounceTime ?? 500
  const showSearchButton = !!searchOptions?.searchWithButton
  const prevSearchValue = useRef<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const [searchEffect, setSearchEffect] = useState(false)

  const [debouncedSearch] = useDebouncedCallback((value: string) => {
    if (!searchOptions?.searchWithButton && value !== prevSearchValue.current) {
      prevSearchValue.current = value
      onSearch({
        [searchOptions?.searchField ?? 'text']: value
      })
    }
  }, debounceTime)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setSearchValue(value)

    if (!showSearchButton) debouncedSearch(value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchOptions?.searchWithButton) {
      handleManualSearch()
    }
  }

  const handleManualSearch = () => {
    if (searchValue === prevSearchValue.current) return
    handleSearchEffect()

    prevSearchValue.current = searchValue

    if (onClick) {
      onClick()
      return
    }

    showInfoToast(`Searching for "${searchValue}"`)

    onSearch({
      [searchOptions?.searchField ?? 'text']: searchValue
    })
  }

  const handleClear = () => {
    setSearchValue('')
    onSearch({
      [searchOptions?.searchField ?? 'text']: ''
    })
  }

  const handleSearchEffect = () => {
    setSearchEffect(true)
    setTimeout(() => {
      setSearchEffect(false)
    }, 3000)
  }

  return (
    <div className={`flex-1 min-w-[200px] max-w-md flex items-center gap-2 ${searchOptions?.className || ''}`}>
      <CustomTextField
        fullWidth
        size='small'
        placeholder={searchOptions?.placeholder || t('table.search')}
        variant='outlined'
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleSearchKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <i className='tabler-search !text-lg !font-semibold' />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment
                position='end'
                onClick={handleClear}
                className={`cursor-pointer ${isFocused ? 'text-primary' : 'text-textSecondary'}`}
              >
                <i className='tabler-x !text-lg !font-extrabold' />
              </InputAdornment>
            )
          }
        }}
        className={`transition-all ease-in-out ${searchEffect === true ? 'scale-[95%]' : 'scale-100 hover:scale-[103%]'}`}
        style={{
          boxShadow: searchEffect
            ? `0 0 20px 5px ${theme.palette.primary.main}80` // Thêm shadow tỏa ra với màu primary (80 là độ mờ hex)
            : 'none'
        }}
      />
      {showSearchButton && (
        <Button variant={variant} color={color} onClick={handleManualSearch}>
          {searchButtonText}
        </Button>
      )}
    </div>
  )
}
