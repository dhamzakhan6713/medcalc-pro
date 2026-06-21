import { MetadataRoute } from 'next';

// Served automatically at /robots.txt — tells Google and other search
// engines they're welcome to crawl the whole site, and points them
// directly at the sitemap so they find every calculator page fast.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcalc-pro-j9r7.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
