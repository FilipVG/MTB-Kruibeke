import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verplicht: ververst de sessie cookies
  const { data: { user } } = await supabase.auth.getUser();

  // last_seen_at bijhouden — max. 1x per 15 min via cookie-throttle
  if (user) {
    const FIFTEEN_MIN = 15 * 60 * 1000;
    const raw = request.cookies.get('ls_updated')?.value;
    const lastUpdated = raw ? parseInt(raw, 10) : 0;
    if (Date.now() - lastUpdated > FIFTEEN_MIN) {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);
      supabaseResponse.cookies.set('ls_updated', String(Date.now()), {
        maxAge: 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  const pathname = request.nextUrl.pathname;

  // Beschermde routes
  const protectedPaths = ['/profiel', '/klassement', '/leden', '/admin'];
  const adminPaths = ['/admin'];

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));
  const isAdminPath = adminPaths.some(p => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
