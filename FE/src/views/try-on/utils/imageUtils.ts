/**
 * Image utility functions for Try-On feature
 */

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}

export const imageUrlToDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to download the generated image.')
  }

  const blob = await response.blob()

  return blobToDataUrl(blob)
}

export const toDataUrl = (base64: string | undefined, mimeType?: string): string => {
  if (!base64) {
    throw new Error('No image data returned from the server.')
  }

  if (base64.startsWith('data:')) {
    return base64
  }

  const type = mimeType || 'image/png'

  return `data:${type};base64,${base64}`
}

