// Shared shape for every calculator in the registry. Keeping this strict
// means the UI (CalculatorShell) can render any calculator generically —
// you add a new calculator by adding data, not by writing new UI code.

export type FieldType = 'number' | 'select' | 'radio';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface CalculatorField {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[]; // required when type is 'select' or 'radio'
  helpText?: string;
}

export interface CalculatorResult {
  value: number | string;
  unit?: string;
  interpretation: string; // plain-English clinical meaning of the result
  severity?: 'low' | 'moderate' | 'high' | 'critical' | 'neutral';
  breakdown?: { label: string; value: string | number }[]; // optional scoring breakdown
}

export interface Calculator {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  tier: 'free' | 'pro';
  fields: CalculatorField[];
  calculate: (inputs: Record<string, number | string>) => CalculatorResult;
  reference: string; // citation for the original validated formula/score
  clinicalGuide: string; // ~500 word SEO + educational content, plain text/markdown
  keywords: string[];
}

// The same shape as Calculator, minus the `calculate` function. Server
// components pass THIS version down to client components — functions
// can't cross the server/client boundary in Next.js, only plain data.
// The actual calculation runs server-side via /api/calculate instead.
export type CalculatorDefinition = Omit<Calculator, 'calculate'>;

export function toDefinition(calculator: Calculator): CalculatorDefinition {
  const { calculate, ...definition } = calculator;
  return definition;
}
