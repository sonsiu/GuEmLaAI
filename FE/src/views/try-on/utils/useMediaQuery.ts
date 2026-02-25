import { useState, useEffect } from 'react'

export const useMediaQuery = (query: string): boolean => {
  const getMatches = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQueryList = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)

    mediaQueryList.addEventListener('change', listener)
    setMatches(mediaQueryList.matches)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}

