'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import { Card, CardContent, CardHeader } from '@mui/material'
import CardStatsVertical from '@/@core/components/card/stat/card-vertical'
import DistributedBarChart from '@/@core/components/card/charts/distributed-bar-chart'
import LineAreaChart from '@/@core/components/card/charts/line-area-chart'
import BarChartGrowth from '@/@core/components/card/charts/bar-chart-growth'
import HorizontalStatisticsCard from '@/@core/components/card/stat/card-horizontal'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'
import DateRangePicker from '@/@core/components/date-range-picker/DateRangePicker'
import { DateFormat } from '@/@core/constants/global.const'
import { DATE_RANGE } from '@/configs/datePicker.config'
import CustomTabs from '@/@core/components/custom-tabs'
import { DemoTabs, DemoTabs2 } from './mock-data'

const Page = () => {
  const [date, setDate] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(DATE_RANGE.TODAY)

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates)
  }

  return (
    <Grid container spacing={6} size={{ xs: 12 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Demo Page' size='large' subheader='This is a subtitle' />
          <CustomTabs tabs={DemoTabs2} />
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CustomTabs tabs={DemoTabs} />
      </Grid>
      <Grid container spacing={6}>
        <Grid container spacing={6} size={{ xs: 12 }}>
          <Card className='w-full'>
            <CardContent>
              <Grid container spacing={6} size={{ xs: 12 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <AppReactDatepicker
                    inline
                    boxProps={{
                      className: 'flex justify-center is-full',
                      sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                  <AppReactDatepicker
                    selected={date}
                    onChange={setDate}
                    placeholderText='MM/DD/YYYY'
                    customInput={<CustomTextField fullWidth size='small' />}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                  <AppReactDatepicker
                    boxProps={{ className: 'is-full' }}
                    selected={date}
                    placeholderText='YYYY-MM-DD'
                    dateFormat={'YYYY-MM-DD'}
                    onChange={(date: Date | null) => setDate(date)}
                    customInput={<CustomTextField fullWidth />}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <DateRangePicker
                    range={dateRange}
                    id='date-range-picker'
                    onChange={handleDateChange}
                    monthsShown={2}
                    label='Example'
                    dateFormat={DateFormat.YMD}
                    isClearable
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <LineAreaChart
            title='Order'
            value={100000}
            subtitle='Last Week'
            percentage={12.6}
            series={[{ name: 'Orders', data: [77, 55, 23, 43, 77, 55, 89] }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <DistributedBarChart
            title='Sales'
            value={134.7875}
            subtitle='Last Week'
            percentage={12.6}
            series={[{ name: 'Sales', data: [100, 55, 23, 43, 77, 55, 89] }]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <CardStatsVertical
            title='Total Profit'
            subtitle='Last Week'
            stats='1.28k'
            avatarColor='error'
            avatarIcon='tabler-credit-card'
            avatarSkin='light'
            avatarSize={44}
            chipText='-12.2%'
            chipColor='error'
            chipVariant='tonal'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 4 }}>
          <BarChartGrowth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <HorizontalStatisticsCard
            data={[
              {
                stats: '$24,983',
                title: 'Total Earning',
                avatarIcon: 'tabler-currency-dollar',
                avatarColor: 'primary'
              },
              {
                stats: '$8,647',
                title: 'Unpaid Earning',
                avatarIcon: 'tabler-gift',
                avatarColor: 'success'
              },
              {
                stats: '2,367',
                title: 'Signups',
                avatarIcon: 'tabler-users',
                avatarColor: 'error'
              },
              {
                stats: '4.5%',
                title: 'Conversion Rate',
                avatarIcon: 'tabler-infinity',
                avatarColor: 'info'
              }
            ]}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Page

