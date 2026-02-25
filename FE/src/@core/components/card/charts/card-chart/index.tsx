'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import type { ApexOptions } from 'apexcharts'
import { formatNumber } from '@/utils/helper'
import type { BaseCardChartProps } from '@/types/widgetTypes'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

interface CardChartProps extends BaseCardChartProps {
  options: ApexOptions
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble'
  chartPlacement?: 'header' | 'content'
}

const CardChart = ({
  title,
  subtitle,
  value,
  prefix,
  suffix,
  percentage,
  series,
  type = 'area',
  options,
  chartPlacement = 'header',
  height = 84
}: CardChartProps) => {
  const renderChart = () => (
    <AppReactApexCharts type={type} height={height} width='100%' options={options} series={series} />
  )

  return (
    <Card>
      <CardHeader title={title} subheader={subtitle} className='pbe-0' />
      {chartPlacement === 'header' && renderChart()}
      <CardContent className='flex flex-col pbs-0'>
        {chartPlacement === 'content' && renderChart()}
        <div className='flex items-center justify-between flex-wrap gap-x-4 gap-y-0.5'>
          <Typography variant='h4' color='text.primary'>
            {prefix}
            {formatNumber(value)}
            {suffix}
          </Typography>
          {percentage && (
            <Typography variant='body2' color={percentage >= 0 ? 'success.main' : 'error.main'}>
              {percentage >= 0 ? '+' : '-'}
              {percentage}%
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CardChart
