import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Ritten beheren — Admin' };

const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const DAGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

interface Props {
  searchParams: Promise<{ maand?: string; jaar?: string }>;
}

export default async function AdminRittenPage({ searchParams }: Props) {
  const supabase = await createClient();
  const params = await searchParams;

  const now = new Date();
  const jaar = parseInt(params.jaar ?? String(now.getFullYear()));
  const maand = parseInt(params.maand ?? String(now.getMonth() + 1));

  const vanDatum = new Date(jaar, maand - 1, 1).toISOString();
  const totDatum = new Date(jaar, maand, 1).toISOString();

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .gte('start_at', vanDatum)
    .lt('start_at', totDatum)
    .order('start_at', { ascending: true });

  const vorigeDate = new Date(jaar, maand - 2, 1);
  const volgendeDate = new Date(jaar, maand, 1);
  const vorigeLink = `?maand=${vorigeDate.getMonth() + 1}&jaar=${vorigeDate.getFullYear()}`;
  const volgendeLink = `?maand=${volgendeDate.getMonth() + 1}&jaar=${volgendeDate.getFullYear()}`;

  // Kalender grid opbouwen
  const eerstedag = new Date(jaar, maand - 1, 1);
  const aantalDagen = new Date(jaar, maand, 0).getDate();
  // Ma=0 ... Zo=6
  const startOffset = (eerstedag.getDay() + 6) % 7;

  const ridesPerDag: Record<number, typeof rides> = {};
  for (const ride of rides ?? []) {
    const dag = new Date(ride.start_at).getDate();
    if (!ridesPerDag[dag]) ridesPerDag[dag] = [];
    ridesPerDag[dag]!.push(ride);
  }

  const vandaag = new Date();
  const isHuidigeMaand = vandaag.getFullYear() === jaar && vandaag.getMonth() + 1 === maand;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Ritten</h1>
          <p className="text-sm text-ink-400 mt-1">Beheer komende en voorbije ritten.</p>
        </div>
        <Link href="/admin/ritten/nieuw" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe rit
        </Link>
      </div>

      {/* Maandnavigatie */}
      <div className="flex items-center justify-between mb-4 card px-5 py-3">
        <Link href={vorigeLink} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 hover:text-white transition">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-lg font-semibold text-white">{MAANDEN[maand - 1]} {jaar}</h2>
        <Link href={volgendeLink} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 hover:text-white transition">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Kalender grid */}
      <div className="card overflow-hidden">
        {/* Dag headers */}
        <div className="grid grid-cols-7 border-b border-ink-800">
          {DAGEN.map(dag => (
            <div key={dag} className="py-2 text-center text-xs font-medium text-ink-500 uppercase tracking-wide">
              {dag}
            </div>
          ))}
        </div>

        {/* Dagen */}
        <div className="grid grid-cols-7">
          {/* Lege cellen voor offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[130px] border-b border-r border-ink-800/50 bg-ink-950/30" />
          ))}

          {/* Dagen van de maand */}
          {Array.from({ length: aantalDagen }).map((_, i) => {
            const dag = i + 1;
            const isVandaag = isHuidigeMaand && dag === vandaag.getDate();
            const dagRides = ridesPerDag[dag] ?? [];
            const kolom = (startOffset + i) % 7;
            const isLaatsteKolom = kolom === 6;

            return (
              <div
                key={dag}
                className={`min-h-[130px] border-b border-ink-800/50 p-1.5 ${!isLaatsteKolom ? 'border-r' : ''}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isVandaag ? 'bg-brand-600 text-white' : 'text-ink-400'
                }`}>
                  {dag}
                </div>
                <div className="space-y-1">
                  {dagRides.map(ride => (
                    <Link
                      key={ride.id}
                      href={`/admin/ritten/${ride.id}`}
                      className={`block text-sm leading-tight px-2 py-1.5 rounded truncate transition hover:opacity-80 ${
                        ride.cancelled
                          ? 'bg-red-900/40 text-red-300'
                          : ride.ride_type === 'mtb'
                          ? 'bg-brand-900/60 text-brand-200'
                          : 'bg-ink-800 text-ink-200'
                      }`}
                      title={ride.title}
                    >
                      {ride.cancelled ? (
                        <>
                          <span className="line-through">{ride.title}</span>
                          <span className="ml-1 text-[10px] font-bold not-italic">Afgelast!</span>
                        </>
                      ) : ride.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!(rides ?? []).length && (
        <p className="text-center text-ink-400 mt-8 text-sm">Geen ritten in {MAANDEN[maand - 1]} {jaar}.</p>
      )}
    </div>
  );
}
