'use client'

import { useEffect, useMemo, useState } from 'react'

const getTimeUntilMidnight = () => {
  const now = new Date()
  const midnight = new Date(now)

  midnight.setHours(24, 0, 0, 0)

  const diff = midnight.getTime() - now.getTime()
  const totalSeconds = Math.max(0, Math.floor(diff / 1000))

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { hours, minutes, seconds }
}

export const useCountdownToMidnight = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formattedString = useMemo(() => {
    const hours = timeLeft.hours.toString().padStart(2, '0')
    const minutes = timeLeft.minutes.toString().padStart(2, '0')
    const seconds = timeLeft.seconds.toString().padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  }, [timeLeft])

  return { ...timeLeft, formattedString }
}

