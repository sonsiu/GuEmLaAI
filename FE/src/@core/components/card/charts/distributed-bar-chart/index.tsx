'use client'

import { useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'
import type { BaseCardChartProps } from '@/types/widgetTypes'
import CardChart from '@/@core/components/card/charts/card-chart'

const DistributedBarChart = (props: BaseCardChartProps) => {
  const theme = useTheme()

  const actionSelectedColor = 'var(--mui-palette-action-selected)'

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: false,
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['var(--mui-palette-primary-main)'],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        horizontal: false,
        columnWidth: '32%',
        colors: {
          backgroundBarRadius: 5,
          backgroundBarColors: [
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor
          ]
        }
      }
    },
    grid: {
      show: false,
      padding: {
        left: -3,
        right: 5,
        top: 15,
        bottom: 18
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { show: false },
    responsive: [
      {
        breakpoint: 1350,
        options: {
          plotOptions: {
            bar: { columnWidth: '45%' }
          }
        }
      },
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          plotOptions: {
            bar: { columnWidth: '20%' }
          }
        }
      },
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: { columnWidth: '15%' }
          }
        }
      }
    ]
  }

  return <CardChart {...props} options={options} type='bar' chartPlacement='content' />
}

export default DistributedBarChart
