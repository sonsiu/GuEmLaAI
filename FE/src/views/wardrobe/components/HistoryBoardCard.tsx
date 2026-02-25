'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import type { HistoryBoard } from '@/types/wardrobe.type'

interface HistoryBoardCardProps {
  historyBoard: HistoryBoard
  onClick: () => void
  getTimeAgo: (dateString: string) => string
}

const HistoryBoardCard: React.FC<HistoryBoardCardProps> = ({
  historyBoard,
  onClick,
  getTimeAgo
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (historyBoard.imageUrl) {
      const img = new Image()
      img.src = historyBoard.imageUrl
      img.onload = () => setImageLoaded(true)
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [historyBoard.imageUrl])

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
        flexDirection: 'column',
        position: 'relative'
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1/1' }}>
        {!imageLoaded && historyBoard.imageUrl && (
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
            {historyBoard.imageUrl && !imageError ? (
              <CardMedia
                component="img"
                image={historyBoard.imageUrl}
                alt="History Board"
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No Image
                </Typography>
              </Box>
            )}

            <Chip
              icon={<i className="tabler-clock" />}
              label="Recent"
              size="small"
              color="secondary"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                boxShadow: 2
              }}
            />
          </>
        )}
      </Box>

      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" component="h3" fontWeight={500} noWrap>
          Recent History
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {getTimeAgo(historyBoard.createdAt)}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default HistoryBoardCard

