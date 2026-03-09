import { useMemo, useState } from "react";
import { Button } from "../components/button";
import { NoteCard } from "../components/note-card";
import { useNotes } from "../hooks/use-notes";
import { NoteDetail } from "./note-detail";
import { NotFound } from "./not-found";

export function Home() {
  const {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    clearSelection,
    logout,
  } = useNotes();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const canCreate = useMemo(
    () => Boolean(title.trim() && body.trim() && !loading),
    [title, body, loading]
  );

  const handleCreate = async () => {
    await createNote({ title: title.trim(), body: body.trim() });
    setTitle("");
    setBody("");
  };

  const handleOpenNote = (id: number) => {
    setActiveId(id);
  };

  const handleCloseDetail = () => {
    setActiveId(null);
    clearSelection();
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 p-4 md:grid-cols-[1fr_1fr] md:p-8">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notes Frontend</h1>
            <p className="mt-1 text-sm text-slate-600">Connected to your custom API endpoints.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </header>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Create Note</h2>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Write your note"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => void handleCreate()} disabled={!canCreate}>
              {loading ? "Working..." : "Create Note"}
            </Button>
            <Button size="md" variant="secondary" onClick={() => void fetchNotes()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
      </section>

      <section className="space-y-4">
        {activeId ? <NoteDetail noteId={activeId} onClose={handleCloseDetail} /> : <NotFound />}

        <div className="grid gap-3">
          {notes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              No notes loaded yet.
            </p>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onView={handleOpenNote}
                onDelete={(id) => void deleteNote(id)}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
