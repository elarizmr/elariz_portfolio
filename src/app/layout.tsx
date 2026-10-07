import type { ReactNode } from 'react';
import { getRoomMetadata } from '../config/routeMetadata';
import './globals.css';

const homeMetadata = getRoomMetadata('/');

export const metadata = {
  title: homeMetadata.title,
  description: homeMetadata.description,
  applicationName: 'Elariz Recebov Portfolio',
  authors: [{ name: 'Elariz Recebov' }],
  keywords: [
    'Elariz Recebov',
    'Elariz Recebov portfolio',
    'web developer portfolio',
    '3D web development',
    'React developer',
    'Next.js developer',
    'Frontend engineer',
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favico.png',
    apple: '/favico.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Elariz Recebov Portfolio',
    title: homeMetadata.title,
    description: homeMetadata.description,
    images: [{ url: '/og-image.webp', width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: homeMetadata.title,
    description: homeMetadata.description,
    images: ['/og-image.webp'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#fafafa" />
        <style>{`
          .sr-only-seo {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}