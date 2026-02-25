// MUI Imports
import Grid from '@mui/material/Grid2'
import type { CardStatsHorizontalWithAvatarProps } from '@/types/widgetTypes'
import HorizontalWithAvatar from './horizontal-with-avatar'

const HorizontalStatisticsCard = ({ data, loading }: { data?: CardStatsHorizontalWithAvatarProps[]; loading?: boolean }) => {
  return (
    data && (
      <Grid container spacing={6}>
        {data.map((item, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <HorizontalWithAvatar {...item} avatarSkin='light' loading={loading} />
          </Grid>
        ))}
      </Grid>
    )
  )
}

export default HorizontalStatisticsCard
