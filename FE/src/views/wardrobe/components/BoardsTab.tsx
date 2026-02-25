'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { Board } from '@/types/wardrobe.type'
import BoardCard from './BoardCard'
import HistoryBoardCard from './HistoryBoardCard'

interface BoardsTabProps {
  boards: Board[]
  historyBoard: any
  onBoardClick: (boardId: number) => void
  onBoardEdit: (board: Board) => void
  onCreateBoard: () => void
  onHistoryBoardClick: () => void
  getTimeAgo: (dateString: string) => string
}

const BoardsTab: React.FC<BoardsTabProps> = ({
  boards,
  historyBoard,
  onBoardClick,
  onBoardEdit,
  onCreateBoard,
  onHistoryBoardClick,
  getTimeAgo
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const hasContent = boards.length > 0 || historyBoard

  if (!hasContent) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)'
              }`
          }}
        >
          <i
            className="tabler-plus"
            style={{
              fontSize: 48,
              color: theme.palette.primary.main
            }}
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          {t('tryOn.wardrobe.empty.boards.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('tryOn.wardrobe.empty.boards.description')}
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {historyBoard && (
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <HistoryBoardCard
            historyBoard={historyBoard}
            onClick={onHistoryBoardClick}
            getTimeAgo={getTimeAgo}
          />
        </Grid>
      )}
      {boards.map((board) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={board.id}>
          <BoardCard
            board={board}
            onClick={() => onBoardClick(board.id)}
            onEdit={() => onBoardEdit(board)}
            getTimeAgo={getTimeAgo}
          />
        </Grid>
      ))}
    </Grid>
  )
}

export default BoardsTab

