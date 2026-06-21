import Link from 'next/link';
import { getCalculatorsByCategory } from '@/lib/calculators';
import { ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  const byCategory = getCalculatorsByCategory();

  return (
    <div>
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          Clinical calculators, verified by a working doctor
        </h1>
        <p className="text-gray-500 mt-4 text-base md:text-lg leading-relaxed">
          20 free clinical decision tools — eGFR, CHA₂DS₂-VASc, Wells Score, CURB-65, and more. Every formula checked
          against its original published reference.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <a href="#calculators" className="bg-brand-600 hover:bg-brand-800 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition">
            Browse calculators
          </a>
          <a href="#pricing" className="border border-gray-300 hover:bg-gray-50 rounded-lg px-5 py-2.5 text-sm font-medium transition">
            See Pro features
          </a>
        </div>
      </section>

      <section id="calculators" className="max-w-5xl mx-auto px-4 py-12">
        {Object.entries(byCategory).map(([category, calcs]) => (
          <div key={category} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {calcs.map((calc) => (
                <Link
                  key={calc.slug}
                  href={`/calculators/${calc.slug}`}
                  className="flex items-center justify-between border border-gray-200 bg-white rounded-lg p-4 hover:border-brand-400 hover:shadow-sm transition group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{calc.name}</span>
                      {calc.tier === 'pro' && (
                        <span className="text-[10px] font-semibold bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">PRO</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{calc.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition flex-shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="pricing" className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">Simple pricing</h2>
        <p className="text-center text-gray-500 mb-10">Free for every calculator. Pro for the features clinicians actually want.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h3 className="font-semibold text-gray-900">Free</h3>
            <div className="text-3xl font-semibold text-gray-900 mt-2">$0</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> All 19 free calculators</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Instant clinical interpretation</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> 3 free AI explanations</li>
            </ul>
          </div>
          <div className="border-2 border-brand-600 rounded-xl p-6 bg-white relative">
            <span className="absolute -top-3 left-6 bg-brand-600 text-white text-xs font-medium px-2 py-0.5 rounded">Most popular</span>
            <h3 className="font-semibold text-gray-900">Pro</h3>
            <div className="text-3xl font-semibold text-gray-900 mt-2">$9<span className="text-base text-gray-400 font-normal">/month</span></div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Everything in Free</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Unlimited AI explanations</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Save calculation history</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Branded PDF export</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-600" /> Pro-only calculators (SOFA, and more)</li>
            </ul>
            <Link href="/login" className="block text-center mt-5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg py-2.5 text-sm font-medium transition">
              Start free, upgrade anytime
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
