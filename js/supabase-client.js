// ── SUPABASE CLIENT & SHARED GLOBALS ────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(
  'https://mmlwddyksjsxzsuohhwc.supabase.co',
  'sb_publishable_jf1ycwxyiHLHDyNGi6OTMQ_aNHZAw6L',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'budgetapp-session',
      storage: window.localStorage,
      experimental: { passkey: true }
    }
  }
);
let currentUser = null;
let authInProgress = false;
