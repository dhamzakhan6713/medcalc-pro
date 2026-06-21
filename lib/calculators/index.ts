import { Calculator } from './types';
import { calculatorsPart1 } from './registry-part1';
import { calculatorsPart2 } from './registry-part2';

export const allCalculators: Calculator[] = [...calculatorsPart1, ...calculatorsPart2];

export function getCalculatorBySlug(slug: string): Calculator | undefined {
  return allCalculators.find((c) => c.slug === slug);
}

export function getAllSlugs(): string[] {
  return allCalculators.map((c) => c.slug);
}

export function getCalculatorsByCategory(): Record<string, Calculator[]> {
  return allCalculators.reduce((acc, calc) => {
    if (!acc[calc.category]) acc[calc.category] = [];
    acc[calc.category].push(calc);
    return acc;
  }, {} as Record<string, Calculator[]>);
}

export function getFreeCalculators(): Calculator[] {
  return allCalculators.filter((c) => c.tier === 'free');
}

export function getProCalculators(): Calculator[] {
  return allCalculators.filter((c) => c.tier === 'pro');
}
