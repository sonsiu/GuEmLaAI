'use client'

import { useRouter } from 'next/navigation'
import { Button, Card, CardContent } from '@mui/material'

const NotRealese = () => {
  const router = useRouter()

  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center p-8'>
        <i className='tabler-mood-sad text-9xl text-primary mb-4'></i>
        <h2 className='text-2xl font-bold text-primary mb-4'>Tính năng chưa phát hành</h2>
        <p className='text-lg text-gray-600 mb-4'>
          Chức năng này hiện chưa được phát hành. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để biết thêm thông
          tin!
        </p>
        <Button variant='contained' color='primary' onClick={() => router.push('/')}>
          Về trang chủ
        </Button>
      </CardContent>
    </Card>
  )
}

export default NotRealese
