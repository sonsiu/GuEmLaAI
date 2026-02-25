'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Box from '@mui/material/Box'
import { DotsVerticalIcon } from '../icons'
import { cn } from '../../utils/classNames'

interface CompareProps {
  firstImage?: string
  secondImage?: string
  className?: string
  firstImageClassName?: string
  secondImageClassname?: string
  initialSliderPercentage?: number
  slideMode?: 'hover' | 'drag'
  showHandlebar?: boolean
  autoplay?: boolean
  autoplayDuration?: number
}

const SparklesCore = () => (
  <Box
    sx={{
      height: '100%',
      width: '100%',
      borderRadius: '50%',
      background: 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.1), rgba(255,255,255,0.7))',
      opacity: 0.9,
      filter: 'blur(1px)',
      animation: 'pulse 2s ease-in-out infinite',
      '@keyframes pulse': {
        '0%, 100%': { opacity: 0.9 },
        '50%': { opacity: 0.5 }
      }
    }}
  />
)

export const Compare: React.FC<CompareProps> = ({
  firstImage = '',
  secondImage = '',
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = 'hover',
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000
}) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage)
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAutoplay = useCallback(() => {
    if (!autoplay) return

    const animate = () => {
      const progress =
        ((Date.now() / autoplayDuration) % 2) < 1
          ? ((Date.now() % autoplayDuration) / autoplayDuration) * 100
          : (1 - ((Date.now() % autoplayDuration) / autoplayDuration)) * 100

      setSliderXPercent(progress)
      autoplayRef.current = setTimeout(animate, 16)
    }

    animate()
  }, [autoplay, autoplayDuration])

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current)
      autoplayRef.current = null
    }
  }, [])

  useEffect(() => {
    startAutoplay()
    return () => stopAutoplay()
  }, [startAutoplay, stopAutoplay])

  const handleStart = useCallback(() => {
    if (slideMode === 'drag') {
      setIsDragging(true)
    }

    if (autoplay) {
      stopAutoplay()
    }
  }, [slideMode, autoplay, stopAutoplay])

  const handleEnd = useCallback(() => {
    if (slideMode === 'drag') {
      setIsDragging(false)
    }

    if (autoplay) {
      startAutoplay()
    }
  }, [slideMode, autoplay, startAutoplay])

  const calculatePercent = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return
      const rect = sliderRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percent = (x / rect.width) * 100

      setSliderXPercent(Math.max(0, Math.min(100, percent)))
    },
    []
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
        calculatePercent(event.clientX)
      }
    },
    [slideMode, isDragging, calculatePercent]
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
        calculatePercent(event.touches[0].clientX)
      }
    },
    [slideMode, isDragging, calculatePercent]
  )

  const cursorClass = useMemo(
    () =>
      slideMode === 'drag'
        ? isDragging
          ? 'grabbing'
          : 'grab'
        : 'col-resize',
    [slideMode, isDragging]
  )

  return (
    <Box
      ref={sliderRef}
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        cursor: cursorClass,
        touchAction: 'none' // Prevent scrolling while dragging on touch devices
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsDragging(false)

        if (!autoplay) {
          setSliderXPercent(initialSliderPercentage)
        }
      }}
      onTouchMove={handleTouchMove}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={() => {
        handleStart()
        if (!autoplay) stopAutoplay()
      }}
      onTouchEnd={() => {
        handleEnd()
        if (!autoplay) startAutoplay()
      }}
      onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
    >
      <AnimatePresence initial={false}>
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            zIndex: 30,
            height: '100%',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, #6366f1, transparent)',
            left: `${sliderXPercent}%`
          }}
          transition={{ duration: 0 }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: -48,
              top: '50%',
              height: '100%',
              width: 96,
              transform: 'translateY(-50%)',
              background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)',
              filter: 'blur(48px)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: -24,
              top: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              transform: 'translateY(-50%)',
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.8)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <SparklesCore />
          </Box>
          {showHandlebar && (
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                top: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                transform: 'translateY(-50%)',
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.3)',
                bgcolor: 'white'
              }}
            >
              <DotsVerticalIcon style={{ width: 16, height: 16, color: 'black' }} />
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      <Box
        sx={{
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 20,
          height: '100%',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn('absolute inset-0 z-20 h-full w-full select-none overflow-hidden rounded-2xl', firstImageClassName)}
              style={{
                clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`
              }}
              transition={{ duration: 0 }}
            >
              <img
                alt='first image'
                src={firstImage}
                style={{
                  position: 'absolute',
                  inset: 0,
                  height: '100%',
                  width: '100%',
                  userSelect: 'none',
                  borderRadius: 16,
                  objectFit: 'cover'
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Box>

      <AnimatePresence initial={false}>
        {secondImage ? (
          <motion.img
            className={cn('absolute top-0 left-0 z-[19] h-full w-full select-none rounded-2xl object-cover', secondImageClassname)}
            alt='second image'
            src={secondImage}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : null}
      </AnimatePresence>
    </Box>
  )
}
