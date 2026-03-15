import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-[#f2f2f7] p-6 dark:bg-zinc-950">
      <div className="max-w-md text-center rounded-3xl bg-white/90 p-10 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
        
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-white/10">
          <FileText className="h-8 w-8 text-slate-300 dark:text-slate-500" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Page not found
        </h1>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Go back home
        </Link>

      </div>
    </section>
  );
}