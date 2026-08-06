import { VerslagForm } from '../VerslagForm';

export const metadata = { title: 'Nieuw verslag — Admin' };

export default function NieuwVerslagPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Nieuw verslag</h1>
      <VerslagForm />
    </div>
  );
}
