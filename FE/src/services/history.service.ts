import { ClientApi } from './client-api.service'
import type { HistoryBoardImage, HistoryBoardImageInfo } from '@/views/try-on/types'

class HistoryService {
  async getHistoryBoardImages(userId: number, urlExpiryMinutes: number = 60): Promise<HistoryBoardImage[]> {
    if (!userId) {
      return []
    }

    try {
      const response = await ClientApi.get<HistoryBoardImage[]>(
        `/Board/history/${userId}/images?urlExpiryMinutes=${urlExpiryMinutes}`
      )

      return response.getRaw().data || []
    } catch (error) {
      // Suppress error silently - API may not have history data yet
      return []
    }
  }

  async getHistoryBoardImageInfo(boardId: number): Promise<HistoryBoardImageInfo | null> {
    try {
      const response = await ClientApi.get<HistoryBoardImageInfo>(`/Board/history/${boardId}`)

      return response.getRaw().data
    } catch (error) {
      // Suppress error silently - board history info may not exist
      return null
    }
  }
}

export const historyService = new HistoryService()

