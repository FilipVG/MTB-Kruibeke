'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateImageFile } from '@/lib/utils';
import { CardCropper } from './CardCropper';

interface Props {
  profileId: string;
  hasCard: boolean;
}

export function VwbCardUpload({ profileId, hasCard }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [cardCropSrc, setCardCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(hasCard);
  const [message, setMessage] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setMessage(err); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => setCardCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleCropDone(blob: Blob) {
    setCardCropSrc(null);
    setUploading(true);
    setMessage(null);
    const path = `${profileId}/vwb-card.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) { setMessage(`Upload mislukt: ${error.message}`); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ vwb_card_url: `${publicUrl}?t=${Date.now()}` }).eq('id', profileId);
    setUploaded(true);
    setUploading(false);
    setMessage('Lidkaart opgeslagen.');
    router.refresh();
  }

  async function removeCard() {
    await supabase.from('profiles').update({ vwb_card_url: null }).eq('id', profileId);
    await supabase.storage.from('avatars').remove([`${profileId}/vwb-card.jpg`]);
    setUploaded(false);
    setMessage(null);
    router.refresh();
  }

  return (
    <>
      {cardCropSrc && (
        <CardCropper imageSrc={cardCropSrc} onCrop={handleCropDone} onCancel={() => setCardCropSrc(null)} />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="btn-secondary cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
          {uploading ? 'Uploaden…' : uploaded ? 'Lidkaart vervangen' : 'Lidkaart uploaden'}
        </label>
        {uploaded && (
          <button type="button" onClick={removeCard} className="btn-secondary text-red-400 hover:text-red-300">
            Verwijderen
          </button>
        )}
        {message && <p className="text-sm text-green-400">{message}</p>}
      </div>
    </>
  );
}
