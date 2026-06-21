import Stripe from 'stripe';

// Server-only Stripe client. Never import this into a 'use client' component —
// the secret key must never reach the browser.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  proAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
};
