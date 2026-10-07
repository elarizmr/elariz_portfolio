import PortfolioClient from './PortfolioClient';
import SeoContent from './SeoContent';

export { generateMetadata } from './seo';

export default function HomePage() {
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
