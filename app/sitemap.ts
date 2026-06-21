import { MetadataRoute } from 'next';
import { getAllSlugs } from '@/lib/calculators';

// Next.js automatically serves this at /sitemap.xml — no extra routing
// needed. It lists every page on the site so Google can discover all 20
// calculator pages immediately instead of finding them slowly over time.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcalc-pro-j9r7.vercel.app';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), priority: 0.5 },
  ];

  const calculatorPages = getAllSlugs().map((slug) => ({
    url: `${baseUrl}/calculators/${slug}`,
    lastModified: new Date(),
    priority: 0.8,
  }));

  return [...staticPages, ...calculatorPages];
}
