'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Crown, LogOut, FileText } from 'lucide-react';

interface SavedCalculation {
  id: string;
  calculator_name: string;
  result: { value: string | number; unit?: string };
  created_at: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<{ plan: string; email: string } | null>(null);
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('plan, email').eq('id', user.id).single();
      setProfile(profileData);

      if (profileData?.plan === 'pro' || profileData?.plan === 'team') {
        const res = await fetch('/api/calculations');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.calculations || []);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleUpgrade(plan: 'monthly' | 'annual') {
    setCheckoutLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setCheckoutLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'team';
  const showUpgradePrompt = searchParams.get('upgrade') === 'true' && !isPro;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{profile?.email}</p>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl p-5 bg-white mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPro ? 'bg-brand-50' : 'bg-gray-100'}`}>
            <Crown className={`w-4.5 h-4.5 ${isPro ? 'text-brand-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{isPro ? 'Pro plan' : 'Free plan'}</p>
            <p className="text-sm text-gray-500">{isPro ? 'Unlimited access to all features' : '3 free AI explanations remaining'}</p>
          </div>
        </div>
        {!isPro && (
          <div className="flex gap-2">
            <button
              onClick={() => handleUpgrade('monthly')}
              disabled={checkoutLoading}
              className="bg-brand-600 hover:bg-brand-800 text-white text-sm font-medium rounded-lg px-4 py-2 transition disabled:opacity-60"
            >
              Upgrade — $9/mo
            </button>
          </div>
        )}
      </div>

      {showUpgradePrompt && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-6 text-sm text-amber-800">
          That calculator (or feature) needs a Pro subscription — upgrade above to unlock it.
        </div>
      )}

      {isPro && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Calculation history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              No saved calculations yet. Use any calculator and click "Save to history."
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{item.calculator_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">{item.result.value} {item.result.unit}</span>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
