import { FileText } from "lucide-react";

export function NotFound() {
  return (
    <section className="flex h-full w-full items-center justify-center bg-[#f2f2f7] p-6 text-center dark:bg-zinc-950">
      <div className="rounded-3xl bg-white/85 p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/70 shadow-sm dark:bg-white/10">
          <FileText className="h-7 w-7 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Select a note
        </h2>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Choose a note from the list on the left, or create a new one to get started.
        </p>
      </div>
    </section>
  );
}
