/**
 * Error handling utilities for Try-On feature
 */

interface ErrorTranslations {
  humanModelRequired?: string
  generationFailed?: string
  noImageDetected?: string
  maxModelsReached?: string
}

export const getFriendlyErrorMessage = (
  error: unknown,
  context: string,
  translations?: ErrorTranslations
): string => {
  let rawMessage = 'An unknown error occurred.'

  if (error instanceof Error) {
    rawMessage = error.message
  } else if (typeof error === 'string') {
    rawMessage = error
  } else if (error) {
    rawMessage = String(error)
  }

  try {
    const parsed = JSON.parse(rawMessage)

    if (parsed?.error?.message) {
      rawMessage = parsed.error.message
    }
  } catch {
    // Not JSON - ignore
  }

  if (rawMessage.includes('generation_aborted')) {
    return `${context}. ${translations?.humanModelRequired || 'Please upload a human model!'}`
  }

  if (rawMessage.includes('GENERATION_FAILED')) {
    return `${translations?.generationFailed || 'Generation failed! Make sure to upload with a visible and appropriate person!'}`
  }

  if (rawMessage.includes('NO_IMAGE')) {
    return `${context}. ${translations?.noImageDetected || 'The image could not be processed. Please try uploading a clearer image with a visible person.'}`
  }

  if (rawMessage.includes('Maximum amount of Models')) {
    return `${translations?.maxModelsReached || 'You have reached the maximum number of model pictures. Please delete some existing models to add a new one.'}`
  }

  if (rawMessage.includes('Unsupported MIME type')) {
    try {
      const parsed = JSON.parse(rawMessage)
      const nested = parsed?.error?.message

      if (nested && nested.includes('Unsupported MIME type')) {
        const mimeType = nested.split(': ')[1] || 'unsupported'

        return `${context}. File type '${mimeType}' is not supported. Please use PNG, JPEG, or WEBP images.`
      }
    } catch {
      // Not JSON but string indicates unsupported type
    }

    return `${context}. Unsupported file format. Please upload PNG, JPEG, or WEBP images.`
  }

  if (rawMessage.toLowerCase().includes('rpc failed') || rawMessage.toLowerCase().includes('xhr error')) {
    return `${context}. A network error occurred. Please check your connection and try again.`
  }

  return `${context}. ${rawMessage}`
}

