import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { CalculationPDF } from '@/components/CalculationPDF';

// Pro-only feature: turns a calculation result into a downloadable,
// branded PDF a doctor can attach to patient notes or print for a chart.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('plan, full_name').eq('id', user.id).single();
  if (profile?.plan !== 'pro' && profile?.plan !== 'team') {
    return NextResponse.json({ error: 'PDF export is a Pro feature.' }, { status: 403 });
  }

  const body = await request.json();
  const { calculatorName, patientLabel, inputs, result } = body;

  try {
    const buffer = await renderToBuffer(
      <CalculationPDF
        calculatorName={calculatorName}
        patientLabel={patientLabel}
        inputs={inputs}
        result={result}
        clinicianName={profile?.full_name || undefined}
        generatedAt={new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
      />
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${calculatorName.replace(/\s+/g, '-')}-report.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Could not generate PDF.' }, { status: 500 });
  }
}
