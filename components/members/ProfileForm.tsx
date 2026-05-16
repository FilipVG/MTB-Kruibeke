'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils';
import { AvatarCropper } from './AvatarCropper';
import type { Profile } from '@/lib/types/database';

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    nickname: profile.nickname ?? '',
    bio: profile.bio ?? '',
    phone: profile.phone ?? '',
    birthdate: profile.birthdate ?? '',
    email_reminders: profile.email_reminders ?? true,
  });
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleCropDone(blob: Blob) {
    setCropSrc(null);
    setSaving(true);
    setMessage(null);
    const path = `${profile.id}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) {
      setMessage(`Upload mislukt: ${error.message}`);
      setSaving(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const cacheBusted = `${publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: cacheBusted }).eq('id', profile.id);
    setAvatarPreview(cacheBusted);
    setSaving(false);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        ...form,
        birthdate: form.birthdate || null,
      })
      .eq('id', profile.id);
    if (error) {
      setMessage(`Opslaan mislukt: ${error.message}`);
    } else {
      router.push('/leden');
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <>
    {cropSrc && (
      <AvatarCropper
        imageSrc={cropSrc}
        onCrop={handleCropDone}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="card p-6">
        <label className="block text-sm font-medium text-ink-200 mb-3">Profielfoto</label>
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-700 flex items-center justify-center text-xl font-medium text-white">
              {getInitials(profile)}
            </div>
          )}
          <label className="btn-secondary cursor-pointer">
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            Foto kiezen
          </label>
        </div>
      </div>

      {/* Personalia */}
      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-white">Personalia</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Voornaam</label>
            <input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Achternaam</label>
            <input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Roepnaam</label>
            <input className="input" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="Bijnaam onder de bikers" />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Telefoon</label>
            <input type="tel" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Geboortedatum</label>
            <input type="date" className="input" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Voorkeuren */}
      <div className="card p-6">
        <h2 className="font-medium text-white mb-4">Voorkeuren</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.email_reminders}
            onChange={e => setForm({ ...form, email_reminders: e.target.checked })}
            className="rounded border-ink-700 bg-ink-900 text-brand-700 focus:ring-brand-500 h-4 w-4"
          />
          <div>
            <p className="text-sm text-ink-200">Stuur rituitnodiging</p>
            <p className="text-xs text-ink-500">Ontvang een e-mail vóór elke rit om je in te schrijven.</p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        {message && (
          <p className={message.includes('mislukt') ? 'text-red-400 text-sm' : 'text-green-400 text-sm'}>
            {message}
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-primary ml-auto">
          {saving ? 'Opslaan…' : 'Wijzigingen opslaan'}
        </button>
      </div>
    </form>
    </>
  );
}
