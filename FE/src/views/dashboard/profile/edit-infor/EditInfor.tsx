import { Button, Typography } from '@mui/material'
import CustomDialog from '@/@core/components/dialogs/custom-dialog'
import { ClientApi } from '@/services/client-api.service'
import { showSuccessToast } from '@/services/toast.service'
import type { IAccount } from '@/types/auth.type'
import InforForm from './InforForm'

const InforDialog = ({
  open,
  setOpen,
  persistent,
  contentClassName,
  contentBorder,
  onSuccess,
  account
}: {
  open: boolean
  setOpen: (open: boolean) => void
  persistent?: boolean
  contentClassName?: string
  contentBorder?: boolean
  onSuccess?: () => void
  account: IAccount | null
}) => {
  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = async (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;(await ClientApi.post('/api/auth/update-info', data, undefined, false)).onSuccess(res => {
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
      content={<InforForm onSubmit={handleSubmit} account={account} />}
      maxWidth='sm'
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

export default InforDialog
