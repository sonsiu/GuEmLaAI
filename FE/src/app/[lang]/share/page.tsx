import { Metadata } from 'next'
import SharePageClient from './SharePageClient'
import { getPresignedUrl } from './utils'

interface Props {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ img?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  await params
  const queryParams = await searchParams
  const img = queryParams.img

  if (!img) {
    return {
      title: 'AI Fashion Try-On | GuEmLaAI',
      description: 'Experience AI-powered virtual fashion try-on. Create and share your perfect outfits instantly.',
    }
  }

  // Use the same logic as SharePageClient - fetch presigned URL from backend
  const imageUrl = await getPresignedUrl(img)

  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
  const shareUrl = `${baseUrl}/share?img=${encodeURIComponent(img)}`

  return {
    title: 'My AI Fashion Try-On | GuEmLaAI',
    description: 'Check out this amazing AI-generated fashion try-on result created with GuEmLaAI!',
    openGraph: {
      title: 'My AI Fashion Try-On | GuEmLaAI',
      description: 'Check out this amazing AI-generated fashion try-on result created with GuEmLaAI!',
      url: shareUrl,
      siteName: 'GuEmLaAI',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: 'AI-generated fashion try-on result',
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My AI Fashion Try-On | GuEmLaAI',
      description: 'Check out this amazing AI-generated fashion try-on result created with GuEmLaAI!',
      images: imageUrl ? [imageUrl] : [],
      creator: '@GuEmLaAI',
    },
  }
}

export default async function SharePage({ params, searchParams }: Props) {
  const queryParams = await searchParams
  const imageUrl = queryParams.img

  return <SharePageClient imageUrl={imageUrl} />
}
