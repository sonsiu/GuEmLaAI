'use client'

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast } from '@/services/toast.service'
import type { WardrobeItem } from '@/types/wardrobe.type'

interface ItemSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelectItem: (item: WardrobeItem) => void
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({
  open,
  onClose,
  onSelectItem
}) => {
  const theme = useTheme()
  const { user } = useAuth()
  const { t } = useTranslation()

  const [items, setItems] = useState<WardrobeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectingItemId, setSelectingItemId] = useState<number | null>(null)

  useEffect(() => {
    if (open && user?.id) {
      fetchItems()
      setSearchQuery('')
      setSelectingItemId(null)
    } else if (!open) {
      // Reset state when modal closes
      setSelectingItemId(null)
      setSearchQuery('')
    }
  }, [open, user?.id])

  const fetchItems = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
      const response = await wardrobeService.getUserItems(userId, 1, 100)
      if (response?.data) {
        setItems(response.data)
      }
    } catch (error) {
      // console.error('Error fetching items:', error)
      showErrorToast('Failed to load items')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.categoryName.toLowerCase().includes(query) ||
      item.comment?.toLowerCase().includes(query)
    )
  })

  const handleItemClick = async (item: WardrobeItem) => {
    if (selectingItemId !== null) return // Prevent multiple clicks
    
    setSelectingItemId(item.id)
    try {
      await onSelectItem(item)
      // Close modal immediately after successful selection
      onClose()
    } catch (error) {
      // console.error('Error selecting item:', error)
      setSelectingItemId(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className="tabler-wardrobe" style={{ fontSize: 24 }} />
          <Typography variant="h6">
            {t('tryOn.wardrobe.outfitBuilder.itemModal.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={t('tryOn.wardrobe.outfitBuilder.itemModal.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="tabler-search" />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t('tryOn.wardrobe.outfitBuilder.itemModal.noItems')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => {
              const isSelecting = selectingItemId === item.id
              
              return (
                <Grid item xs={6} sm={4} md={3} key={item.id}>
                  <Card
                    sx={{
                      cursor: isSelecting ? 'wait' : 'pointer',
                      position: 'relative',
                      border: isSelecting ? 2 : 1,
                      borderColor: isSelecting ? 'primary.main' : 'divider',
                      '&:hover': {
                        transform: isSelecting ? 'none' : 'translateY(-4px)',
                        boxShadow: isSelecting ? 2 : 4
                      },
                      transition: 'all 0.2s ease-in-out',
                      opacity: isSelecting ? 0.7 : 1
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <CardMedia
                      component="img"
                      image={item.imageUrl || '/placeholder.png'}
                      alt={item.categoryName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== '/placeholder.png') {
                          target.src = '/placeholder.png'
                        }
                      }}
                      sx={{
                        aspectRatio: '1/1',
                        objectFit: 'cover'
                      }}
                    />
                    
                    {/* Loading/Selected Overlay */}
                    {isSelecting && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'primary.main',
                          opacity: 0.4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                          borderRadius: 1
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 3
                          }}
                        >
                          <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                        </Box>
                      </Box>
                    )}
                    
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {item.comment || item.categoryName}
                        </Typography>
                        {isSelecting && (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <i className="tabler-check" style={{ color: theme.palette.primary.contrastText, fontSize: 14 }} />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ItemSelectionModal

