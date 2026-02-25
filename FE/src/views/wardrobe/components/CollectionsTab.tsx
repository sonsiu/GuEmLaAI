'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { Collection } from '@/types/wardrobe.type'
import CollectionCard from './CollectionCard'

interface CollectionsTabProps {
  collections: Collection[]
  loading: boolean
  onCollectionClick: (collectionId: number) => void
  onCollectionEdit: (collection: Collection) => void
  onCreateCollection: () => void
  getTimeAgo: (dateString: string) => string
}

const CollectionsTab: React.FC<CollectionsTabProps> = ({
  collections,
  loading,
  onCollectionClick,
  onCollectionEdit,
  onCreateCollection,
  getTimeAgo
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (collections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)'
              }`
          }}
        >
          <i
            className="tabler-plus"
            style={{
              fontSize: 48,
              color: theme.palette.primary.main
            }}
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          {t('tryOn.wardrobe.empty.collections.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('tryOn.wardrobe.empty.collections.description')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<i className="tabler-plus" />}
          onClick={onCreateCollection}
        >
          {t('tryOn.wardrobe.empty.collections.action')}
        </Button>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {collections.map((collection) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={collection.id}>
          <CollectionCard
            collection={collection}
            onClick={() => onCollectionClick(collection.id)}
            onEdit={() => onCollectionEdit(collection)}
            getTimeAgo={getTimeAgo}
          />
        </Grid>
      ))}
    </Grid>
  )
}

export default CollectionsTab

