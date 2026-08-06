'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Paperclip } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { MeetingReport } from '@/lib/types/database';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function VerslagForm({ report }: { report?: MeetingReport }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!report;

  const [title, setTitle] = useState(report?.title ?? '');
  const [meetingDate, setMeetingDate] = useState(report?.meeting_date ?? todayISO());
  const [attendees, setAttendees] = useState(report?.attendees ?? '');
  const [content, setContent] = useState(report?.content ?? '');
  const [published, setPublished] = useState(report?.published ?? true);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(report?.attachment_url ?? null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let attachment_url = attachmentUrl;
    if (pdfFile) {
      const path = `${Date.now()}-${pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('verslagen').upload(path, pdfFile, { upsert: true });
      if (upErr) {
        setError(`Bijlage uploaden mislukt: ${upErr.message}`);
        setSaving(false);
        return;
      }
      attachment_url = supabase.storage.from('verslagen').getPublicUrl(path).data.publicUrl;
    }

    const values = { title, meeting_date: meetingDate, attendees: attendees || null, content, published, attachment_url };

    if (isEdit) {
      const { error: err } = await supabase.from('meeting_reports').update(values).eq('id', report!.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: err } = await supabase.from('meeting_reports').insert({ ...values, created_by: user?.id ?? null });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    router.push('/admin/verslagen');
    router.refresh();
  }

  async function handleDelete() {
    if (!report) return;
    await supabase.from('meeting_reports').delete().eq('id', report.id);
    router.push('/admin/verslagen');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Titel</label>
            <input required className="input" value={title} placeholder="bv. Bestuursvergadering"
              onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-ink-200 mb-1.5">Vergaderdatum</label>
            <input required type="date" className="input" value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Aanwezigen</label>
          <textarea
            className="input min-h-[70px]"
            value={attendees}
            placeholder="bv. Jan, Piet, Marie, …"
            onChange={e => setAttendees(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Verslag</label>
          <RichTextEditor
            initialHtml={report?.content ?? ''}
            onChange={setContent}
            placeholder="Schrijf hier het verslag…"
          />
        </div>

        <div>
          <label className="block text-sm text-ink-200 mb-1.5">Bijlage (PDF, optioneel)</label>
          {attachmentUrl && !pdfFile && (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer"
              className="mb-2 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300">
              <Paperclip className="h-3.5 w-3.5" /> Huidige bijlage openen
            </a>
          )}
          <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-ink-300" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
            className="rounded border-ink-700 bg-ink-900 text-brand-700 focus:ring-brand-500 h-4 w-4" />
          <span className="text-sm text-ink-200">Gepubliceerd <span className="text-ink-500">(zichtbaar voor leden)</span></span>
        </label>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md p-3">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Annuleren</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Verslag aanmaken'}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="card p-6 border-red-900/40">
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
      )}
    </form>
  );
}
