'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import type { Board } from '@/types/wardrobe.type'

interface BoardCardProps {
  board: Board
  onClick: () => void
  onEdit: () => void
  getTimeAgo: (dateString: string) => string
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  getTimeAgo
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (board.coverImageUrl) {
      const img = new Image()
      img.src = board.coverImageUrl
      img.onload = () => setImageLoaded(true)
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [board.coverImageUrl])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1/1' }}>
        {!imageLoaded && board.coverImageUrl && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: '60%',
                height: '60%',
                bgcolor: 'grey.300',
                borderRadius: 1
              }}
            />
          </Box>
        )}

        {imageLoaded && (
          <>
            {board.coverImageUrl && !imageError ? (
              <CardMedia
                component="img"
                image={board.coverImageUrl}
                alt={board.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'grey.200',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0.5
                }}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <Box key={idx} sx={{ bgcolor: 'grey.300' }} />
                ))}
              </Box>
            )}

            <IconButton
              onClick={handleEditClick}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'background.paper',
                opacity: 0,
                transition: 'opacity 0.3s',
                '&:hover': { bgcolor: 'background.paper' },
                boxShadow: 2,
               
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0'
              }}
            >
              <i className="tabler-pencil" />
            </IconButton>
          </>
        )}
      </Box>

      <CardContent>
        <Typography variant="h6" component="h3" noWrap gutterBottom>
          {board.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          0 Pins · {getTimeAgo(board.createdAt)}
        </Typography>
        {board.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
            noWrap
          >
            {board.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default BoardCard

