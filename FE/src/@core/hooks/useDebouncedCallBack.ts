import { useCallback, useRef } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  return [debouncedFn, cancel] as const
}
