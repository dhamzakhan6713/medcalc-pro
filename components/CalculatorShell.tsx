'use client';

import { useState } from 'react';
import { CalculatorDefinition, CalculatorResult } from '@/lib/calculators/types';
import { ExplainButton } from './ExplainButton';
import { Download, Save, AlertCircle, Lock } from 'lucide-react';

interface CalculatorShellProps {
  calculator: CalculatorDefinition;
  userPlan: 'free' | 'pro' | 'team' | null; // null = not signed in
}

const severityStyles: Record<string, string> = {
  low: 'bg-success-50 text-success-800 border-success-600',
  moderate: 'bg-amber-50 text-amber-800 border-amber-500',
  high: 'bg-orange-50 text-orange-800 border-orange-500',
  critical: 'bg-red-50 text-red-800 border-red-500',
  neutral: 'bg-brand-50 text-brand-800 border-brand-600',
};

export function CalculatorShell({ calculator, userPlan }: CalculatorShellProps) {
  const [inputs, setInputs] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pdfLoading, setPdfLoading] = useState(false);

  const isPro = userPlan === 'pro' || userPlan === 'team';
  const allFieldsFilled = calculator.fields
    .filter((f) => !f.placeholder) // fields with a placeholder are treated as optional
    .every((f) => inputs[f.id] !== undefined && inputs[f.id] !== '');

  function handleChange(fieldId: string, value: string | number) {
    setInputs((prev) => ({ ...prev, [fieldId]: value }));
    setResult(null);
    setSaveStatus('idle');
  }

  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState('');

  async function handleCalculate() {
    setCalculating(true);
    setCalcError('');
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: calculator.slug, inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCalcError(data.error || 'Could not calculate. Check your inputs.');
        setResult(null);
      } else {
        setResult(data.result);
      }
    } catch {
      setCalcError('Could not reach the server. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorSlug: calculator.slug,
          calculatorName: calculator.name,
          inputs,
          result,
        }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleExportPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculatorName: calculator.name, inputs, result }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${calculator.slug}-report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setPdfLoading(false);
    }
  }

  // Pro-tier calculators show a locked state for free users instead of the form.
  if (calculator.tier === 'pro' && !isPro) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 bg-white text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">{calculator.name} is a Pro calculator</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{calculator.description}</p>
        <a
          href="/dashboard?upgrade=true"
          className="inline-block bg-brand-600 hover:bg-brand-800 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition"
        >
          Upgrade to Pro — $9/month
        </a>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="p-6 space-y-4">
        {calculator.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
            </label>

            {field.type === 'number' && (
              <input
                type="number"
                step={field.step ?? 1}
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                value={inputs[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            )}

            {field.type === 'select' && (
              <select
                value={inputs[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="" disabled>Select...</option>
                {field.options?.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="flex gap-2">
                {field.options?.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleChange(field.id, opt.value)}
                    className={`flex-1 text-sm font-medium rounded-lg px-3 py-2 border transition ${
                      inputs[field.id] === opt.value
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}
          </div>
        ))}

        <button
          onClick={handleCalculate}
          disabled={!allFieldsFilled || calculating}
          className="w-full bg-brand-600 hover:bg-brand-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition"
        >
          {calculating ? 'Calculating...' : 'Calculate'}
        </button>
        {calcError && <p className="text-sm text-red-600">{calcError}</p>}
      </div>

      {result && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className={`border-l-4 rounded-lg p-4 ${severityStyles[result.severity || 'neutral']}`}>
            <div className="text-2xl font-semibold">
              {result.value} {result.unit}
            </div>
            <p className="text-sm mt-1.5 leading-relaxed">{result.interpretation}</p>
          </div>

          {result.breakdown && (
            <div className="mt-3 flex gap-3 flex-wrap">
              {result.breakdown.map((b) => (
                <div key={b.label} className="text-xs bg-white border border-gray-200 rounded-md px-3 py-1.5">
                  <span className="text-gray-500">{b.label}:</span>{' '}
                  <span className="font-medium text-gray-900">{b.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {isPro ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-white transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : 'Save to history'}
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-white transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {pdfLoading ? 'Generating...' : 'Export PDF'}
                </button>
              </>
            ) : (
              <a href="/dashboard?upgrade=true" className="flex items-center gap-1.5 text-sm font-medium text-brand-600">
                <Lock className="w-3.5 h-3.5" /> Save history &amp; export PDF with Pro
              </a>
            )}
          </div>

          <ExplainButton calculatorName={calculator.name} inputs={inputs} result={result} />

          <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-200">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              This calculator is a decision-support aid, not a substitute for clinical judgement. Always verify against current local
              guidelines before acting on the result.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}