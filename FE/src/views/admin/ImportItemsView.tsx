'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { useAdminAuth } from '@/@core/hooks/useAdminAuth'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { ClientApi } from '@/services/client-api.service'

interface ImportStats {
  total: number
  successful: number
  failed: number
}

const ImportItemsView: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { isAdmin } = useAdminAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      if (selectedFile.type === 'application/json') {
        setFile(selectedFile)
        setError(null)
      } else {
        setError(t('admin.importItems.errors.invalidFileType') || 'Please select a valid JSON file')
        setFile(null)
      }
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError(t('admin.importItems.errors.noFileSelected') || 'Please select a file first')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()

      formData.append('file', file)

      const response = await ClientApi.upload<ImportStats>('/Admin/import-items', formData)
      const raw = response.getRaw()
      
      if (raw?.success && raw.data) {
        setImportStats(raw.data)
        setSuccess(true)
        showSuccessToast(t('admin.importItems.success.importCompleted') || 'Import completed successfully!')
      } else {
        throw new Error(raw?.message || t('admin.importItems.errors.importFailed') || 'Import failed')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('admin.importItems.errors.importFailed') || 'Import failed'

      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportStats(null)
    setError(null)
    setSuccess(false)
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          {t('admin.importItems.errors.accessDenied') || 'Access denied. Admin privileges required.'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 4,
          px: { xs: 2, md: 4 },
          mb: 4
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="tabler-upload" style={{ fontSize: '32px' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('admin.importItems.title') || 'Import Items'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('admin.importItems.subtitle') || 'Bulk import items from JSON file'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 4 }, pb: 4 }}>
        {/* Upload Section */}
        <Card sx={{ mb: 4, border: '2px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <i className="tabler-file-code" style={{ fontSize: '64px', color: theme.palette.text.disabled, marginBottom: 16 }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('admin.importItems.upload.title') || 'Upload JSON File'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('admin.importItems.upload.description') || 'Select a JSON file containing items to import'}
              </Typography>

              <input
                accept=".json"
                style={{ display: 'none' }}
                id="import-file-input"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="import-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<i className="tabler-upload" />}
                  sx={{ mb: 2 }}
                >
                  {t('admin.importItems.upload.selectFile') || 'Select File'}
                </Button>
              </label>

              {file && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('admin.importItems.upload.selectedFile') || 'Selected file'}: <strong>{file.name}</strong>
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={!file || isLoading}
                  startIcon={isLoading ? <CircularProgress size={18} /> : <i className="tabler-upload" />}
                >
                  {isLoading
                    ? t('admin.importItems.upload.importing') || 'Importing...'
                    : t('admin.importItems.upload.import') || 'Import Items'}
                </Button>
                {file && (
                  <Button variant="outlined" onClick={handleReset} disabled={isLoading}>
                    {t('admin.importItems.upload.reset') || 'Reset'}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {t('admin.importItems.errors.title') || 'Import Error'}
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Success Message and Stats */}
        {success && importStats && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {t('admin.importItems.success.title') || 'Import Completed'}
              </Typography>
              <Typography variant="body2">
                {t('admin.importItems.success.description', { count: importStats.total }) ||
                  `Successfully processed ${importStats.total} items`}
              </Typography>
            </Alert>

            {/* Stats Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('admin.importItems.stats.total') || 'Total Items'}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {importStats.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('admin.importItems.stats.successful') || 'Successful'}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {importStats.successful}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('admin.importItems.stats.failed') || 'Failed'}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {importStats.failed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Instructions */}
        {!file && !success && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {t('admin.importItems.instructions.title') || 'File Format Requirements'}
              </Typography>
              <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  {t('admin.importItems.instructions.format') || 'File must be in JSON format'}
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  {t('admin.importItems.instructions.fields') || 'Each item should have the required fields'}
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  {t('admin.importItems.instructions.images') || 'Images should be provided as URLs'}
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  {t('admin.importItems.instructions.schema') || 'Check the documentation for the exact schema'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default ImportItemsView

