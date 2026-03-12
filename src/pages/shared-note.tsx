import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/button";
import { noteService, type Note } from "@/services/note-service";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/lib/utils";

type SharedNotePageProps = {
  shareToken?: string;
};

type LoadState = "idle" | "loading" | "error" | "ready";

export function SharedNotePage({ shareToken }: SharedNotePageProps) {
  const params = useParams<{ token: string }>();
  const token = shareToken ?? params.token ?? "";
  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const appHome = useMemo(() => {
    const base =
      typeof import.meta !== "undefined" && typeof import.meta.env?.BASE_URL === "string"
        ? import.meta.env.BASE_URL
        : "/";

    if (!base) return "/";
    return base.endsWith("/") ? base : `${base}/`;
  }, []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError(null);

    if (!token) {
      setError("Share link is missing or invalid.");
      setStatus("error");
      return () => {
        active = false;
      };
    }

    noteService
      .getSharedByToken(token)
      .then((data) => {
        if (!active) return;
        setNote(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to load note";
        setError(message);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  const lastUpdatedLabel = useMemo(
    () => formatDate(note?.updatedAt ?? note?.createdAt),
    [note?.updatedAt, note?.createdAt],
  );

  const handleOpenApp = () => {
    window.location.href = appHome;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef1f6] via-white to-[#f5f5f7] text-slate-900 dark:from-[#0f1115] dark:via-[#0b0d11] dark:to-[#08090d]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col gap-3 rounded-3xl bg-white/85 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900/85 dark:ring-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
              <img
                src="/logo.png"
                alt="Note logo"
                className="h-8 w-8 object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Shared view</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">View-only note</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleOpenApp}>
              Open app
            </Button>
          </div>
        </header>

        <main className="mt-6">
          {status === "loading" && (
            <div className="rounded-3xl bg-white/80 p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading note…</span>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-3xl bg-white/80 p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
              <p className="text-sm text-red-500">{error ?? "We could not find this note."}</p>
            </div>
          )}

          {status === "ready" && note && (
            <article className="rounded-3xl bg-white/85 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-8 dark:bg-zinc-900/80 dark:ring-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                  {note.title || "Untitled"}
                </h1>
                <div className="flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  View only
                </div>
              </div>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Last updated {lastUpdatedLabel}
              </p>

              <div
                className={cn(
                  "notion-richtext mt-6 text-base leading-relaxed text-slate-700 dark:text-slate-200",
                  "[&_img]:max-w-full [&_img]:rounded-2xl",
                  "[&_code]:bg-slate-100/80 dark:[&_code]:bg-zinc-800/60"
                )}
                dangerouslySetInnerHTML={{
                  __html: note.body?.trim()
                    ? note.body
                    : "<p>This note is empty.</p>",
                }}
              />
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
