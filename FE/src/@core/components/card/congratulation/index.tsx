// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import { formatNumber } from '@/utils/helper'

interface CongratulationsCardProps {
  title: string
  subtitle: string
  stats: number
  buttonText: string
}

const CongratulationsCard = ({ title, subtitle, stats, buttonText }: CongratulationsCardProps) => {
  return (
    <Card className='h-full'>
      <Grid container>
        <Grid size={{ xs: 8 }}>
          <CardContent>
            <Typography variant='h5' className='mbe-0.5'>
              {title}
            </Typography>
            <Typography variant='subtitle1' className='mbe-2'>
              {subtitle}
            </Typography>
            <Typography variant='h4' color='primary.main' className='mbe-1'>
              {formatNumber(stats, { type: 'currency', currency: 'USD' })}
            </Typography>
            {buttonText && (
              <Button variant='contained' color='primary'>
                {buttonText}
              </Button>
            )}
          </CardContent>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <div className='relative bs-full is-full'>
            <img
              alt='Congratulations John'
              src='/images/illustrations/items/trophy.png'
              className='max-bs-[150px] absolute block-end-0 inline-end-6 max-is-full'
            />
          </div>
        </Grid>
      </Grid>
    </Card>
  )
}

export default CongratulationsCard
