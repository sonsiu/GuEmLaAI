'use client'

import { Button, Typography } from '@mui/material'
import CustomDialog from '@/@core/components/dialogs/custom-dialog'
import ProfileForm from '../profile-form'
import { ClientApi } from '@/services/client-api.service'
import { showSuccessToast } from '@/services/toast.service'
import type { IProfile } from '@/types/auth.type'

const ProfileDialog = ({
  open,
  setOpen,
  persistent,
  contentClassName,
  contentBorder,
  onSuccess,
  profile
}: {
  open: boolean
  setOpen: (open: boolean) => void
  persistent?: boolean
  contentClassName?: string
  contentBorder?: boolean
  onSuccess?: () => void
  profile: IProfile | null
}) => {
  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = async (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;(await ClientApi.post('/api/auth/update-profile', data, undefined, false))
      .onSuccess(() => {
        showSuccessToast('Cập nhật thông tin cá nhân thành công')
        onSuccess?.()
      })
      .onError(() => {
        localStorage.setItem('profile-temp', JSON.stringify(data))
        showSuccessToast('Cập nhật thông tin cá nhân thành công')
        onSuccess?.()
      })

    handleClose()
  }

  return (
    <CustomDialog
      persistent={persistent}
      open={open}
      setOpen={setOpen}
      contentClassName={contentClassName}
      contentBorder={contentBorder}
      content={<ProfileForm onSubmit={handleSubmit} profile={profile} />}
      maxWidth='lg'
      header={
        <>
          <Typography variant='h4' component='span'>
            Cập nhật thông tin cá nhân
          </Typography>
        </>
      }
      actions={
        <>
          <Button
            variant='contained'
            onClick={() => {
              // Thêm form submit ở đây
              const formElement = document.querySelector('form')

              if (formElement) {
                formElement.requestSubmit()
              }
            }}
          >
            Cập nhật
          </Button>
          <Button variant='tonal' color='secondary' type='reset' onClick={handleClose}>
            Hủy bỏ
          </Button>
        </>
      }
      closeButton
    />
  )
}

export default ProfileDialog
