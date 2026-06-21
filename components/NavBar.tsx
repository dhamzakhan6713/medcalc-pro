import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export async function NavBar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          MedCalc Pro
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#calculators" className="text-gray-600 hover:text-gray-900">Calculators</Link>
          <Link href="/#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
          {user ? (
            <Link href="/dashboard" className="bg-brand-600 hover:bg-brand-800 text-white rounded-lg px-4 py-1.5 font-medium transition">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="bg-brand-600 hover:bg-brand-800 text-white rounded-lg px-4 py-1.5 font-medium transition">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
