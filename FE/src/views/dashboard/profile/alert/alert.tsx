import { useCallback } from 'react'
import { Alert, Button, Card, CardContent, CardHeader } from '@mui/material'
import OpenDialogOnElementClick from '@/@core/components/dialogs/OpenDialogOnElementClick'
import ProfileDialog from '../dialog'

const AlertComponent = ({ onSuccess }: { onSuccess: () => void }) => {
  const handleUpdateSuccess = useCallback(() => {
    onSuccess()
  }, [onSuccess])

  return (
    <Card>
      <CardHeader title='Thông tin cá nhân' size='large' />
      <CardContent>
        <Alert severity='warning' className='flex items-center justify-between gap-4 px-4 py-2' icon={false}>
          <div className='flex items-center gap-2 text-lg mb-4'>
            <span role='img' aria-label='warning'>
              ⚠️
            </span>
            <span>
              Hãy cập nhật thông tin cá nhân để GuEmLaAi có thể đề xuất thực đơn dinh dưỡng phù hợp với bạn nhé!
            </span>
          </div>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={{
              variant: 'contained',
              children: 'Cập nhật'
            }}
            dialog={ProfileDialog}
            dialogProps={{
              onSuccess: handleUpdateSuccess // Truyền callback vào dialog
            }}
          />
        </Alert>
      </CardContent>
    </Card>
  )
}

export default AlertComponent
