import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Used on the server — in API routes, server components, and middleware —
// where we need to read the user's session from cookies to decide what
// they're allowed to see (e.g. is this user on the Pro plan?).
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // set() fails in some server component contexts — safe to ignore,
            // middleware refreshes the session on the next request anyway.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // same as above
          }
        },
      },
    }
  );
}

// A privileged client that bypasses row-level security. Only ever use this
// inside server-only code (API routes) for actions a regular user shouldn't
// be able to do themselves — e.g. the Stripe webhook marking someone as Pro.
// NEVER import this into a client component or expose the service role key
// to the browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
