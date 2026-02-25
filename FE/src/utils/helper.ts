import { endOfDay, startOfDay } from 'date-fns'
import moment from 'moment-timezone'

type FormatType = 'decimal' | 'currency' | 'percent' | 'compact'
export type FormatOptions = {
  type?: FormatType
  locale?: string
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export const formatNumber = (
  value: number,
  {
    type = 'decimal',
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits,
    maximumFractionDigits = 2
  }: FormatOptions = {}
) => {
  const formatOptions: Intl.NumberFormatOptions = {
    style: type === 'compact' ? undefined : type,
    currency: type === 'currency' ? currency : undefined,
    notation: type === 'compact' ? 'compact' : undefined,
    compactDisplay: type === 'compact' ? 'short' : undefined,
    minimumFractionDigits,
    maximumFractionDigits
  }

  return new Intl.NumberFormat(locale, formatOptions).format(value)
}

export const getRandomNumber = (min: number, max: number, decimals = 0) => {
  const factor = Math.pow(10, decimals)

  return Math.round((Math.random() * (max - min) + min) * factor) / factor
}

export function getRangeTimeByTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string = 'Asia/Ho_Chi_Minh'
): [Date, Date] {
  const diffTzWithUTC = moment(new Date()).tz(timezone).utcOffset()
  const diffLocalWithUTC = moment(new Date()).utcOffset()
  const diffBetweenZones = diffLocalWithUTC - diffTzWithUTC
  const timeStartInTz = new Date(startDate.setHours(startDate.getHours() - diffBetweenZones / 60))
  const timeEndInTz = new Date(endDate.setHours(endDate.getHours() - diffBetweenZones / 60))

  return [startOfDay(timeStartInTz), endOfDay(timeEndInTz)]
}

export function getTimeByTimezone(date: Date, timezone: string = 'Asia/Ho_Chi_Minh'): Date {
  const diffTzWithUTC = moment(new Date()).tz(timezone).utcOffset()
  const diffLocalWithUTC = moment(new Date()).utcOffset()
  const diffBetweenZones = diffLocalWithUTC - diffTzWithUTC

  return new Date(date.setHours(date.getHours() - diffBetweenZones / 60))
}
