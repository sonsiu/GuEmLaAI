import { useState } from 'react'
import { TextField, Avatar, Box, Button, CircularProgress } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Form, useAppForm } from '@/@core/components/custom-form'
import { FormControl } from '@/@core/components/custom-form/form-control'
import { FormError } from '@/@core/components/custom-form/form-error'
import { FormItem } from '@/@core/components/custom-form/form-item'
import { FormLabel } from '@/@core/components/custom-form/form-label'
import type { IAccount } from '@/types/auth.type'
import { useTranslation } from '@/@core/hooks/useTranslation'

const InforForm = ({ onSubmit, account }: { onSubmit: (data: any) => void; account: IAccount | null }) => {
  const { t } = useTranslation()
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const form = useAppForm(
    {
      fullName: [account?.fullName || '', { required: true, minLength: [2, 'Họ tên phải có ít nhất 2 ký tự'] }],
      avatar: [account?.avatar || '', {}]
    },
    t
  )

  // Hiển thị avatar preview
  const [avatarPreview, setAvatarPreview] = useState<string | null>(account?.avatar || null)
  const [uploading, setUploading] = useState(false)

  const uploadAvatarImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()

    formData.append('images', file)
    const accessToken = localStorage.getItem('accessToken')

    const response = await fetch(`${API_URL}/galleries/create`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : ''
      }
    })

    if (!response.ok) throw new Error('Upload ảnh thất bại!')

    const res = await response.json()
    const data = res.data

    // Tùy backend trả về, bạn lấy url ảnh như sau:
    // Nếu trả về mảng:
    if (Array.isArray(data) && data[0]?.imageUrl) return data[0].imageUrl

    // Nếu trả về object:
    if (data?.imageUrl) return data.imageUrl

    // Nếu trả về object có imageUrl:
    if (data?.imageUrl) return data.imageUrl

    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return
    setUploading(true)

    try {
      const url = await uploadAvatarImage(file)

      //console.log('🚀 ~ handleFileChange ~ url:', url)

      form.setValue('avatar', url || '')
      setAvatarPreview(url || '')
    } catch (err) {
      alert('Upload ảnh thất bại!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Box mt={2} display='flex' flexDirection='column' alignItems='center' gap={1}>
            <Avatar
              src={`${storageUrl}${avatarPreview}` || undefined}
              sx={{ width: 64, height: 64, border: '1px solid #eee' }}
            />
            <Button component='label' variant='outlined' size='small' disabled={uploading}>
              {uploading ? <CircularProgress size={18} /> : 'Tải ảnh lên'}
              <input type='file' accept='image/*' hidden onChange={handleFileChange} />
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormItem>
            <FormLabel required>Họ và tên</FormLabel>
            <FormError
              name='fullName'
              render={error => (
                <FormControl name='fullName' error={error} helperText={error?.message}>
                  <TextField fullWidth placeholder='Nhập họ và tên' />
                </FormControl>
              )}
            />
          </FormItem>
        </Grid>
      </Grid>
    </Form>
  )
}

export default InforForm
