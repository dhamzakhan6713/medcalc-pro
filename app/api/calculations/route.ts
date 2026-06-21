import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Saves a calculation to history. Pro-only — row-level security in
// Postgres also enforces that users can only ever write/read their own
// rows, so this check is a UX nicety, not the real security boundary.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
  if (profile?.plan !== 'pro' && profile?.plan !== 'team') {
    return NextResponse.json({ error: 'Saving history is a Pro feature.' }, { status: 403 });
  }

  const body = await request.json();
  const { calculatorSlug, calculatorName, inputs, result, patientLabel } = body;

  const { error } = await supabase.from('calculations').insert({
    user_id: user.id,
    calculator_slug: calculatorSlug,
    calculator_name: calculatorName,
    inputs,
    result,
    patient_label: patientLabel || null,
  });

  if (error) {
    console.error('Save calculation error:', error);
    return NextResponse.json({ error: 'Could not save calculation.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Fetches the signed-in user's calculation history, most recent first.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Could not fetch history.' }, { status: 500 });
  }

  return NextResponse.json({ calculations: data });
}
