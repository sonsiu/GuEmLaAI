// Shared utility for getting presigned URLs
export async function getPresignedUrl(filename: string): Promise<string> {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backend) return ''

    const apiUrl = `${backend.replace(/\/+$/, '')}/api/Wasabi/presigned-url/${encodeURIComponent(filename)}`
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (res.ok) {
      const data = await res.json()
      return data.url || data.presignedUrl || data.src || ''
    }
  } catch (error) {
    //console.error('Failed to get presigned URL:', error)
  }

  return ''
}
