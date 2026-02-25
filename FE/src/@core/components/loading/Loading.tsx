'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'

const LoadingWrapper = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default
}))

const ProgressWrapper = styled(Box)({
  position: 'relative'
})

const Loading = () => {
  return (
    <LoadingWrapper>
      <ProgressWrapper>
        <CircularProgress
          size={75}
          thickness={2}
          sx={theme => ({
            color: theme.palette.grey[200]
          })}
        />
        <CircularProgress
          size={75}
          thickness={2}
          sx={theme => ({
            animationDuration: '550ms',
            position: 'absolute',
            left: 0,
            color: theme.palette.primary.main
          })}
        />
      </ProgressWrapper>
    </LoadingWrapper>
  )
}

export default Loading
