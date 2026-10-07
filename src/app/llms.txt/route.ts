import { buildLlmsTxt } from '../../lib/seo';
import { getSeoData } from '../seo';

export async function GET() {
  const data = await getSeoData();

  return new Response(
    buildLlmsTxt(data.globalInfo, data.projects, data.faqList),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
