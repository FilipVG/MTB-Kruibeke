'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function VerslagDelete({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from('meeting_reports').delete().eq('id', reportId);
    router.push('/admin/verslagen');
    router.refresh();
  }

  return (
    <div className="card p-6 border-red-900/40 mt-6">
      <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-red-400" /> Verslag verwijderen
      </h2>
      {!confirmDelete ? (
        <button type="button" onClick={() => setConfirmDelete(true)}
          className="btn-secondary border-red-900/60 text-red-400 hover:bg-red-950/40">
          <Trash2 className="h-4 w-4" /> Verwijderen
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-red-300">Zeker?</p>
          <button type="button" onClick={handleDelete} className="btn-primary bg-red-700 hover:bg-red-600">Ja, verwijderen</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn-secondary">Annuleren</button>
        </div>
      )}
    </div>
  );
}
