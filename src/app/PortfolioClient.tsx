'use client';

import dynamic from 'next/dynamic';

const Portfolio = dynamic(() => import('../components/PortfolioApp'), {
  ssr: false,
  loading: () => null,
});

export default function PortfolioClient() {
  return <Portfolio />;
}
