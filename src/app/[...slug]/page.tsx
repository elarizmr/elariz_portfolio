import { notFound } from 'next/navigation';
import PortfolioClient from '../PortfolioClient';
import SeoContent from '../SeoContent';
import { generateMetadata } from '../seo';

export { generateMetadata };

const ROOM_PATHS = new Set(['about', 'gallery', 'contact']);

interface RoomPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;

  if (slug.length !== 1 || !ROOM_PATHS.has(slug[0])) {
    notFound();
  }

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/textures/paper-texture.webp"
        type="image/webp"
        fetchPriority="high"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Gloria+Hallelujah&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <SeoContent />
      <PortfolioClient />
    </>
  );
}
