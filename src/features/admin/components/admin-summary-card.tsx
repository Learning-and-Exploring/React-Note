type AdminSummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function AdminSummaryCard({
  label,
  value,
  helper,
}: AdminSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}
