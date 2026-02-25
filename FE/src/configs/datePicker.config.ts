import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears
} from 'date-fns'
import { getRangeTimeByTimezone, getTimeByTimezone } from '@/utils/helper'

export type QuickOption = {
  label: string
  getValue: () => [Date, Date]
}

export const QUICK_OPTIONS: QuickOption[] = [
  {
    label: 'date.today',
    getValue: () => DATE_RANGE.TODAY
  },
  {
    label: 'date.yesterday',
    getValue: () => DATE_RANGE.YESTERDAY
  },
  {
    label: 'date.last7Days',
    getValue: () => DATE_RANGE.LAST_7_DAYS
  },
  {
    label: 'date.last14Days',
    getValue: () => DATE_RANGE.LAST_14_DAYS
  },
  {
    label: 'date.last30Days',
    getValue: () => DATE_RANGE.LAST_30_DAYS
  },
  {
    label: 'date.thisWeek',
    getValue: () => DATE_RANGE.THIS_WEEK
  },
  {
    label: 'date.lastWeek',
    getValue: () => DATE_RANGE.LAST_WEEK
  },
  {
    label: 'date.thisMonth',
    getValue: () => DATE_RANGE.THIS_MONTH
  },
  {
    label: 'date.lastMonth',
    getValue: () => DATE_RANGE.LAST_MONTH
  },
  {
    label: 'date.thisYear',
    getValue: () => DATE_RANGE.THIS_YEAR
  },
  {
    label: 'date.lastYear',
    getValue: () => DATE_RANGE.LAST_YEAR
  },
  {
    label: 'date.last90Days',
    getValue: () => DATE_RANGE.LAST_90_DAYS
  },
  {
    label: 'date.last180Days',
    getValue: () => DATE_RANGE.LAST_180_DAYS
  }
]

export const DATE_RANGE: Record<string, [Date, Date]> = {
  TODAY: getRangeTimeByTimezone(new Date(), new Date()),
  YESTERDAY: getRangeTimeByTimezone(subDays(new Date(), 1), subDays(new Date(), 1)),
  LAST_7_DAYS: getRangeTimeByTimezone(subDays(new Date(), 6), new Date()),
  LAST_14_DAYS: getRangeTimeByTimezone(subDays(new Date(), 13), new Date()),
  LAST_30_DAYS: getRangeTimeByTimezone(subDays(new Date(), 29), new Date()),
  THIS_WEEK: [startOfWeek(new Date(), { weekStartsOn: 1 }), endOfWeek(new Date(), { weekStartsOn: 1 })],
  LAST_WEEK: [
    startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  ],
  THIS_MONTH: [startOfMonth(getTimeByTimezone(new Date())), endOfMonth(getTimeByTimezone(new Date()))],
  LAST_MONTH: [
    startOfMonth(getTimeByTimezone(subMonths(new Date(), 1))),
    endOfMonth(getTimeByTimezone(subMonths(new Date(), 1)))
  ],
  THIS_YEAR: [startOfYear(new Date()), endOfYear(new Date())],
  LAST_YEAR: [startOfYear(subYears(new Date(), 1)), endOfYear(subYears(new Date(), 1))],
  THIS_QUARTER: [startOfQuarter(new Date()), endOfQuarter(new Date())],
  LAST_QUARTER: [startOfQuarter(subQuarters(new Date(), 1)), endOfQuarter(subQuarters(new Date(), 1))],
  LAST_90_DAYS: getRangeTimeByTimezone(subDays(new Date(), 89), new Date()),
  LAST_180_DAYS: getRangeTimeByTimezone(subDays(new Date(), 179), new Date())
}
