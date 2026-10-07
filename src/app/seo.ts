import { cache } from 'react';
import { getRoomMetadata } from '../config/routeMetadata';
import { siteData } from '../data/siteData';

export const getSeoData = cache(async () => siteData);

interface MetadataRouteProps {
  params?: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: MetadataRouteProps = {}) {
  const routeParams = params ? await params : {};
  const pathname = routeParams.slug?.length ? `/${routeParams.slug.join('/')}` : '/';
  const roomMetadata = getRoomMetadata(pathname);
  
  return {
    title: roomMetadata.title || 'Elariz — Frontend Developer Portfolio',
    description: roomMetadata.description || 'Elariz Recebov — Front-End Developer. Interactive web applications & 3D portfolio.',
    openGraph: {
      title: roomMetadata.title || 'Elariz — Frontend Developer Portfolio',
      description: roomMetadata.description || 'Elariz Recebov — Front-End Developer. Interactive web applications & 3D portfolio.',
    },
    twitter: {
      title: roomMetadata.title || 'Elariz — Frontend Developer Portfolio',
      description: roomMetadata.description || 'Elariz Recebov — Front-End Developer. Interactive web applications & 3D portfolio.',
    },
  };
}