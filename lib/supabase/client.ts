import { createBrowserClient } from '@supabase/ssr';

// Used inside React components that run in the browser (sign in forms,
// the dashboard, the "Upgrade to Pro" button). Reads the public anon key,
// which is safe to expose — row-level security in Postgres does the
// actual access control.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
