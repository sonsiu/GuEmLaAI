'use client'

import { Skeleton, Box, Stack } from '@mui/material'
import { styled } from '@mui/material/styles'

// Styled Components
const SkeletonWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}))

type SkeletonProps = {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: number | string
  height?: number | string
  animation?: 'pulse' | 'wave' | false
  className?: string
}

type SkeletonGroupProps = {
  count?: number
  spacing?: number
  direction?: 'row' | 'column'
  children: React.ReactNode
}

// Skeleton Item Component
export const SkeletonItem = ({
  variant = 'text',
  width = '100%',
  height = 20,
  animation = 'wave',
  className
}: SkeletonProps) => {
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
      sx={{
        backgroundColor: 'var(--mui-palette-action-hover)',
        '&::after': {
          background: 'linear-gradient(90deg, transparent, var(--mui-palette-action-selected), transparent)'
        }
      }}
    />
  )
}

// Skeleton Group Component
export const SkeletonGroup = ({ count = 1, spacing = 2, direction = 'column', children }: SkeletonGroupProps) => {
  return (
    <Stack spacing={spacing} direction={direction}>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <Box key={index}>{children}</Box>
        ))}
    </Stack>
  )
}

// Predefined Skeleton Components
export const CardSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Stack spacing={2}>
        <SkeletonItem height={24} width='60%' />
        <SkeletonItem height={100} />
        <Stack direction='row' spacing={2}>
          <SkeletonItem height={36} width={100} />
          <SkeletonItem height={36} width={100} />
        </Stack>
      </Stack>
    </SkeletonWrapper>
  )
}

export const TableSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Stack spacing={2}>
        <SkeletonItem height={48} />
        <SkeletonGroup count={5}>
          <Stack direction='row' spacing={2}>
            <SkeletonItem height={40} width='30%' />
            <SkeletonItem height={40} width='40%' />
            <SkeletonItem height={40} width='30%' />
          </Stack>
        </SkeletonGroup>
      </Stack>
    </SkeletonWrapper>
  )
}

export const ProfileSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Stack spacing={3}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <SkeletonItem variant='circular' width={80} height={80} />
          <Stack spacing={1} flex={1}>
            <SkeletonItem height={24} width='40%' />
            <SkeletonItem height={20} width='60%' />
          </Stack>
        </Stack>
        <SkeletonGroup count={3}>
          <SkeletonItem height={64} />
        </SkeletonGroup>
      </Stack>
    </SkeletonWrapper>
  )
}

export const FormSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Stack spacing={3}>
        <SkeletonGroup count={4}>
          <Stack spacing={1}>
            <SkeletonItem height={20} width='30%' />
            <SkeletonItem height={40} />
          </Stack>
        </SkeletonGroup>
        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <SkeletonItem height={36} width={100} />
          <SkeletonItem height={36} width={100} />
        </Stack>
      </Stack>
    </SkeletonWrapper>
  )
}

export const ListSkeleton = () => {
  return (
    <SkeletonWrapper>
      <Stack spacing={2}>
        <SkeletonGroup count={5}>
          <Stack direction='row' spacing={2} alignItems='center'>
            <SkeletonItem variant='circular' width={40} height={40} />
            <Stack spacing={1} flex={1}>
              <SkeletonItem height={20} width='70%' />
              <SkeletonItem height={16} width='40%' />
            </Stack>
          </Stack>
        </SkeletonGroup>
      </Stack>
    </SkeletonWrapper>
  )
}
