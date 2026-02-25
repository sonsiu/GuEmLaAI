import { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import AlertComponent from './alert/alert'
import { ClientApi } from '@/services/client-api.service'
import type { IProfile } from '@/types/auth.type'
import OpenDialogOnElementClick from '@/@core/components/dialogs/OpenDialogOnElementClick'
import ProfileDialog from './dialog'
import ProfileAlign from './profile-align'
import { CardSkeleton } from '@/@core/components/skeleton'

const Profile = () => {
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const getProfile = async () => {
    setLoading(true)
    ;(await ClientApi.get<IProfile>('/api/auth/get-profile', undefined, false))
      .onSuccess(res => {
        setProfile(res)
      })
      .onError(() => {
        const profileTemp = localStorage.getItem('profile-temp')

        if (!profileTemp) return

        const profileTempData = JSON.parse(profileTemp)

        setProfile(profileTempData)
      })
    setLoading(false)
  }

  useEffect(() => {
    getProfile()
  }, [])

  return (
    <>
      {loading ? (
        <CardSkeleton />
      ) : !profile ? (
        <AlertComponent onSuccess={getProfile} />
      ) : (
        <>
          <div className='flex justify-end'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={{
                variant: 'contained',
                children: 'Cập nhật'
              }}
              dialog={ProfileDialog}
              dialogProps={{
                onSuccess: getProfile,
                profile
              }}
            />
          </div>
          <ProfileAlign profile={profile} />
        </>
      )}
    </>
  )
}

export default Profile
