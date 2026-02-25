import Grid from '@mui/material/Grid2'
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button
} from '@mui/material'
import type { IProfile } from '@/types/auth.type'
import { MealPreference, HealthGoalOptions, ActivityFactorValues } from '@/types/auth.type'
import CustomTextField from '@/@core/components/mui/TextField'
import OpenDialogOnElementClick from '@/@core/components/dialogs/OpenDialogOnElementClick'
import InforDialog from '../edit-infor/EditInfor'
import { useAuth } from '@/@core/contexts/AuthContext'

interface ProfileAlignProps {
  profile: IProfile
}

const ProfileAlign = ({ profile }: ProfileAlignProps) => {
  const { user } = useAuth()

  const editButton = <i className='tabler tabler-edit cursor-pointer' />
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL

  if (!user || !user.avatar) {
    return null
  }

  return (
    <Grid container spacing={6}>
      {/* Thông tin cơ bản */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div className='flex items-center gap-4'>
              <Avatar
                sx={{ width: 120, height: 120, bgcolor: 'primary.main' }}
                alt={user.fullName || 'User'}
                src={user.avatar}
              />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h5' sx={{ mb: 1 }}>
                  {user.fullName || 'Chưa cập nhật tên'}{' '}
                  <OpenDialogOnElementClick
                    element={Button}
                    elementProps={{
                      variant: 'tonal',
                      children: editButton
                    }}
                    dialog={InforDialog}
                    dialogProps={{
                      account: user,
                      onSuccess: () => {
                        window.location.reload()
                      }
                    }}
                  />
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {user.email || 'Chưa cập nhật email'}
                </Typography>
              </Box>
            </div>
            <Box sx={{ width: '100%' }}>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>
                Thông tin cơ bản
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <CustomTextField fullWidth label='Cân nặng (kg)' value={profile.weight} type='number' disabled />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <CustomTextField fullWidth label='Chiều cao (cm)' value={profile.height} type='number' disabled />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <CustomTextField fullWidth label='Tuổi' value={profile.age} type='number' disabled />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Giới tính'
                    value={profile.gender === 'male' ? 'Nam' : 'Nữ'}
                    type='string'
                    disabled
                  />
                </Grid>
                {profile.bmi && (
                  <Grid size={{ xs: 6 }}>
                    <CustomTextField
                      fullWidth
                      label='Chỉ số BMI'
                      value={profile.bmi.toFixed(1)}
                      type='number'
                      disabled
                    />
                  </Grid>
                )}
                {profile.dailyCalorieBurn && (
                  <Grid size={{ xs: 6 }}>
                    <CustomTextField
                      fullWidth
                      label='Calo tiêu hao/ngày'
                      value={profile.dailyCalorieBurn}
                      type='number'
                      disabled
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Mục tiêu và thói quen */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title='Mục tiêu và thói quen' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>
                  Mục tiêu sức khỏe
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Mục tiêu sức khỏe</InputLabel>
                  <Select value={profile.healthGoal || ''} label='Mục tiêu sức khỏe' disabled>
                    {HealthGoalOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>
                  Mức độ hoạt động
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Mức độ hoạt động</InputLabel>
                  <Select value={profile.workoutSchedule || ''} label='Mức độ hoạt động' disabled>
                    {ActivityFactorValues.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>
                  Sở thích bữa ăn
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Sở thích bữa ăn</InputLabel>
                  <Select value={profile.mealPreference || ''} label='Sở thích bữa ăn' disabled>
                    <MenuItem value={MealPreference.BREAKFAST}>Bữa sáng</MenuItem>
                    <MenuItem value={MealPreference.LUNCH}>Bữa trưa</MenuItem>
                    <MenuItem value={MealPreference.DINNER}>Bữa tối</MenuItem>
                    <MenuItem value={MealPreference.SNACKS}>Đồ ăn nhẹ</MenuItem>
                    <MenuItem value={MealPreference.ALL_MEALS}>Tất cả các bữa</MenuItem>
                    <MenuItem value={MealPreference.NO_PREFERENCE}>Không có sở thích</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Thông tin bổ sung */}
        <Card sx={{ mt: 4 }}>
          <CardHeader title='Thông tin bổ sung' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Dị ứng'
                  value={profile.allergies?.join(', ') || ''}
                  placeholder='Chưa cập nhật'
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Hạn chế thực phẩm'
                  value={profile.foodRestrictions?.join(', ') || ''}
                  placeholder='Chưa cập nhật'
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Tình trạng sức khỏe'
                  value={profile.medicalConditions || ''}
                  placeholder='Chưa cập nhật'
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Thực phẩm bổ sung'
                  value={profile.supplements || ''}
                  placeholder='Chưa cập nhật'
                  disabled
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProfileAlign
