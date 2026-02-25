'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Pagination from '@mui/material/Pagination'

import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { publicCollectionService } from '@/services/public-collection.service'
import { wardrobeService } from '@/services/wardrobe.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type {
  PublicOutfit,
  PublicOutfitDetail,
  PublicOutfitItem,
  UpsertPublicOutfitItemPayload,
  UpsertPublicOutfitPayload
} from '@/types/public-collection.type'
import { loadItemData } from '@/utils/itemData'

const defaultImage =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=60'

const PublicCollectionView: React.FC = () => {
  const { t } = useTranslation()
  const { isAdmin: isUserAdmin, user, loading: authLoading } = useAdminAuth()
  const [outfits, setOutfits] = useState<PublicOutfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonOptions, setSeasonOptions] = useState<string[]>([])
  const [outfitDialogOpen, setOutfitDialogOpen] = useState(false)
  const [editingOutfit, setEditingOutfit] = useState<PublicOutfit | null>(null)
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false)
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const itemsPerPage = 8

  useEffect(() => {
    loadItemData()
      .then(data => setSeasonOptions(data?.seasons || []))
      .catch(() => setSeasonOptions([]))
  }, [])

  const loadOutfits = async () => {
    if (!user?.accessToken) return
    setLoading(true)
    setError(null)

    try {
      const data = await publicCollectionService.getOutfits()
      const normalizedOutfits = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.items)
          ? (data as any).items
          : []
      setOutfits(normalizedOutfits)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.errors.generic') || 'Failed to load outfits'
      setError(message)
      showErrorToast(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.accessToken && isUserAdmin) {
      loadOutfits()
    }
  }, [user, isUserAdmin])

  const filteredOutfits = useMemo(() => {
    let result = outfits

    if (statusFilter !== 'all') {
      const shouldBeActive = statusFilter === 'active'
      result = result.filter(outfit => Boolean(outfit.isActive) === shouldBeActive)
    }

    const query = searchQuery.trim().toLowerCase()
    if (!query) return result

    return result.filter(
      outfit =>
        outfit.name.toLowerCase().includes(query) ||
        (outfit.description && outfit.description.toLowerCase().includes(query))
    )
  }, [outfits, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      total: filteredOutfits.length,
      active: filteredOutfits.filter(o => o.isActive).length,
      inactive: filteredOutfits.filter(o => !o.isActive).length
    }),
    [filteredOutfits]
  )

  const handleDelete = async (outfitId: number) => {
    const confirmed = window.confirm(t('admin.publicCollection.deleteConfirm'))
    if (!confirmed) return

    try {
      await publicCollectionService.deleteOutfit(outfitId)
      await loadOutfits()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa outfit'
      showErrorToast(message)
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={56} />
      </Box>
    )
  }

  if (!isUserAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={56} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          background:
            'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-info-main) 100%)',
          color: 'white',
          py: 4,
          mb: 4
        }}
      >
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className='tabler-sparkles' style={{ fontSize: '2rem' }} />
              </Box>
              <Box>
                <Typography variant='h4' fontWeight={700}>
                  {t('admin.publicCollection.title')}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {t('admin.publicCollection.subtitle')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                color='inherit'
                startIcon={<i className='tabler-refresh' />}
                onClick={loadOutfits}
                sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
              >
                {t('admin.publicCollection.refresh')}
              </Button>
              <Button
                variant='contained'
                color='secondary'
                startIcon={<i className='tabler-plus' />}
                onClick={() => {
                  setEditingOutfit(null)
                  setOutfitDialogOpen(true)
                }}
              >
                {t('admin.publicCollection.createOutfit')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 4, lg: 6 }, pb: 6 }}>
        

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  {t('admin.publicCollection.stats.totalOutfits')}
                </Typography>
                <Typography variant='h4' fontWeight={700}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  {t('admin.publicCollection.stats.active')}
                </Typography>
                <Typography variant='h4' fontWeight={700} color='success.main'>
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  {t('admin.publicCollection.stats.inactive')}
                </Typography>
                <Typography variant='h4' fontWeight={700} color='error.main'>
                  {stats.inactive}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Search Bar */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            gap: 1.5,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' }
          }}
        >
          <TextField
            fullWidth
            placeholder={t('admin.publicCollection.search.placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page when searching
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setSearchQuery('')
                      setPage(1)
                    }}
                  >
                    <i className='tabler-x' />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper'
              }
            }}
          />

          <TextField
            select
            size='small'
            label={t('admin.publicCollection.search.status')}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as typeof statusFilter)
              setPage(1)
            }}
            sx={{
              width: { xs: '100%', sm: 220 },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper'
              }
            }}
          >
            <MenuItem value='all'>{t('admin.publicCollection.search.all')}</MenuItem>
            <MenuItem value='active'>{t('admin.publicCollection.search.active')}</MenuItem>
            <MenuItem value='inactive'>{t('admin.publicCollection.search.inactive')}</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color='text.secondary'>
              {t('admin.publicCollection.loading')}
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : filteredOutfits.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant='h6' gutterBottom>
              {searchQuery || statusFilter !== 'all' ? t('admin.publicCollection.empty.noResults') : t('admin.publicCollection.empty.noOutfits')}
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 2 }}>
              {searchQuery || statusFilter !== 'all'
                ? t('admin.publicCollection.empty.tryDifferentFilter')
                : t('admin.publicCollection.empty.createFirst')}
            </Typography>
            {searchQuery || statusFilter !== 'all' ? (
              <Button
                variant='outlined'
                startIcon={<i className='tabler-x' />}
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setPage(1)
                }}
              >
                {t('admin.publicCollection.empty.clearFilters')}
              </Button>
            ) : (
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setOutfitDialogOpen(true)}>
                {t('admin.publicCollection.createOutfit')}
              </Button>
            )}
          </Card>
        ) : (
          <Box>
            <Grid container spacing={2}>
              {filteredOutfits.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(outfit => (
                <Grid item xs={12} sm={6} lg={3} key={outfit.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  {/* Items Grid (2x2) */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gridTemplateRows: 'repeat(2, 1fr)',
                      gap: 0,
                      aspectRatio: '1',
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                      background: 'linear-gradient(to bottom right, var(--mui-palette-primary-lighterOpacity), var(--mui-palette-error-lighterOpacity))'
                    }}
                  >
                    {/* Show up to 4 items in 2x2 grid */}
                    {[...Array(4)].map((_, idx) => {
                      const item = outfit.items?.[idx]
                      return (
                        <Box
                          key={idx}
                          sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            borderRight: idx % 2 === 0 ? '1px solid' : 'none',
                            borderBottom: idx < 2 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          {item ? (
                            <Box
                              component='img'
                              src={item.imageUrl}
                              alt={item.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                color: 'action.disabled'
                              }}
                            >
                              <i className='tabler-photo-off' style={{ fontSize: '1.5rem' }} />
                            </Box>
                          )}
                        </Box>
                      )
                    })}
                  </Box>

                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant='h6' fontWeight={700} sx={{ pr: 1 }}>
                        {outfit.name}
                      </Typography>
                      <Chip
                        size='small'
                        color={outfit.isActive ? 'success' : 'default'}
                        label={outfit.isActive ? t('admin.publicCollection.card.active') : t('admin.publicCollection.card.inactive')}
                      />
                    </Box>
                    {outfit.description && (
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                        {outfit.description}
                      </Typography>
                    )}
                    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        size='small'
                        variant='outlined'
                        label={`${t('admin.publicCollection.card.order')}: ${outfit.displayOrder ?? 0}`}
                        icon={<i className='tabler-list-numbers' />}
                      />
                      {outfit.seasons?.slice(0, 2).map(season => (
                        <Chip key={season} size='small' label={season} />
                      ))}
                      {outfit.seasons && outfit.seasons.length > 2 && (
                        <Chip size='small' label={`+${outfit.seasons.length - 2}`} />
                      )}
                    </Stack>
                    <Typography variant='body2' color='text.secondary'>
                      {t('admin.publicCollection.card.items')}: {outfit.items?.length ?? 0}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button
                      size='small'
                      variant='contained'
                      color='primary'
                      startIcon={<i className='tabler-box' />}
                      onClick={() => {
                        setSelectedOutfitId(outfit.id)
                        setItemsDialogOpen(true)
                      }}
                    >
                      {t('admin.publicCollection.card.itemsButton')}
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<i className='tabler-edit' />}
                      onClick={() => {
                        setEditingOutfit(outfit)
                        setOutfitDialogOpen(true)
                      }}
                    >
                      {t('admin.publicCollection.card.editButton')}
                    </Button>
                    <Tooltip title={t('admin.publicCollection.card.deleteTooltip')}>
                      <IconButton color='error' onClick={() => handleDelete(outfit.id)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            </Grid>
            {filteredOutfits.length > itemsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={Math.ceil(filteredOutfits.length / itemsPerPage)} 
                  page={page} 
                  onChange={(_, newPage) => setPage(newPage)}
                  color='primary'
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <OutfitFormDialog
        open={outfitDialogOpen}
        onClose={() => {
          setOutfitDialogOpen(false)
          setEditingOutfit(null)
        }}
        onSaved={() => {
          setOutfitDialogOpen(false)
          setEditingOutfit(null)
          loadOutfits()
        }}
        outfit={editingOutfit}
        seasonOptions={seasonOptions}
      />

      <ItemsManagerDialog
        open={itemsDialogOpen}
        outfitId={selectedOutfitId}
        onClose={() => {
          setItemsDialogOpen(false)
          setSelectedOutfitId(null)
        }}
        onUpdated={loadOutfits}
      />
    </Box>
  )
}

interface OutfitFormDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  outfit: PublicOutfit | null
  seasonOptions: string[]
}

const OutfitFormDialog: React.FC<OutfitFormDialogProps> = ({ open, onClose, onSaved, outfit, seasonOptions }) => {
  const isEditing = Boolean(outfit)
  const { t } = useTranslation()
  const [form, setForm] = useState<UpsertPublicOutfitPayload>({
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
    seasons: [],
    imageFile: null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [itemsForTryOn, setItemsForTryOn] = useState<PublicOutfitItem[]>([])
  const [modelImageFile, setModelImageFile] = useState<File | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [tryOnPreview, setTryOnPreview] = useState<string | null>(null)
  const [tryOnLoading, setTryOnLoading] = useState(false)

  useEffect(() => {
    if (outfit) {
      setForm({
        name: outfit.name,
        description: outfit.description || '',
        isActive: outfit.isActive,
        displayOrder: outfit.displayOrder || 0,
        seasons: outfit.seasons || [],
        imageFile: null
      })
      setImagePreview(outfit.imageUrl || null)
      publicCollectionService
        .getOutfitDetail(outfit.id)
        .then(detail => setItemsForTryOn(detail.items || []))
        .catch(() => setItemsForTryOn([]))
    } else {
      setForm({
        name: '',
        description: '',
        isActive: true,
        displayOrder: 0,
        seasons: [],
        imageFile: null
      })
      setImagePreview(null)
      setItemsForTryOn([])
      setModelImageFile(null)
      setModelPreview(null)
      setTryOnPreview(null)
    }
  }, [outfit])

  const handleImageChange = (file?: File | null) => {
    if (!file) return

    setForm(prev => ({ ...prev, imageFile: file }))

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleModelChange = (file?: File | null) => {
    if (!file) return

    setModelImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => setModelPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      showErrorToast(t('admin.publicCollection.outfitDialog.nameRequired'))
      return
    }

    if (!isEditing && !form.imageFile) {
      const confirmCreate = window.confirm(t('admin.publicCollection.outfitDialog.confirmNoImage'))
      if (!confirmCreate) return
    }

    setSaving(true)

    try {
      if (isEditing) {
        await publicCollectionService.updateOutfit(outfit!.id, form)
      } else {
        await publicCollectionService.createOutfit(form)
      }
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu outfit'
      showErrorToast(message)
    } finally {
      setSaving(false)
    }
  }

  const canTryOn = itemsForTryOn.length >= 2

  const handleTryOn = async () => {
    if (!modelImageFile) {
      showErrorToast('Vui lòng chọn ảnh model trước')
      return
    }

    if (!canTryOn) {
      showErrorToast('Cần tối thiểu 2 item để thử đồ AI')
      return
    }

    setTryOnLoading(true)

    try {
      const imageBase64 = await publicCollectionService.tryOnWithItems(
        modelImageFile,
        itemsForTryOn.map(i => i.imageUrl).filter(Boolean) as string[]
      )

      setTryOnPreview(`data:image/png;base64,${imageBase64}`)
      showSuccessToast('Đã tạo ảnh try-on, chọn Use để dùng làm ảnh outfit')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI Try-On thất bại'
      showErrorToast(message)
    } finally {
      setTryOnLoading(false)
    }
  }

  const useTryOnImage = async () => {
    if (!tryOnPreview) return

    const blob = await fetch(tryOnPreview).then(r => r.blob())
    const file = new File([blob], 'tryon-result.png', { type: 'image/png' })
    handleImageChange(file)
    setTryOnPreview(null)
    setModelImageFile(null)
    setModelPreview(null)
    showSuccessToast('Đã dùng ảnh AI Try-On cho outfit')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>{isEditing ? t('admin.publicCollection.outfitDialog.editTitle') : t('admin.publicCollection.outfitDialog.createTitle')}</DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit} id='outfit-form'>
          <Stack spacing={3}>
            <TextField
              label={t('admin.publicCollection.outfitDialog.nameLabel')}
              fullWidth
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label={t('admin.publicCollection.outfitDialog.descriptionLabel')}
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type='number'
                  label={t('admin.publicCollection.outfitDialog.displayOrderLabel')}
                  fullWidth
                  value={form.displayOrder}
                  onChange={e => setForm(prev => ({ ...prev, displayOrder: Number(e.target.value) || 0 }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-list-numbers' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  SelectProps={{ multiple: true }}
                  label={t('admin.publicCollection.outfitDialog.seasonsLabel')}
                  fullWidth
                  value={form.seasons}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      seasons: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                    }))
                  }
                >
                  {seasonOptions.map(season => (
                    <MenuItem key={season} value={season}>
                      {season}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(_, checked) => setForm(prev => ({ ...prev, isActive: checked }))}
                  color='primary'
                />
              }
              label={t('admin.publicCollection.outfitDialog.activeLabel')}
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('admin.publicCollection.outfitDialog.cancel')}
        </Button>
        <Button form='outfit-form' type='submit' variant='contained' disabled={saving}>
          {saving ? <CircularProgress size={20} color='inherit' /> : isEditing ? t('admin.publicCollection.outfitDialog.update') : t('admin.publicCollection.outfitDialog.create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface ItemsManagerDialogProps {
  open: boolean
  outfitId: number | null
  onClose: () => void
  onUpdated: () => void
}

const ItemsManagerDialog: React.FC<ItemsManagerDialogProps> = ({ open, outfitId, onClose, onUpdated }) => {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<PublicOutfitDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PublicOutfitItem | null>(null)

  const loadDetail = async () => {
    if (!outfitId) return
    setLoading(true)
    try {
      const data = await publicCollectionService.getOutfitDetail(outfitId)
      setDetail(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải item'
      showErrorToast(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && outfitId) {
      loadDetail()
    } else if (!open) {
      setDetail(null)
    }
  }, [open, outfitId])

  const handleDeleteItem = async (itemId: number) => {
    const confirmed = window.confirm(t('admin.publicCollection.itemsDialog.deleteConfirm'))
    if (!confirmed) return
    try {
      await publicCollectionService.deleteItem(itemId)
      await loadDetail()
      onUpdated()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa item'
      showErrorToast(message)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>{t('admin.publicCollection.itemsDialog.title')}</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        {detail ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant='h6'>{detail.name}</Typography>
              <Tooltip title={detail.items && detail.items.length >= 4 ? t('admin.publicCollection.itemsDialog.maxItemsReached') : ''}>
                <span>
                  <Button
                    variant='contained'
                    startIcon={<i className='tabler-plus' />}
                    disabled={detail.items && detail.items.length >= 4}
                    onClick={() => {
                      setEditingItem(null)
                      setItemDialogOpen(true)
                    }}
                  >
                    {t('admin.publicCollection.itemsDialog.addItem')}
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {detail.items?.length === 0 ? (
              <Alert severity='info'>{t('admin.publicCollection.itemsDialog.empty')}</Alert>
            ) : (
              <Grid container spacing={1.5}>
                {detail.items?.map(item => (
                  <Grid item xs={6} sm={4} md={3} key={item.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '100%',
                          bgcolor: 'action.hover',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          component='img'
                          src={item.imageUrl}
                          alt={item.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center'
                          }}
                        />
                      </Box>
                      <CardContent sx={{ p: 1.5, pb: 1, flex: 1 }}>
                        <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3 }}>
                          {item.name}
                        </Typography>
                        {item.color && (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                            {t('admin.publicCollection.itemsDialog.color')}: {item.color}
                          </Typography>
                        )}
                        <Typography variant='caption' color='text.secondary'>
                          {t('admin.publicCollection.itemsDialog.order')}: {item.displayOrder}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 1, pt: 0, gap: 0.5 }}>
                        <Button
                          size='small'
                          variant='outlined'
                          sx={{ minWidth: 'auto', px: 1 }}
                          onClick={() => {
                            setEditingItem(item)
                            setItemDialogOpen(true)
                          }}
                        >
                          <i className='tabler-edit' style={{ fontSize: '16px' }} />
                        </Button>
                        <Tooltip title={t('admin.publicCollection.itemsDialog.deleteTooltip')}>
                          <IconButton 
                            size='small' 
                            color='error' 
                            onClick={() => handleDeleteItem(item.id)}
                            sx={{ p: 0.5 }}
                          >
                            <i className='tabler-trash' style={{ fontSize: '16px' }} />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>
        ) : (
          !loading && <Alert severity='warning'>Không tìm thấy outfit</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.publicCollection.itemsDialog.close')}</Button>
      </DialogActions>

      {detail && (
        <ItemFormDialog
          open={itemDialogOpen}
          onClose={() => {
            setItemDialogOpen(false)
            setEditingItem(null)
          }}
          outfitId={detail.id}
          item={editingItem}
          onSaved={async () => {
            await loadDetail()
            onUpdated()
            setItemDialogOpen(false)
            setEditingItem(null)
          }}
        />
      )}
    </Dialog>
  )
}

interface ItemFormDialogProps {
  open: boolean
  onClose: () => void
  outfitId: number
  item: PublicOutfitItem | null
  onSaved: () => void
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({ open, onClose, outfitId, item, onSaved }) => {
  const isEditing = Boolean(item)
  const { user } = useAdminAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState<UpsertPublicOutfitItemPayload>({
    name: '',
    buyLink: '',
    color: '',
    displayOrder: 0,
    imageFile: null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [segmenting, setSegmenting] = useState(false)
  const [colors, setColors] = useState<string[]>([])

  useEffect(() => {
    loadItemData()
      .then(data => setColors((data?.colors || []).map((c: any) => c.name)))
      .catch(() => setColors([]))
  }, [])

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        buyLink: item.buyLink || '',
        color: item.color || '',
        displayOrder: item.displayOrder || 0,
        imageFile: null
      })
      setImagePreview(item.imageUrl || null)
    } else {
      setForm({ name: '', buyLink: '', color: '', displayOrder: 0, imageFile: null })
      setImagePreview(null)
    }
  }, [item])

  const handleImageChange = (file?: File | null) => {
    if (!file) return
    setForm(prev => ({ ...prev, imageFile: file }))
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSegment = async () => {
    if (!form.imageFile) {
      showErrorToast(t('admin.publicCollection.itemDialog.selectImageFirst'))
      return
    }
    if (!user?.id) {
      showErrorToast(t('admin.publicCollection.itemDialog.noUserInfo'))
      return
    }

    setSegmenting(true)
    try {
      const result = await wardrobeService.removeBackground(Number(user.id), form.imageFile)
      const dataUrl = `data:image/png;base64,${result.imageBase64}`
      const blob = await fetch(dataUrl).then(r => r.blob())
      const newFile = new File([blob], 'segmented.png', { type: 'image/png' })
      handleImageChange(newFile)
      showSuccessToast(t('admin.publicCollection.itemDialog.backgroundRemoved'))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.publicCollection.errors.removeBackgroundFailed')
      showErrorToast(message)
    } finally {
      setSegmenting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showErrorToast(t('admin.publicCollection.itemDialog.nameRequired'))
      return
    }
    if (!isEditing && !form.imageFile) {
      showErrorToast(t('admin.publicCollection.itemDialog.imageRequired'))
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await publicCollectionService.updateItem(item!.id, form)
      } else {
        await publicCollectionService.addItem(outfitId, form)
      }
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu item'
      showErrorToast(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{isEditing ? t('admin.publicCollection.itemDialog.editTitle') : t('admin.publicCollection.itemDialog.createTitle')}</DialogTitle>
      <DialogContent dividers>
        <form id='item-form' onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                {t('admin.publicCollection.itemDialog.imageLabel')} *
              </Typography>
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center'
                }}
              >
                <input
                  type='file'
                  accept='image/*'
                  id='item-image-input'
                  hidden
                  onChange={e => handleImageChange(e.target.files?.[0] || null)}
                />
                <label htmlFor='item-image-input'>
                  <Button variant='outlined' component='span' startIcon={<i className='tabler-upload' />}>
                    {t('admin.publicCollection.itemDialog.chooseImage')}
                  </Button>
                </label>
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={imagePreview}
                      alt='preview'
                      style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12 }}
                    />
                  </Box>
                )}
              </Box>
              {form.imageFile && (
                <Button
                  variant='outlined'
                  size='small'
                  sx={{ mt: 1 }}
                  onClick={handleSegment}
                  disabled={segmenting}
                  startIcon={
                    segmenting ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-wand' />
                  }
                >
                  {segmenting ? t('admin.publicCollection.itemDialog.processing') : t('admin.publicCollection.itemDialog.aiRemoveBackground')}
                </Button>
              )}
            </Box>

            <TextField
              label={t('admin.publicCollection.itemDialog.nameLabel')}
              fullWidth
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label={t('admin.publicCollection.itemDialog.buyLinkLabel')}
              fullWidth
              value={form.buyLink}
              onChange={e => setForm(prev => ({ ...prev, buyLink: e.target.value }))}
            />
            <TextField
              select
              label={t('admin.publicCollection.itemDialog.colorLabel')}
              fullWidth
              value={form.color}
              onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
            >
              <MenuItem value=''>{t('admin.publicCollection.itemDialog.noColor')}</MenuItem>
              {colors.map(color => (
                <MenuItem key={color} value={color}>
                  {color}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type='number'
              label={t('admin.publicCollection.itemDialog.displayOrderLabel')}
              fullWidth
              value={form.displayOrder}
              onChange={e => setForm(prev => ({ ...prev, displayOrder: Number(e.target.value) || 0 }))}
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('admin.publicCollection.itemDialog.cancel')}
        </Button>
        <Button type='submit' form='item-form' variant='contained' disabled={saving}>
          {saving ? <CircularProgress size={20} color='inherit' /> : isEditing ? t('admin.publicCollection.itemDialog.save') : t('admin.publicCollection.itemDialog.add')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PublicCollectionView

