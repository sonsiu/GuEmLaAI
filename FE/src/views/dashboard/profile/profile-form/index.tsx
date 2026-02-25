import { TextField, FormControlLabel, RadioGroup, Radio, MenuItem } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Form, useAppForm } from '@/@core/components/custom-form'
import { FormControl } from '@/@core/components/custom-form/form-control'
import { FormError } from '@/@core/components/custom-form/form-error'
import { FormItem } from '@/@core/components/custom-form/form-item'
import { FormLabel } from '@/@core/components/custom-form/form-label'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { IProfile } from '@/types/auth.type'
import {
  ActivityFactorEnum,
  ActivityFactorValues,
  HealthGoal,
  MealPreference,
  HealthGoalOptions
} from '@/types/auth.type'

const ProfileForm = ({ onSubmit, profile }: { onSubmit: (data: any) => void; profile: IProfile | null }) => {
  const { t } = useTranslation()

  const form = useAppForm(
    {
      weight: [profile?.weight || 0, { required: true, minNumber: [0, 'Cân nặng phải lớn hơn 0'] }],
      height: [profile?.height || 0, { required: true, minNumber: [0, 'Chiều cao phải lớn hơn 0'] }],
      waist: [profile?.waist || 0, { minNumber: [0, 'Vòng eo phải lớn hơn 0'] }],
      healthGoal: [profile?.healthGoal || HealthGoal.MAINTAIN, { required: true }],
      targetWeight: [profile?.targetWeight || 0, { minNumber: [0, 'Cân nặng mục tiêu phải lớn hơn 0'] }],
      bodyFatPercentage: [profile?.bodyFatPercentage || 0, { minNumber: [0, 'Tỷ lệ mỡ phải lớn hơn 0'] }],
      muscleMass: [profile?.muscleMass || 0, { minNumber: [0, 'Khối lượng cơ phải lớn hơn 0'] }],
      dailyWaterIntake: [profile?.dailyWaterIntake || 0, { minNumber: [0, 'Lượng nước phải lớn hơn 0'] }],
      dailySteps: [profile?.dailySteps || 0, { minNumber: [0, 'Số bước chân phải lớn hơn 0'] }],
      allergies: [profile?.allergies || [], { minNumber: [0, 'Dị ứng phải lớn hơn 0'] }],
      foodRestrictions: [profile?.foodRestrictions || [], { minNumber: [0, 'Hạn chế thức ăn phải lớn hơn 0'] }],
      dietaryPreference: [profile?.dietaryPreference || '', { minNumber: [0, 'Chế độ ăn phải lớn hơn 0'] }],
      mealPreference: [profile?.mealPreference || MealPreference.NO_PREFERENCE],
      dailyCalorieGoal: [profile?.dailyCalorieGoal || 0, { minNumber: [0, 'Calo mục tiêu phải lớn hơn 0'] }],
      medicalConditions: [profile?.medicalConditions || '', { minNumber: [0, 'Tình trạng sức khỏe phải lớn hơn 0'] }],
      supplements: [profile?.supplements || '', { minNumber: [0, 'Thực phẩm bổ sung phải lớn hơn 0'] }],
      workoutSchedule: [profile?.workoutSchedule || ActivityFactorEnum.MODERATE],
      age: [profile?.age || 0, { required: true, minNumber: [0, 'Tuổi phải lớn hơn 0'] }],
      gender: [profile?.gender || 'male', { required: true }]
    },
    t
  )

  return (
    <Form form={form} onSubmit={onSubmit}>
      <Grid container spacing={2}>
        {/* Hàng 1: Cân nặng, Chiều cao, Vòng eo */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel required>Cân nặng (kg)</FormLabel>
            <FormError
              name='weight'
              render={error => (
                <FormControl name='weight' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập cân nặng' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel required>Chiều cao (cm)</FormLabel>
            <FormError
              name='height'
              render={error => (
                <FormControl name='height' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập chiều cao' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel required>Giới tính</FormLabel>
            <FormError
              name='gender'
              render={error => (
                <FormControl name='gender' error={error} helperText={error?.message}>
                  <RadioGroup row>
                    <FormControlLabel value='male' control={<Radio />} label='Nam' />
                    <FormControlLabel value='female' control={<Radio />} label='Nữ' />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>

        {/* Hàng 2: Mục tiêu sức khỏe, Tuổi, Giới tính */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel required>Mục tiêu sức khỏe</FormLabel>
            <FormError
              name='healthGoal'
              render={error => (
                <FormControl name='healthGoal' error={error} helperText={error?.message}>
                  <TextField select fullWidth>
                    {HealthGoalOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel required>Tuổi</FormLabel>
            <FormError
              name='age'
              render={error => (
                <FormControl name='age' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập tuổi' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        {/* Hàng 3: Mức độ vận động */}
        <Grid size={{ xs: 12 }}>
          <FormItem>
            <FormLabel>Mức độ vận động</FormLabel>
            <FormError
              name='workoutSchedule'
              render={error => (
                <FormControl name='workoutSchedule' error={error} helperText={error?.message}>
                  <TextField select fullWidth>
                    {ActivityFactorValues.map(({ label, value }) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        {/* Hàng 4: Cân nặng mục tiêu, Tỷ lệ mỡ cơ thể, Khối lượng cơ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Vòng eo (cm)</FormLabel>
            <FormError
              name='waist'
              render={error => (
                <FormControl name='waist' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập vòng eo' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Cân nặng mục tiêu (kg)</FormLabel>
            <FormError
              name='targetWeight'
              render={error => (
                <FormControl name='targetWeight' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập cân nặng mục tiêu' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Tỷ lệ mỡ cơ thể (%)</FormLabel>
            <FormError
              name='bodyFatPercentage'
              render={error => (
                <FormControl name='bodyFatPercentage' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập tỷ lệ mỡ cơ thể' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Khối lượng cơ (kg)</FormLabel>
            <FormError
              name='muscleMass'
              render={error => (
                <FormControl name='muscleMass' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập khối lượng cơ' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        {/* Hàng 5: Lượng nước, Số bước chân, Mục tiêu calo */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Lượng nước mỗi ngày (ml)</FormLabel>
            <FormError
              name='dailyWaterIntake'
              render={error => (
                <FormControl name='dailyWaterIntake' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập lượng nước mỗi ngày' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Số bước chân mỗi ngày</FormLabel>
            <FormError
              name='dailySteps'
              render={error => (
                <FormControl name='dailySteps' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập số bước chân mỗi ngày' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Mục tiêu calo mỗi ngày</FormLabel>
            <FormError
              name='dailyCalorieGoal'
              render={error => (
                <FormControl name='dailyCalorieGoal' error={error} helperText={error?.message}>
                  <TextField fullWidth type='number' placeholder='Nhập mục tiêu calo mỗi ngày' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Dị ứng (cách nhau bởi dấu phẩy)</FormLabel>
            <FormError
              name='allergies'
              render={error => (
                <FormControl name='allergies' error={error} helperText={error?.message}>
                  <TextField fullWidth multiline rows={1} placeholder='Ví dụ: tôm, cua, trứng...' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Hạn chế thức ăn (cách nhau bởi dấu phẩy)</FormLabel>
            <FormError
              name='foodRestrictions'
              render={error => (
                <FormControl name='foodRestrictions' error={error} helperText={error?.message}>
                  <TextField fullWidth multiline rows={1} placeholder='Ví dụ: thịt bò, sữa...' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        {/* Hàng 7: Chế độ ăn, Sở thích bữa ăn, Tình trạng sức khỏe */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Chế độ ăn</FormLabel>
            <FormError
              name='dietaryPreference'
              render={error => (
                <FormControl name='dietaryPreference' error={error} helperText={error?.message}>
                  <TextField fullWidth placeholder='Ví dụ: Ăn chay, Ăn kiêng...' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Sở thích bữa ăn</FormLabel>
            <FormError
              name='mealPreference'
              render={error => (
                <FormControl name='mealPreference' error={error} helperText={error?.message}>
                  <TextField select fullWidth>
                    <MenuItem value={MealPreference.BREAKFAST}>Bữa sáng</MenuItem>
                    <MenuItem value={MealPreference.LUNCH}>Bữa trưa</MenuItem>
                    <MenuItem value={MealPreference.DINNER}>Bữa tối</MenuItem>
                    <MenuItem value={MealPreference.SNACKS}>Ăn vặt</MenuItem>
                    <MenuItem value={MealPreference.ALL_MEALS}>Tất cả các bữa</MenuItem>
                    <MenuItem value={MealPreference.NO_PREFERENCE}>Không có sở thích</MenuItem>
                  </TextField>
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Tình trạng sức khỏe</FormLabel>
            <FormError
              name='medicalConditions'
              render={error => (
                <FormControl name='medicalConditions' error={error} helperText={error?.message}>
                  <TextField fullWidth multiline rows={1} placeholder='Nhập tình trạng sức khỏe' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
        {/* Hàng 8: Thực phẩm bổ sung */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormItem>
            <FormLabel>Thực phẩm bổ sung đang dùng</FormLabel>
            <FormError
              name='supplements'
              render={error => (
                <FormControl name='supplements' error={error} helperText={error?.message}>
                  <TextField fullWidth multiline rows={1} placeholder='Nhập thực phẩm bổ sung' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
      </Grid>
    </Form>
  )
}

export default ProfileForm
