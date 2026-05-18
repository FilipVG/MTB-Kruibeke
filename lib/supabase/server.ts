import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { NextResponse } from 'next/server';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The setAll method was called from a Server Component.
            // Kan veilig genegeerd worden als je middleware de sessie ververst.
          }
        },
      },
    }
  );
}

/**
 * Helper: huidige gebruiker + profiel ophalen.
 * Returnt null als niet ingelogd.
 * Gecached per request: meerdere aanroepen per page render = 1 DB-call.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
});

/**
 * API-route guard: verifieert dat de aanroeper admin is.
 * Geeft een NextResponse (403/401) terug als dat niet het geval is,
 * anders het supabase-client object om verder mee te werken.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  return supabase;
}
