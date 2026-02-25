'use client'

import type { ApexOptions } from 'apexcharts'
import { Card, CardHeader } from '@mui/material'
import type { BaseCardChartProps } from '@/types/widgetTypes'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

interface CustomLineChartProps extends Omit<BaseCardChartProps, 'series'> {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  categories?: string[]
  className?: string
}

const CustomLineChart = (props: CustomLineChartProps) => {
  const { categories = [], height = 84, series, title, subtitle, className } = props

  const options: ApexOptions = {
    chart: {
      type: 'line',
      zoom: {
        enabled: false
      },
      parentHeightOffset: 0,
      animations: { enabled: true }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 5,
      curve: 'smooth',
      colors: ['var(--mui-palette-primary-main)']
    },
    colors: ['var(--mui-palette-primary-main)'],
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    markers: {
      size: 4,
      colors: ['var(--mui-palette-primary-main)'],
      strokeColors: 'var(--mui-palette-background-paper)',
      strokeWidth: 2
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        }
      },
      axisBorder: {
        color: 'var(--mui-palette-divider)'
      },
      axisTicks: {
        color: 'var(--mui-palette-divider)'
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)'
        }
      }
    }
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader title={title} subheader={subtitle} className='pbe-0' />
      <AppReactApexCharts
        type='line'
        height={height}
        width='100%'
        options={options}
        series={series}
        boxProps={{ className: 'h-full' }}
      />
    </Card>
  )
}

export default CustomLineChart
