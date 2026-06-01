'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PHASE_LABELS, OPPONENT_FLAGS } from '@/lib/wk2026/points';
import type { WK2026Match, WK2026Phase } from '@/lib/wk2026/types';
import { formatMatchDateTime } from '@/lib/utils';
import { Save, Plus, Power, Trash2 } from 'lucide-react';

const PHASES: WK2026Phase[] = ['groep', 'achtste', 'kwart', 'halve', 'finale'];

const EMPTY_FORM = {
  phase: 'achtste' as WK2026Phase,
  opponent: '',
  is_belgium_home: true,
  start_at: '',
  location: '',
};

export default function AdminWK2026Page() {
  const supabase = createClient();
  const [active, setActive] = useState(false);
  const [matches, setMatches] = useState<WK2026Match[]>([]);
  const [scores, setScores] = useState<Record<string, { belgium: string; opponent: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatch, setNewMatch] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [{ data: settings }, { data: matchData }] = await Promise.all([
      supabase.from('wk2026_settings').select('active').single(),
      supabase.from('wk2026_matches').select('*').order('start_at', { ascending: true }),
    ]);
    setActive(settings?.active ?? false);
    const m = matchData ?? [];
    setMatches(m);
    const initial: Record<string, { belgium: string; opponent: string }> = {};
    for (const match of m) {
      initial[match.id] = {
        belgium: match.belgium_score?.toString() ?? '',
        opponent: match.opponent_score?.toString() ?? '',
      };
    }
    setScores(initial);
  }

  async function toggleActive() {
    const next = !active;
    await supabase.from('wk2026_settings').update({ active: next }).eq('id', true);
    setActive(next);
    flash(next ? 'Module geactiveerd.' : 'Module uitgeschakeld.', true);
  }

  async function saveScore(match: WK2026Match) {
    setSaving(match.id);
    const s = scores[match.id];
    const belgium = s.belgium === '' ? null : parseInt(s.belgium);
    const opponent = s.opponent === '' ? null : parseInt(s.opponent);
    const { error } = await supabase
      .from('wk2026_matches')
      .update({ belgium_score: belgium, opponent_score: opponent })
      .eq('id', match.id);
    setSaving(null);
    if (error) flash('Fout: ' + error.message, false);
    else flash('Score opgeslagen.', true);
  }

  async function deleteMatch(id: string) {
    if (!confirm('Wedstrijd verwijderen? Alle voorspellingen worden ook verwijderd.')) return;
    await supabase.from('wk2026_matches').delete().eq('id', id);
    setMatches(prev => prev.filter(m => m.id !== id));
    flash('Wedstrijd verwijderd.', true);
  }

  async function addMatch() {
    if (!newMatch.opponent || !newMatch.start_at) return;
    setAdding(true);
    const { error } = await supabase.from('wk2026_matches').insert({
      phase: newMatch.phase,
      opponent: newMatch.opponent,
      is_belgium_home: newMatch.is_belgium_home,
      start_at: new Date(newMatch.start_at).toISOString(),
      location: newMatch.location || null,
    });
    setAdding(false);
    if (error) { flash('Fout: ' + error.message, false); return; }
    setNewMatch(EMPTY_FORM);
    setShowAddForm(false);
    flash('Wedstrijd toegevoegd.', true);
    load();
  }

  function flash(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">WK 2026 beheer</h1>
          <p className="text-ink-400 text-sm mt-1">Scores ingeven, module aan/afzetten, wedstrijden toevoegen.</p>
        </div>
        <button
          onClick={toggleActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            active
              ? 'bg-green-900/40 border border-green-700 text-green-300 hover:bg-green-900/60'
              : 'bg-ink-800 border border-ink-700 text-ink-400 hover:bg-ink-700'
          }`}
        >
          <Power className="h-4 w-4" />
          {active ? 'Module actief' : 'Module inactief'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${message.ok ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Matches */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Wedstrijden</h2>
        <div className="space-y-3">
          {matches.map(match => {
            const flag = OPPONENT_FLAGS[match.opponent] ?? '🏳️';
            const dateStr = formatMatchDateTime(match.start_at);
            const s = scores[match.id] ?? { belgium: '', opponent: '' };
            const title = match.is_belgium_home
              ? `🇧🇪 België — ${flag} ${match.opponent}`
              : `${flag} ${match.opponent} — 🇧🇪 België`;

            return (
              <div key={match.id} className="card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: '#D32011', color: '#fff' }}>
                      {PHASE_LABELS[match.phase]}
                    </span>
                    <p className="text-white font-medium mt-1.5">{title}</p>
                    <p className="text-ink-400 text-xs mt-0.5">
                      {dateStr}{match.location && ` • ${match.location}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="input w-14 text-center text-sm"
                        placeholder="–"
                        value={s.belgium}
                        onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, belgium: e.target.value } }))}
                      />
                      <span className="text-ink-500">–</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="input w-14 text-center text-sm"
                        placeholder="–"
                        value={s.opponent}
                        onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, opponent: e.target.value } }))}
                      />
                    </div>
                    <button
                      onClick={() => saveScore(match)}
                      disabled={saving === match.id}
                      className="btn-secondary text-sm flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving === match.id ? 'Opslaan…' : 'Score opslaan'}
                    </button>
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="p-2 text-ink-600 hover:text-red-400 transition"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add match */}
      <section>
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Wedstrijd toevoegen
          </button>
        ) : (
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-white">Nieuwe wedstrijd</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-ink-300 mb-1">Fase</label>
                <select
                  className="input"
                  value={newMatch.phase}
                  onChange={e => setNewMatch(p => ({ ...p, phase: e.target.value as WK2026Phase }))}
                >
                  {PHASES.filter(p => p !== 'groep').map(p => (
                    <option key={p} value={p}>{PHASE_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-ink-300 mb-1">Tegenstander</label>
                <input
                  className="input"
                  placeholder="bv. Spanje"
                  value={newMatch.opponent}
                  onChange={e => setNewMatch(p => ({ ...p, opponent: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-ink-300 mb-1">Aanvangstijd (lokaal)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={newMatch.start_at}
                  onChange={e => setNewMatch(p => ({ ...p, start_at: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-ink-300 mb-1">Locatie</label>
                <input
                  className="input"
                  placeholder="bv. New York"
                  value={newMatch.location}
                  onChange={e => setNewMatch(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-ink-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMatch.is_belgium_home}
                  onChange={e => setNewMatch(p => ({ ...p, is_belgium_home: e.target.checked }))}
                  className="rounded border-ink-700 bg-ink-900"
                />
                België staat links (thuisploeg positie)
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={addMatch} disabled={adding} className="btn-primary">
                {adding ? 'Toevoegen…' : 'Toevoegen'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary">Annuleren</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
