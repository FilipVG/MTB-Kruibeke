'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatRideDate, toDatetimeLocal, fromDatetimeLocal } from '@/lib/utils';
import { Check, X, Trash2, AlertTriangle, UserPlus } from 'lucide-react';

interface Registration {
  id: string;
  attended: boolean | null;
  user_id: string;
  profile: { first_name: string | null; last_name: string | null; nickname: string | null };
}

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
}

interface Ride {
  id: string;
  title: string;
  description: string | null;
  ride_type: 'mtb' | 'gravel' | 'baanrit';
  start_at: string;
  start_location: string;
  distance_km: number | null;
  gpx_url: string | null;
  in_ranking: boolean;
  points: number;
  registration_open: boolean;
  cancelled: boolean;
}

export default function RitBeheerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [ride, setRide] = useState<Ride | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [form, setForm] = useState<Omit<Ride, 'id'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [addMemberId, setAddMemberId] = useState('');

  useEffect(() => {
    async function load() {
      const { data: r } = await supabase.from('rides').select('*').eq('id', id).single();
      if (r) {
        setRide(r);
        setForm({
          title: r.title,
          description: r.description ?? '',
          ride_type: r.ride_type,
          start_at: toDatetimeLocal(r.start_at),
          start_location: r.start_location,
          distance_km: r.distance_km,
          gpx_url: r.gpx_url,
          in_ranking: r.in_ranking,
          points: r.points,
          registration_open: r.registration_open,
          cancelled: r.cancelled,
        });
      }
      const { data: regs } = await supabase
        .from('ride_registrations')
        .select('id, attended, user_id, profile:profiles(first_name, last_name, nickname)')
        .eq('ride_id', id)
        .order('created_at', { ascending: true });
      setRegistrations((regs as unknown as Registration[]) ?? []);

      const { data: members } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname')
        .eq('is_active', true)
        .order('first_name', { ascending: true });
      setAllMembers((members as Member[]) ?? []);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);

    let gpx_url = ride?.gpx_url ?? null;
    if (gpxFile) {
      const path = `${Date.now()}-${gpxFile.name}`;
      const { error: upErr } = await supabase.storage.from('gpx').upload(path, gpxFile);
      if (upErr) {
        setMessage(`GPX upload mislukt: ${upErr.message}`);
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('gpx').getPublicUrl(path);
      gpx_url = publicUrl;
    }

    const { error } = await supabase.from('rides').update({
      ...form,
      description: form.description || null,
      distance_km: form.distance_km || null,
      start_at: fromDatetimeLocal(form.start_at),
      gpx_url,
    }).eq('id', id);
    setSaving(false);
    setMessage(error ? `Fout: ${error.message}` : 'Opgeslagen.');
  }

  async function toggleAttendance(regId: string, current: boolean | null) {
    const next = current === true ? false : current === false ? null : true;
    await supabase.from('ride_registrations').update({ attended: next }).eq('id', regId);
    setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, attended: next } : r));
  }

  async function removeRegistration(regId: string) {
    await supabase.from('ride_registrations').delete().eq('id', regId);
    setRegistrations(prev => prev.filter(r => r.id !== regId));
  }

  async function addMember() {
    if (!addMemberId) return;
    const member = allMembers.find(m => m.id === addMemberId);
    if (!member) return;
    const { data, error } = await supabase
      .from('ride_registrations')
      .insert({ ride_id: id, user_id: addMemberId })
      .select('id, attended, user_id')
      .single();
    if (!error && data) {
      setRegistrations(prev => [...prev, {
        id: data.id,
        attended: data.attended,
        user_id: data.user_id,
        profile: { first_name: member.first_name, last_name: member.last_name, nickname: member.nickname },
      }]);
      setAddMemberId('');
    }
  }

  async function handleDelete() {
    await supabase.from('rides').delete().eq('id', id);
    router.push('/admin/ritten');
  }

  if (!ride || !form) return <div className="p-12 text-center text-ink-400">Laden…</div>;

  const displayName = (p: Registration['profile']) =>
    p.nickname || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Onbekend';

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{ride.title}</h1>
          <p className="text-sm text-ink-400 mt-1">{formatRideDate(ride.start_at)}</p>
        </div>
        <button
          onClick={() => router.push('/admin/ritten')}
          className="btn-secondary shrink-0"
        >
          ← Terug
        </button>
      </div>

      {/* Bewerken */}
      <section className="card p-6 space-y-4">
        <h2 className="font-semibold text-white text-lg">Rit bewerken</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Titel</label>
            <input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Type</label>
              <select className="input" value={form.ride_type} onChange={e => setForm({ ...form, ride_type: e.target.value as 'mtb' | 'gravel' | 'baanrit' })}>
                <option value="mtb">MTB</option>
                <option value="gravel">Gravel</option>
                <option value="baanrit">Training op de baan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-ink-200 mb-1.5">Datum & uur</label>
              <input required type="datetime-local" className="input" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Startlocatie</label>
            <input required className="input" value={form.start_location} onChange={e => setForm({ ...form, start_location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Afstand (km)</label>
            <input type="number" step="0.5" className="input w-32" value={form.distance_km ?? ''} onChange={e => setForm({ ...form, distance_km: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Omschrijving</label>
            <textarea className="input min-h-[80px]" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">GPX-bestand</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".gpx,application/gpx+xml"
                onChange={e => setGpxFile(e.target.files?.[0] ?? null)}
                className="text-sm text-ink-300"
              />
              {ride?.gpx_url && !gpxFile && (
                <a href={ride.gpx_url} download className="text-xs text-brand-400 hover:text-brand-300">
                  Huidig bestand downloaden
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2 border-t border-ink-800">
            <label className="flex items-center gap-2 text-sm text-ink-200 cursor-pointer">
              <input type="checkbox" checked={form.in_ranking} onChange={e => setForm({ ...form, in_ranking: e.target.checked, points: e.target.checked ? (form.points || 2) : 0 })} className="rounded border-ink-700 bg-ink-900 text-brand-700" />
              Telt voor klassement
            </label>
            {form.in_ranking && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-ink-200">Punten:</label>
                <input type="number" min="0" max="5" className="input w-20" value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-ink-200 cursor-pointer">
              <input type="checkbox" checked={form.registration_open} onChange={e => setForm({ ...form, registration_open: e.target.checked })} className="rounded border-ink-700 bg-ink-900 text-brand-700" />
              Inschrijvingen open
            </label>
            <label className="flex items-center gap-2 text-sm text-red-300 cursor-pointer">
              <input type="checkbox" checked={form.cancelled} onChange={e => setForm({ ...form, cancelled: e.target.checked })} className="rounded border-ink-700 bg-ink-900 text-red-700" />
              Afgelast
            </label>
          </div>
          <div className="flex items-center justify-between pt-2">
            {message && (
              <p className={message.startsWith('Fout') ? 'text-red-400 text-sm' : 'text-green-400 text-sm'}>
                {message}
              </p>
            )}
            <button type="submit" disabled={saving} className="btn-primary ml-auto">
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </section>

      {/* Inschrijvingen */}
      <section className="card p-6">
        <h2 className="font-semibold text-white text-lg mb-4">
          Inschrijvingen ({registrations.length})
        </h2>

        {registrations.length === 0 ? (
          <p className="text-ink-400 text-sm mb-4">Nog niemand ingeschreven.</p>
        ) : (
          <div className="divide-y divide-ink-800 mb-4">
            {registrations.map(reg => (
              <div key={reg.id} className="flex items-center justify-between py-3 gap-3">
                <span className="text-sm text-ink-200 min-w-0 truncate">{displayName(reg.profile)}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAttendance(reg.id, reg.attended)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                      reg.attended === true
                        ? 'bg-green-900/40 border-green-700 text-green-300'
                        : reg.attended === false
                        ? 'bg-red-900/40 border-red-800 text-red-300'
                        : 'bg-ink-800 border-ink-700 text-ink-400'
                    }`}
                  >
                    {reg.attended === true ? <><Check className="h-3 w-3" /> Aanwezig</> :
                     reg.attended === false ? <><X className="h-3 w-3" /> Afwezig</> :
                     'Niet gemarkeerd'}
                  </button>
                  <button
                    onClick={() => removeRegistration(reg.id)}
                    className="p-1.5 text-ink-600 hover:text-red-400 transition"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lid toevoegen */}
        <div className="border-t border-ink-800 pt-4">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Lid toevoegen</p>
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={addMemberId}
              onChange={e => setAddMemberId(e.target.value)}
            >
              <option value="">— Kies een lid —</option>
              {allMembers
                .filter(m => !registrations.some(r => r.user_id === m.id))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nickname || [m.first_name, m.last_name].filter(Boolean).join(' ')}
                  </option>
                ))}
            </select>
            <button
              onClick={addMember}
              disabled={!addMemberId}
              className="btn-secondary disabled:opacity-40 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Toevoegen
            </button>
          </div>
        </div>
      </section>

      {/* Verwijderen */}
      <section className="card p-6 border-red-900/40">
        <h2 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Rit verwijderen
        </h2>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn-secondary border-red-900/60 text-red-400 hover:bg-red-950/40">
            <Trash2 className="h-4 w-4" />
            Verwijderen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-300">Zeker? Alle inschrijvingen worden ook verwijderd.</p>
            <button onClick={handleDelete} className="btn-primary bg-red-700 hover:bg-red-600">Ja, verwijderen</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Annuleren</button>
          </div>
        )}
      </section>
    </div>
  );
}
