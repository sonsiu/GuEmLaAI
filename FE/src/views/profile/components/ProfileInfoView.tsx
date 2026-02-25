'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Collapse from '@mui/material/Collapse'
import Skeleton from '@mui/material/Skeleton'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/@core/contexts/AuthContext'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { userService } from '@/services/user.service'
import { creditService } from '@/services/credit.service'
import { outfitSuggestService } from '@/services/outfit-suggest.service'
import { workshopService } from '@/services/workshop.service'
import { showErrorToast, showSuccessToast } from '@/services/toast.service'
import type { UserProfile } from '@/services/user.types'

interface ProfileInfoViewProps {
  displayName: string
  profileImageUrl: string | null
  onProfileUpdate?: () => void
}

const ProfileInfoView: React.FC<ProfileInfoViewProps> = ({ displayName, profileImageUrl, onProfileUpdate }) => {
  const theme = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [modelPictureUrls, setModelPictureUrls] = useState<string[]>([])
  const [defaultModelPictureUrl, setDefaultModelPictureUrl] = useState<string | null>(null)
  const [loadingModelPicture, setLoadingModelPicture] = useState(false)

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bmi, setBmi] = useState<number | null>(null)

  // Model selection modal states
  const [showModelSelectionModal, setShowModelSelectionModal] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; url: string; fileName: string } | null>(null)
  const [settingDefaultModel, setSettingDefaultModel] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; url: string; fileName: string } | null>(null)
  const [deletingModel, setDeletingModel] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchUserProfile(), fetchCreditBalance(), fetchModelPicture()])
      } catch (err) {
        // console.error('Error fetching profile data:', err)
      }
    }

    fetchData()
  }, [])

  // Calculate BMI whenever height or weight changes
  useEffect(() => {
    if (editHeight && editWeight) {
      const heightInMeters = parseFloat(editHeight) / 100 // Convert cm to meters
      const weightInKg = parseFloat(editWeight)
      if (heightInMeters > 0 && weightInKg > 0) {
        const calculatedBmi = weightInKg / (heightInMeters * heightInMeters)
        setBmi(parseFloat(calculatedBmi.toFixed(1)))
      }
    } else {
      setBmi(null)
    }
  }, [editHeight, editWeight])

  const fetchUserProfile = async () => {
    try {
      const profileData = await userService.getUserProfileFromBackend()
      setProfile(profileData)
    } catch (err) {
      // console.error('Failed to fetch user profile from backend:', err)
    }
  }

  const fetchCreditBalance = async () => {
    setLoadingCredits(true)
    try {
      const data = await creditService.getCreditBalance()
      setCreditBalance(data.balance || 0)
    } catch (err) {
      // console.error('Failed to fetch credit balance:', err)
    } finally {
      setLoadingCredits(false)
    }
  }

  const fetchModelPicture = async () => {
    setLoadingModelPicture(true)
    try {
      // Get model picture URLs first
      const modelData = await userService.getModelUser()
      const urlsArray = modelData?.modelPictureUrls || []
      // console.log('[DEBUG] Model URLs fetched:', urlsArray)
      setModelPictureUrls(urlsArray)

      // Then get default model picture filename
      try {
        const defaultModelResponse = await userService.getDefaultModelPicture()
        // console.log('[DEBUG] Full API response:', defaultModelResponse)
        // console.log('[DEBUG] Response keys:', Object.keys(defaultModelResponse || {}))
        
        if (defaultModelResponse && defaultModelResponse.modelPicture) {
          // console.log('[DEBUG] modelPicture:', defaultModelResponse.modelPicture)
          // console.log('[DEBUG] modelPictureUrl:', defaultModelResponse.modelPictureUrl)
          // console.log('[DEBUG] modelPicture type:', typeof defaultModelResponse.modelPicture)
          
          // The API returns modelPictureUrl directly - use it!
          if (defaultModelResponse.modelPictureUrl) {
            // console.log('[DEBUG] Using modelPictureUrl directly from API')
            setDefaultModelPictureUrl(defaultModelResponse.modelPictureUrl)
          } else {
            // Fallback: If modelPicture is a string, use it as filename
            const fileName = typeof defaultModelResponse.modelPicture === 'string' 
              ? defaultModelResponse.modelPicture 
              : null
            
            // console.log('[DEBUG] Final extracted default filename:', fileName)
            
            if (fileName && urlsArray.length > 0) {
              const matchingUrl = urlsArray.find(url => url.includes(fileName))
              // console.log('[DEBUG] Matching URL:', matchingUrl)
            }
            
            setDefaultModelPictureUrl(fileName)
          }
        } else {
          // console.log('[DEBUG] modelPicture is null or undefined - user may not have set a default model yet')
          setDefaultModelPictureUrl(null)
        }
      } catch (apiErr) {
        // console.error('[DEBUG] Error calling getDefaultModelPicture API:', apiErr)
        setDefaultModelPictureUrl(null)
      }
    } catch (err) {
      // console.error('[DEBUG] Failed to fetch model picture:', err)
    } finally {
      setLoadingModelPicture(false)
    }
  }

  const handleEditProfile = () => {
    if (!profile) return
    
    setEditDisplayName(profile.displayName || user?.displayName || '')
    setEditBio(profile.bio || '')
    setEditHeight(profile.height?.toString() || '')
    setEditWeight(profile.weight?.toString() || '')
    setEditProfileImage(profile.profilePictureUrl || user?.avatar || null)
    setProfileImageFile(null)
    setError(null)
    setShowEditModal(true)
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)

    try {
      const profileData: {
        displayName?: string
        bio?: string
        height?: number
        weight?: number
        profileImage?: File
      } = {}

      if (editDisplayName) profileData.displayName = editDisplayName
      if (editBio !== undefined) profileData.bio = editBio

      // Validate height
      if (editHeight) {
        const heightNum = parseFloat(editHeight)
        if (isNaN(heightNum) || heightNum <= 0) {
          setError(t('profile.errors.invalidHeight'))
          setSaving(false)
          return
        }
        profileData.height = heightNum
      }

      // Validate weight
      if (editWeight) {
        const weightNum = parseFloat(editWeight)
        if (isNaN(weightNum) || weightNum <= 0) {
          setError(t('profile.errors.invalidWeight'))
          setSaving(false)
          return
        }
        profileData.weight = weightNum
      }

      if (profileImageFile) profileData.profileImage = profileImageFile

      // Update profile
      const updatedProfile = await userService.updateUserProfile(profileData)

      // Update local profile state immediately
      setProfile(updatedProfile)

      // Reload profile after a short delay to get the latest data including new avatar URL
      setTimeout(async () => {
        try {
          const latestProfile = await userService.getUserProfileFromBackend()
          setProfile(latestProfile)
          
          // Clear preview image now that we have the real URL
          setProfileImageFile(null)
          setEditProfileImage(null)

          // Notify parent component
          if (onProfileUpdate) {
            onProfileUpdate()
          }
        } catch (err) {
          // console.error('Failed to reload profile:', err)
          // Still clear preview even if reload fails
          setProfileImageFile(null)
          setEditProfileImage(null)
        }
      }, 500)

      // Close modal
      setShowEditModal(false)
      showSuccessToast(t('profile.success.update'))
    } catch (err) {
      // console.error('Failed to save profile:', err)
      
      let errorMessage = t('profile.errors.updateFailed')
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorWithResponse = err as { response: Response }
        try {
          const errorData = await errorWithResponse.response.json()
          if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return `${field}: ${messages.join(', ')}`
                }
                return `${field}: ${messages}`
              })
              .join('\n')
            errorMessage = errorMessages
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Ignore JSON parse errors
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditDisplayName('')
    setEditBio('')
    setEditHeight('')
    setEditWeight('')
    setEditProfileImage(null)
    setProfileImageFile(null)
    setError(null)
    setBmi(null)
  }

  // Extract filename from presigned URL
  const extractFileName = (url: string): string | null => {
    const match = url.match(/\/([^/\?]+\.(jpg|jpeg|png|gif|webp|bmp))(?:\?|$)/i)
    return match ? match[1] : null
  }

  // Handle model selection click
  const handleModelClick = (url: string) => {
    const fileName = extractFileName(url)
    if (!fileName) {
      // console.error('Failed to extract filename from URL:', url)
      return
    }
    setConfirmDialog({ open: true, url, fileName })
  }

  // Handle confirmation of default model selection
  const handleConfirmSetDefault = async () => {
    if (!confirmDialog) return

    setSettingDefaultModel(true)
    try {
      const fileName = confirmDialog.fileName
      await outfitSuggestService.setDefaultModel(fileName)
      
      // Update the default model picture URL
      setDefaultModelPictureUrl(fileName)
      
      showSuccessToast(t('profile.success.modelUpdated') || 'Mô hình mặc định đã được cập nhật!')
      setConfirmDialog(null)
      setShowModelSelectionModal(false)
      
      // Refresh model data
      await fetchModelPicture()
    } catch (err) {
      // console.error('Failed to set default model:', err)
      const errorMsg = err instanceof Error ? err.message : 'Không thể cập nhật mô hình mặc định'
      showErrorToast(errorMsg)
    } finally {
      setSettingDefaultModel(false)
    }
  }

  // Handle delete model button click
  const handleDeleteModelClick = (url: string) => {
    const fileName = extractFileName(url)
    if (!fileName) {
      // console.error('Failed to extract filename from URL:', url)
      return
    }
    setDeleteConfirmDialog({ open: true, url, fileName })
  }

  // Handle confirmation of model deletion
  const handleConfirmDeleteModel = async () => {
    if (!deleteConfirmDialog) return

    setDeletingModel(true)
    try {
      const fileName = deleteConfirmDialog.fileName
      await workshopService.deleteModelPicture(fileName)
      
      showSuccessToast(t('profile.success.modelDeleted') || 'Đã xóa mô hình thành công!')
      setDeleteConfirmDialog(null)
      
      // Refresh model data
      await fetchModelPicture()
    } catch (err) {
      // console.error('Failed to delete model:', err)
      const errorMsg = err instanceof Error ? err.message : 'Không thể xóa mô hình'
      showErrorToast(errorMsg)
    } finally {
      setDeletingModel(false)
    }
  }

  const bio = profile?.bio || ''
  const height = profile?.height
  const weight = profile?.weight

  // The presigned URL is already complete from the API
  const displayModelPictureUrl = React.useMemo(() => {
    // console.log('[DEBUG useMemo] defaultModelPictureUrl:', defaultModelPictureUrl)
    
    // If defaultModelPictureUrl is already a complete URL (starts with http), use it directly
    if (defaultModelPictureUrl && defaultModelPictureUrl.startsWith('http')) {
      // console.log('[DEBUG useMemo] Using URL directly from API')
      return defaultModelPictureUrl
    }
    
    // Otherwise, search for matching URL by filename
    if (!defaultModelPictureUrl || !modelPictureUrls || modelPictureUrls.length === 0) {
      // console.log('[DEBUG useMemo] Early return - missing data')
      return null
    }
    
    const matchedUrl = modelPictureUrls.find(url => url.includes(defaultModelPictureUrl))
    // console.log('[DEBUG useMemo] Matched URL:', matchedUrl)
    return matchedUrl || null
  }, [defaultModelPictureUrl, modelPictureUrls])

  // Calculate BMI for display
  const displayBmi = React.useMemo(() => {
    if (height && weight) {
      const heightInMeters = height / 100
      const weightInKg = weight
      if (heightInMeters > 0 && weightInKg > 0) {
        return parseFloat((weightInKg / (heightInMeters * heightInMeters)).toFixed(1))
      }
    }
    return null
  }, [height, weight])

  return (
    <Box>
      {/* Profile Info Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'flex-start' },
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {bio || t('profile.noBio')}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<i className="tabler-edit" />}
              onClick={handleEditProfile}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {t('profile.edit')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* User Info Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Model Picture Card */}
        <Card sx={{ position: 'relative', overflow: 'visible' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('profile.myModel') || 'Mô hình của tôi'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {modelPictureUrls && modelPictureUrls.length > 0
                    ? `${modelPictureUrls.length} ${t('profile.models') || 'mô hình'}`
                    : t('profile.noModelPicture') || 'Chưa có mô hình'}
                </Typography>
              </Box>

              {/* Model Picture Display - Top Right */}
              {displayModelPictureUrl && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 80,
                    aspectRatio: '9/16',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: theme.shadows[4],
                    bgcolor: theme.palette.action.hover
                  }}
                >
                  <Box
                    component="img"
                    src={displayModelPictureUrl}
                    alt="Model Picture"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Model Picture Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
              <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('profile.defaultModel') || 'Mô hình mặc định'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {defaultModelPictureUrl ? (t('profile.active') || 'Kích hoạt') : (t('profile.notSet') || 'Chưa đặt')}
                </Typography>
              </Box>

              <Button sx={{ display: 'flex',  gap: 2, mt: 4 }}
                variant="contained"
                fullWidth
                onClick={() => setShowModelSelectionModal(true)}
                startIcon={<i className="tabler-sparkles" />}
              >
                {t('profile.editModel') || 'Chỉnh sửa mô hình'}
              </Button>
            </Box>
          </CardContent>
        </Card>

       

        {/* Account Info Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('profile.accountInfo')}
              </Typography>
              <i className="tabler-activity" style={{ fontSize: '24px', color: theme.palette.text.secondary }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.email')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                  {user?.email || '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.displayName')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {displayName || t('profile.notSet')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.memberSince')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {profile?.createDate
                    ? new Date(profile.createDate).toLocaleDateString('vi-VN', {
                        month: 'short',
                        year: 'numeric'
                      })
                    : new Date().toLocaleDateString('vi-VN', {
                        month: 'short',
                        year: 'numeric'
                      })}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        </Box>


      {/* Model Selection Modal */}
      <Dialog
        open={showModelSelectionModal}
        onClose={() => setShowModelSelectionModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('profile.selectModel') || 'Chọn Mô Hình'}</Typography>
          <IconButton onClick={() => setShowModelSelectionModal(false)} disabled={settingDefaultModel} size="small">
            <i className="tabler-x" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {modelPictureUrls && modelPictureUrls.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2
              }}
            >
              {/* Render model images in 3x2 grid (max 6 items) */}
              {[...Array(6)].map((_, idx) => {
                const modelUrl = modelPictureUrls[idx]
                if (modelUrl) {
                  // Extract filename from URL for comparison
                  const urlFileName = extractFileName(modelUrl)
                  // Compare with stored default (could be URL or filename)
                  const isDefault = defaultModelPictureUrl && 
                    (defaultModelPictureUrl === modelUrl || 
                     (urlFileName && defaultModelPictureUrl.includes(urlFileName)))

                  return (
                    <Box
                      key={idx}
                      onClick={() => !settingDefaultModel && !deletingModel && handleModelClick(modelUrl)}
                      sx={{
                        position: 'relative',
                        aspectRatio: '9/16',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: (settingDefaultModel || deletingModel) ? 'not-allowed' : 'pointer',
                        border: '2px solid',
                        borderColor: isDefault ? 'primary.main' : 'divider',
                        transition: 'all 0.2s ease',
                        opacity: (settingDefaultModel || deletingModel) ? 0.6 : 1,
                        '&:hover': (settingDefaultModel || deletingModel)
                          ? {}
                          : {
                              borderColor: 'primary.main',
                              transform: 'scale(1.05)',
                              boxShadow: 3,
                              '& .delete-icon': {
                                opacity: 1
                              }
                            }
                      }}
                    >
                      {!loadedImages.has(modelUrl) && (
                        <Skeleton
                          variant="rectangular"
                          width="100%"
                          height="100%"
                          animation="wave"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                          }}
                        />
                      )}
                      <Box
                        component="img"
                        src={modelUrl}
                        alt={`Model ${idx + 1}`}
                        onLoad={() => {
                          setLoadedImages(prev => new Set(prev).add(modelUrl))
                        }}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          opacity: loadedImages.has(modelUrl) ? 1 : 0,
                          transition: 'opacity 0.3s ease'
                        }}
                      />

                      {/* Delete icon - top left */}
                      <IconButton
                        className="delete-icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!settingDefaultModel && !deletingModel) {
                            handleDeleteModelClick(modelUrl)
                          }
                        }}
                        disabled={settingDefaultModel || deletingModel}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          padding: '4px',
                          '&:hover': {
                            bgcolor: 'error.main'
                          },
                          '&.Mui-disabled': {
                            opacity: 0.3,
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        <i className="tabler-trash" style={{ fontSize: 16 }} />
                      </IconButton>

                      {/* Default badge */}
                      {isDefault && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            boxShadow: 2
                          }}
                        >
                          {t('profile.default') || 'Mặc định'}
                        </Box>
                      )}
                    </Box>
                  )
                }
                // Empty placeholder slot
                return (
                  <Box
                    key={`placeholder-${idx}`}
                    sx={{
                      aspectRatio: '9/16',
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover,
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  />
                )
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">{t('profile.noModelsAvailable') || 'Không có mô hình nào'}</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShowModelSelectionModal(false)}
            disabled={settingDefaultModel}
          >
            {t('profile.cancel') || 'Hủy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Model Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog?.open ?? false}
        onClose={() => !deletingModel && setDeleteConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('profile.confirmModelDelete') || 'Xác Nhận Xóa Mô Hình'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('profile.confirmModelDeleteText') || 'Bạn có chắc chắn muốn xóa mô hình này không? Hành động này không thể hoàn tác.'}
          </Typography>
          {deleteConfirmDialog?.url && (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 200,
                aspectRatio: '9/16',
                mx: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: 'error.main'
              }}
            >
              <Box
                component="img"
                src={deleteConfirmDialog.url}
                alt="Model to delete"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmDialog(null)}
            variant="outlined"
            disabled={deletingModel}
            sx={{ borderRadius: 2 }}
          >
            {t('profile.cancel') || 'Hủy'}
          </Button>
          <Button
            onClick={handleConfirmDeleteModel}
            variant="contained"
            color="error"
            disabled={deletingModel}
            sx={{ borderRadius: 2 }}
            startIcon={deletingModel ? <CircularProgress size={16} /> : <i className="tabler-trash" />}
          >
            {deletingModel ? (t('profile.deleting') || 'Đang xóa...') : (t('profile.delete') || 'Xóa')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Model Confirmation Dialog */}
      <Dialog
        open={confirmDialog?.open ?? false}
        onClose={() => !settingDefaultModel && setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('profile.confirmModelChange') || 'Xác Nhận Thay Đổi Mô Hình'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('profile.confirmModelChangeText') || 'Bạn có chắc chắn muốn đặt hình ảnh này làm mô hình mặc định không?'}
          </Typography>
          {confirmDialog?.url && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Box
                component="img"
                src={confirmDialog.url}
                alt="Selected model"
                sx={{
                  maxWidth: 200,
                  maxHeight: 300,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              />
            </Box>
          )}
       
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            variant="outlined"
            disabled={settingDefaultModel}
            sx={{ borderRadius: 2 }}
          >
            {t('profile.cancel') || 'Hủy'}
          </Button>
          <Button
            onClick={handleConfirmSetDefault}
            variant="contained"
            disabled={settingDefaultModel}
            sx={{ borderRadius: 2 }}
            startIcon={settingDefaultModel ? <CircularProgress size={16} /> : undefined}
          >
            {settingDefaultModel ? (t('profile.confirming') || 'Đang xác nhận...') : (t('profile.confirm') || 'Xác Nhận')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog
        open={showEditModal}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('profile.editTitle')}</Typography>
          <IconButton onClick={handleCancelEdit} disabled={saving} size="small">
            <i className="tabler-x" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Profile Image Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
              {t('profile.profilePicture')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={editProfileImage || undefined}
                alt={editDisplayName}
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  bgcolor: theme.palette.primary.main
                }}
              >
                {editDisplayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-image-upload"
                  type="file"
                  onChange={handleProfileImageChange}
                />
                <label htmlFor="profile-image-upload">
                  <Button variant="outlined" component="span" startIcon={<i className="tabler-upload" />} fullWidth>
                    {t('profile.uploadPhoto')}
                  </Button>
                </label>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  JPG, PNG hoặc GIF. Kích thước tối đa 5MB.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Display Name Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              {t('profile.displayName')}
            </Typography>
            <TextField
              fullWidth
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="tabler-user" />
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('profile.displayNameHint')}
            </Typography>
          </Box>

          {/* Bio Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              {t('profile.bio')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('profile.bioHint')}
            </Typography>
          </Box>

         

          {/* Info Box */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              {t('profile.saveInfo')}
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={saving}>
            {t('profile.cancel')}
          </Button>
          <Button onClick={handleSaveProfile} disabled={saving} variant="contained" startIcon={saving ? <CircularProgress size={16} /> : undefined}>
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProfileInfoView
