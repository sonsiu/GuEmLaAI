'use client'

import { useState } from 'react'
import { IconButton, Menu, MenuItem } from '@mui/material'

interface Props {
  onSelectPage: () => void
  onSelectAll: () => void
}

export default function SelectActionDropdown({ onSelectPage, onSelectAll }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (type: 'page' | 'all') => {
    if (type === 'page') onSelectPage()
    else onSelectAll()
    handleClose()
  }

  return (
    <>
      <IconButton size='small' onClick={handleOpen}>
        <i className='tabler-chevron-down text-base' />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleSelect('page')}>Select page</MenuItem>
        <MenuItem onClick={() => handleSelect('all')}>Select all</MenuItem>
      </Menu>
    </>
  )
}
