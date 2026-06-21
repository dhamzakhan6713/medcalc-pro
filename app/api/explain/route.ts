import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const FREE_EXPLANATION_LIMIT = 3; // free users get 3 tries before hitting the Pro paywall

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to use AI explanations.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const isPro = profile?.plan === 'pro' || profile?.plan === 'team';

    // Free users get a limited number of explanations as a taste of the
    // Pro feature — tracked in ai_explanation_usage. This is the upsell
    // mechanism: the feature has to be genuinely useful for this to work.
    if (!isPro) {
      const admin = createAdminClient();
      const { data: usage } = await admin
        .from('ai_explanation_usage')
        .select('count_used')
        .eq('user_id', user.id)
        .single();

      const countUsed = usage?.count_used ?? 0;
      if (countUsed >= FREE_EXPLANATION_LIMIT) {
        return NextResponse.json(
          { error: 'paywall', message: `You've used your ${FREE_EXPLANATION_LIMIT} free AI explanations. Upgrade to Pro for unlimited access.` },
          { status: 403 }
        );
      }

      await admin
        .from('ai_explanation_usage')
        .upsert({ user_id: user.id, count_used: countUsed + 1, last_used_at: new Date().toISOString() });
    }

    const body = await request.json();
    const { calculatorName, inputs, result } = body;

    if (!calculatorName || !result) {
      return NextResponse.json({ error: 'Missing calculator data.' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `A clinician just used the "${calculatorName}" calculator.

Inputs: ${JSON.stringify(inputs)}
Result: ${JSON.stringify(result)}

In plain, clinically precise language (under 150 words), explain:
1. What this result means for the patient right now
2. The most important next clinical step
3. Any red flag the clinician should not miss

Write for a doctor, not a patient — be direct and clinical, not reassuring or padded. Do not repeat the raw numbers back, interpret them.`,
        },
      ],
    });

    const explanation = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json({ error: 'Could not generate explanation right now.' }, { status: 500 });
  }
}
