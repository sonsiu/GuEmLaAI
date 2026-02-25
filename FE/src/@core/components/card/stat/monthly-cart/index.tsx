// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import classnames from 'classnames'

import { Fade, Skeleton } from '@mui/material'
import CustomAvatar from '@core/components/mui/Avatar'
import type { MonthlyCardStatsProps } from '@/types/widgetTypes'
import { formatNumber } from '@/utils/helper'

const MonthlyCart = (props: MonthlyCardStatsProps) => {
  const {
    stats,
    title,
    avatarIcon,
    avatarSize = 44,
    avatarSkin = 'light',
    percentage,
    bottomIcon,
    prefix,
    suffix,
    avatarColor,
    className,
    formatOptions = { type: 'currency' },
    loading = false
  } = props

  return (
    <Card className={classnames('h-full', className)}>
      <CardContent className='flex flex-col items-start justify-between h-full gap-y-2'>
        {/* Top section: icon + chip */}
        <div className='w-full flex justify-between'>
          <CustomAvatar variant='rounded' skin={avatarSkin} size={avatarSize} color={avatarColor}>
            <i className={classnames(avatarIcon, 'text-[28px]')} />
          </CustomAvatar>
          {loading ? (
            <Skeleton width={50} height={24} />
          ) : percentage !== undefined ? (
            <Fade in>
              <Typography
                variant='h6'
                className='flex items-center gap-1 self-start'
                sx={{ color: percentage < 0 ? 'error.main' : 'success.main' }}
              >
                <span>{formatNumber(percentage)}%</span>
                <i className='tabler-chevron-down text-[16px]' />
              </Typography>
            </Fade>
          ) : null}
        </div>

        {/* Middle section: number + label */}
        <div>
          {loading ? (
            <Skeleton width={100} height={32} />
          ) : (
            <Fade in>
              <Typography variant='h5'>
                {prefix}
                {formatNumber(stats, formatOptions)}
                {suffix}
              </Typography>
            </Fade>
          )}
          <Typography variant='subtitle1'>{title}</Typography>
        </div>

        {/* Bottom icon (e.g. month/today) */}
        {bottomIcon && <div className='pt-1'>{bottomIcon}</div>}
      </CardContent>
    </Card>
  )
}

export default MonthlyCart
