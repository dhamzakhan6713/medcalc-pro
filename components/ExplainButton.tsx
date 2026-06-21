'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Lock } from 'lucide-react';

interface ExplainButtonProps {
  calculatorName: string;
  inputs: Record<string, any>;
  result: { value: string | number; unit?: string; interpretation: string };
}

export function ExplainButton({ calculatorName, inputs, result }: ExplainButtonProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [paywalled, setPaywalled] = useState(false);
  const [error, setError] = useState('');

  async function handleExplain() {
    setLoading(true);
    setError('');
    setPaywalled(false);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculatorName, inputs, result }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === 'paywall') {
        setPaywalled(true);
      } else if (!res.ok) {
        setError(data.message || data.error || 'Something went wrong.');
      } else {
        setExplanation(data.explanation);
      }
    } catch {
      setError('Could not reach the AI explanation service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {!explanation && !paywalled && (
        <button
          onClick={handleExplain}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-lg px-4 py-2 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Thinking...' : 'Explain this result with AI'}
        </button>
      )}

      {paywalled && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">You've used your free AI explanations</p>
            <p className="text-sm text-amber-700 mt-0.5">Upgrade to Pro for unlimited AI-powered clinical explanations on every calculator.</p>
            <a href="/dashboard?upgrade=true" className="inline-block mt-2 text-sm font-medium text-brand-600 hover:underline">
              Upgrade to Pro →
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {explanation && (
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-gray-900">AI clinical explanation</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
