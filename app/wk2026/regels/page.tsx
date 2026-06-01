import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PHASE_LABELS, PHASE_POINTS } from '@/lib/wk2026/points';
import type { WK2026Phase } from '@/lib/wk2026/types';

export const metadata = { title: 'WK 2026 Spelregels — MTB Kruibeke' };

const phases: WK2026Phase[] = ['groep', 'achtste', 'kwart', 'halve', 'finale'];

export default function WK2026RegelsPage() {
  return (
    <div className="min-h-screen bg-ink-950">
      <div style={{ background: 'linear-gradient(135deg, #0a0000 0%, #1f0000 50%, #3d0808 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <Link href="/wk2026" className="inline-flex items-center gap-1 text-sm text-red-200/60 hover:text-white mb-4 transition">
            <ArrowLeft className="h-4 w-4" />
            Terug naar pronostiek
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🇧🇪</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F0BC00' }}>FIFA World Cup 2026</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Spelregels & puntenverdeling</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-10">

        {/* Hoe werkt het */}
        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Hoe werkt het?</h2>
          <ul className="space-y-3 text-ink-300">
            <li className="flex gap-3">
              <span className="text-xl shrink-0">⚽</span>
              <span>Geef voor elke wedstrijd van de Rode Duivels jouw <strong className="text-white">verwachte score</strong> in. Het resultaat (winst/gelijkspel/verlies) wordt daar automatisch uit afgeleid.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl shrink-0">⏱️</span>
              <span>Je kunt je voorspelling <strong className="text-white">aanpassen tot aan de aftrap</strong>. Daarna is ze vergrendeld.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl shrink-0">🔒</span>
              <span>Elkaars voorspellingen zijn pas zichtbaar <strong className="text-white">na de aftrap</strong> van de wedstrijd.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-xl shrink-0">🏆</span>
              <span>De Rode Duivels volgen enkel de knock-outfase als ze <strong className="text-white">niet uitgeschakeld worden</strong>. Als de Duivels eruit liggen, stopt het pronostiek.</span>
            </li>
          </ul>
        </section>

        {/* Puntenverdeling */}
        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Puntenverdeling</h2>
          <p className="text-ink-400 text-sm">Punten stijgen naarmate de ronde zwaarder weegt.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-ink-400 text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 font-medium">Fase</th>
                  <th className="text-center pb-3 font-medium">Juist resultaat</th>
                  <th className="text-center pb-3 font-medium">Juiste score</th>
                  <th className="text-center pb-3 font-medium">Met joker (resultaat)</th>
                  <th className="text-center pb-3 font-medium">Met joker (score)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {phases.map(phase => {
                  const pts = PHASE_POINTS[phase];
                  return (
                    <tr key={phase} className="text-ink-200">
                      <td className="py-3 font-medium text-white">{PHASE_LABELS[phase]}</td>
                      <td className="py-3 text-center">{pts.result} pt</td>
                      <td className="py-3 text-center">{pts.score} pt</td>
                      <td className="py-3 text-center" style={{ color: '#F0BC00' }}>{pts.result * 2} pt</td>
                      <td className="py-3 text-center" style={{ color: '#F0BC00' }}>{pts.score * 2} pt</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-500">
            Juiste score geeft altijd meer punten dan enkel juist resultaat. Bij een juiste score krijg je automatisch ook het juiste resultaat meegenomen (één bedrag, niet opgeteld).
          </p>
        </section>

        {/* Joker */}
        <section className="card p-6 space-y-4" style={{ borderColor: '#3d2e00' }}>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🃏 De Joker
          </h2>
          <ul className="space-y-3 text-ink-300">
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: '#F0BC00' }}>→</span>
              <span>Je kunt <strong className="text-white">één keer</strong> tijdens het hele toernooi je joker inzetten op één wedstrijd.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: '#F0BC00' }}>→</span>
              <span>De joker <strong className="text-white">verdubbelt je punten</strong> voor die wedstrijd. Zowel de punten voor juist resultaat als voor juiste score worden verdubbeld.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: '#F0BC00' }}>→</span>
              <span><strong className="text-white">0 punten blijft 0</strong>: een verkeerde voorspelling met joker levert nog steeds 0 pt op.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: '#F0BC00' }}>→</span>
              <span>Je kunt je joker <strong className="text-white">verplaatsen</strong> zolang de wedstrijd nog niet gestart is. Eens de wedstrijd van start gaat, is je joker vergrendeld.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: '#F0BC00' }}>→</span>
              <span>Heb je je joker nog niet ingezet en de Rode Duivels raken niet verder: <strong className="text-white">pech</strong>, de joker vervalt.</span>
            </li>
          </ul>

          <div className="rounded-lg p-4 text-sm space-y-1" style={{ background: '#1a1200', border: '1px solid #3d2e00' }}>
            <p className="font-semibold text-white">Voorbeeld — Groepsfase met joker (juiste score):</p>
            <p className="text-ink-400">Voorspelling: 2–1 | Uitslag: 2–1 | Juiste score = 5 pt | Met joker = <strong style={{ color: '#F0BC00' }}>10 pt</strong></p>
            <p className="font-semibold text-white mt-2">Voorbeeld — Groepsfase met joker (juist resultaat, foute score):</p>
            <p className="text-ink-400">Voorspelling: 2–0 | Uitslag: 1–0 | Juist resultaat = 3 pt | Met joker = <strong style={{ color: '#F0BC00' }}>6 pt</strong></p>
            <p className="font-semibold text-white mt-2">Voorbeeld — Groepsfase met joker (fout):</p>
            <p className="text-ink-400">Voorspelling: 0–1 | Uitslag: 2–0 | 0 pt | Met joker = <strong style={{ color: '#F0BC00' }}>0 pt</strong></p>
          </div>
        </section>

        {/* Klassement */}
        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-bold text-white">Klassement</h2>
          <p className="text-ink-300">Het klassement is altijd zichtbaar en toont de totaalpunten van elk lid. Klik op een lid om de volledige puntopbouw te zien — per wedstrijd zie je de voorspelling, de echte uitslag, en hoeveel punten het opleverde.</p>
          <p className="text-ink-300">De joker wordt duidelijk aangegeven in het klassement: bij welke wedstrijd hij ingezet werd en of hij al vergrendeld is.</p>
        </section>

      </div>
    </div>
  );
}
