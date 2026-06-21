import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

// This is the automation backbone of the whole subscription system.
// Stripe calls this URL automatically whenever something happens to a
// payment or subscription — you configure the URL once in the Stripe
// dashboard (Developers -> Webhooks) and never touch billing logic again.
// Every event below is something that would otherwise require you to
// manually track who paid, who cancelled, and who needs their access revoked.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Verifying the signature proves this request genuinely came from
    // Stripe and wasn't forged by someone trying to grant themselves
    // free Pro access by hitting this endpoint directly.
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Fired the moment a checkout session completes successfully —
      // i.e. the card was charged for the first time.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: 'active',
            })
            .eq('id', userId);
        }
        break;
      }

      // Fired on every renewal, every monthly/annual charge, and the
      // first charge too. Keeping status synced here protects against
      // any edge case where checkout.session.completed didn't fire cleanly.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from('profiles')
          .update({ plan: 'pro', stripe_subscription_status: 'active' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // A renewal payment failed. Stripe will automatically retry per its
      // Smart Retries schedule — we just reflect the at-risk status so we
      // could optionally show a "payment failed" banner in the dashboard.
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from('profiles')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // Subscription was cancelled (immediately, or at period end and the
      // period has now ended). Revoke Pro access automatically.
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from('profiles')
          .update({ plan: 'free', stripe_subscription_status: 'cancelled' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // Catches plan changes (e.g. monthly -> annual) and status changes
      // that don't fall into the cases above.
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        await supabase
          .from('profiles')
          .update({
            stripe_subscription_status: status,
            plan: status === 'active' ? 'pro' : 'free',
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Unhandled event types are fine to ignore — Stripe sends many
        // event types we don't need to act on.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Returning a 500 tells Stripe to retry the webhook later, which is
    // safer than silently swallowing an error that left the database
    // out of sync with what the customer actually paid for.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
