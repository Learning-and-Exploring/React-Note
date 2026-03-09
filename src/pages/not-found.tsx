export function NotFound() {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No note selected</h2>
      <p className="mt-2 text-sm text-slate-600">Choose a note to view and edit details.</p>
    </section>
  );
}
