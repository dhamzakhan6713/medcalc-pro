import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

// Called when a logged-in user clicks "Upgrade to Pro". Creates a Stripe
// Checkout session and returns the URL to redirect them to. Stripe hosts
// the actual payment form — we never see or store card details.
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to upgrade.' }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan === 'annual' ? 'annual' : 'monthly';
    const priceId = plan === 'annual' ? STRIPE_PRICE_IDS.proAnnual : STRIPE_PRICE_IDS.proMonthly;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // Reuse an existing Stripe customer if we already created one for this
    // user, otherwise let Checkout create a new one and we save the ID
    // via the webhook once the session completes.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email),
      client_reference_id: user.id, // lets the webhook map the Stripe event back to this user
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=false`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
