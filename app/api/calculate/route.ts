import { NextRequest, NextResponse } from 'next/server';
import { getCalculatorBySlug } from '@/lib/calculators';

// The calculator's `calculate` function lives only on the server (inside
// the registry files). The browser can't receive a JavaScript function
// from a server component, so instead the browser sends the slug + the
// user's inputs here, and gets back just the result data.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, inputs } = body;

    const calculator = getCalculatorBySlug(slug);
    if (!calculator) {
      return NextResponse.json({ error: 'Calculator not found.' }, { status: 404 });
    }

    const result = calculator.calculate(inputs);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Calculate error:', error);
    return NextResponse.json({ error: 'Could not calculate. Check your inputs.' }, { status: 400 });
  }
}
