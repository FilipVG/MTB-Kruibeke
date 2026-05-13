'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { cn, getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/kalender', label: 'Kalender' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/lid-worden', label: 'Lid worden' },
];

const memberLinks = [
  { href: '/klassement', label: 'Klassement' },
  { href: '/leden', label: 'Wie is wie' },
];

export function Header({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const allLinks = profile ? [...publicLinks, ...memberLinks] : publicLinks;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-24 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {allLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition',
                  pathname === link.href
                    ? 'text-white bg-ink-900'
                    : 'text-ink-300 hover:text-white hover:bg-ink-900/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="btn-ghost text-brand-400">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {profile ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profiel"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-ink-900 transition"
                >
                  <Avatar profile={profile} size="sm" />
                  <span className="text-sm font-medium text-ink-100">
                    {profile.nickname || profile.first_name}
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost" aria-label="Uitloggen">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary">
                Inloggen
              </Link>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -mr-2 text-ink-200"
            aria-label="Menu openen"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="lg:hidden border-t border-ink-800 py-3 space-y-1">
            {allLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2.5 text-sm font-medium rounded-md',
                  pathname === link.href
                    ? 'text-white bg-ink-900'
                    : 'text-ink-300 hover:bg-ink-900/50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-ink-800 space-y-2">
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-brand-400 rounded-md hover:bg-ink-900/50"
                >
                  Admin paneel
                </Link>
              )}
              {profile ? (
                <>
                  <Link
                    href="/profiel"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md hover:bg-ink-900/50"
                  >
                    <User className="h-4 w-4" />
                    Mijn profiel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm rounded-md hover:bg-ink-900/50"
                  >
                    <LogOut className="h-4 w-4" />
                    Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block btn-secondary text-center">
                    Inloggen
                  </Link>
                  <Link href="/lid-worden" className="block btn-primary text-center">
                    Lid worden
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Avatar({ profile, size = 'md' }: {
  profile: Pick<Profile, 'avatar_url' | 'first_name' | 'last_name' | 'nickname'>;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = { sm: 'h-7 w-7 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' }[size];
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt=""
        className={cn(sizeClass, 'rounded-full object-cover')}
      />
    );
  }
  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-brand-700 flex items-center justify-center font-medium text-white'
      )}
    >
      {getInitials(profile)}
    </div>
  );
}
