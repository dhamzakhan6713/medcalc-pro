import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCalculatorBySlug, getAllSlugs, allCalculators } from '@/lib/calculators';
import { toDefinition } from '@/lib/calculators/types';
import { CalculatorShell } from '@/components/CalculatorShell';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: { slug: string };
}

// Pre-renders all 20 calculator pages at build time — this is what makes
// each one a real, fast-loading, crawlable URL for Google instead of a
// client-rendered single page app that search engines struggle with.
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const calculator = getCalculatorBySlug(params.slug);
  if (!calculator) return {};

  return {
    title: `${calculator.name} | MedCalc Pro`,
    description: calculator.description,
    keywords: calculator.keywords,
    openGraph: {
      title: calculator.name,
      description: calculator.description,
      type: 'website',
    },
  };
}

export default async function CalculatorPage({ params }: PageProps) {
  const calculator = getCalculatorBySlug(params.slug);
  if (!calculator) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userPlan: 'free' | 'pro' | 'team' | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    userPlan = (profile?.plan as 'free' | 'pro' | 'team') || 'free';
  }

  const related = allCalculators.filter((c) => c.category === calculator.category && c.slug !== calculator.slug).slice(0, 3);

  // JSON-LD structured data — helps Google understand this is a clinical
  // tool, which can trigger richer search result presentation.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: calculator.name,
    description: calculator.description,
    medicalAudience: 'Clinician',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Calculators</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">{calculator.category}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">{calculator.name}</h1>
      <p className="text-gray-500 mt-1.5 mb-6">{calculator.description}</p>

      <CalculatorShell calculator={toDefinition(calculator)} userPlan={userPlan} />

      <article className="mt-10 prose prose-sm prose-gray max-w-none">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Clinical guide</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{calculator.clinicalGuide}</p>
        <p className="text-xs text-gray-400 mt-4">Reference: {calculator.reference}</p>
      </article>

      {related.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Related calculators</h3>
          <div className="flex flex-col gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/calculators/${r.slug}`} className="text-sm text-brand-600 hover:underline">
                {r.name} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
