import { useState } from 'react'

export const useImageSegmentation = () => {
  const [segmentedOutput, setSegmentedOutput] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [segmentStatus, setSegmentStatus] = useState<string>('')

  const resetSegmentation = () => {
    setSegmentedOutput(null)
    setAiError(null)
    setIsAIProcessing(false)
    setSegmentStatus('')
  }

  return {
    segmentedOutput,
    setSegmentedOutput,
    aiError,
    setAiError,
    isAIProcessing,
    setIsAIProcessing,
    segmentStatus,
    setSegmentStatus,
    resetSegmentation
  }
}

