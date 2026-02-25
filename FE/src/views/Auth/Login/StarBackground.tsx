'use client'

import { useRef, useCallback, useEffect } from 'react'
import { styled, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

interface Star {
  x: number
  y: number
  z: number
  size: number
}

const Canvas = styled('canvas')(({ theme }) => ({
  height: '100%',
  width: '100%',
  position: 'fixed',
  top: 0,
  left: 0,
  opacity: 0,
  backgroundColor: theme.palette.background.default
}))

const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const starsRef = useRef<Star[]>([])
  const theme = useTheme()

  const initStars = useCallback(({ theme }: { theme: Theme }) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const canvas_center_x = canvas.width / 2
    const canvas_center_y = canvas.height / 2

    const stars_count = canvas.width / 2
    const focal_length = canvas.width / 3
    const speed = canvas.width / 2000

    starsRef.current = Array.from({ length: stars_count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      size: Math.random() * 2 + 0.5
    }))

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
    }

    canvas.style.opacity = '1'

    const render = () => {
      if (!canvas || !context) return

      animationFrameRef.current = window.requestAnimationFrame(render)
      context.fillStyle = theme.palette.background.default
      context.fillRect(0, 0, canvas.width, canvas.height)

      starsRef.current.forEach((star, i) => {
        star.z -= speed

        if (star.z <= 0) {
          starsRef.current[i] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: canvas.width,
            size: Math.random() * 2 + 0.5
          }
        }

        const star_x = (star.x - canvas_center_x) * (focal_length / star.z) + canvas_center_x
        const star_y = (star.y - canvas_center_y) * (focal_length / star.z) + canvas_center_y
        const star_radius = Math.max(0, (star.size * (focal_length / star.z)) / 2)
        const star_opacity = 1.2 - star.z / canvas.width

        const primaryColor = theme.palette.primary.main

        const rgb = primaryColor
          .replace('#', '')
          .match(/.{2}/g)
          ?.map(x => parseInt(x, 16)) || [255, 255, 255]

        context.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${star_opacity})`
        context.beginPath()
        context.arc(star_x, star_y, star_radius, 0, Math.PI * 2)
        context.fill()
      })
    }

    render()
  }, [])

  useEffect(() => {
    initStars({ theme })

    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [initStars, theme])

  return <Canvas ref={canvasRef} />
}

export default StarBackground
