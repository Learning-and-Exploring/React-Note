import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Save, X } from "lucide-react";
import { formatDate } from "../utils/format-date";
import { useNotes } from "../hooks/use-notes";

type NoteDetailProps = {
  noteId: number;
  onClose: () => void;
};

export function NoteDetail({ noteId, onClose }: NoteDetailProps) {
  const { selectedNote, fetchNoteById, updateNote, loading, error } = useNotes();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    void fetchNoteById(noteId);
  }, [noteId, fetchNoteById]);

  useEffect(() => {
    if (!selectedNote || selectedNote.id !== noteId) return;

    setTitle(selectedNote.title);
    setBody(selectedNote.body);
  }, [selectedNote, noteId]);

  const handleUpdate = async () => {
    await updateNote(noteId, { title, body });
  };

  return (
    <section className="relative flex h-full w-full flex-col bg-[#f2f2f7] dark:bg-zinc-950">
      <header className="mx-4 mt-4 flex flex-shrink-0 items-center justify-end gap-2 rounded-2xl bg-white/80 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
        <Button onClick={handleUpdate} disabled={loading || !title.trim()}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto px-4 pb-10 pt-6 sm:px-8">
        {loading && !selectedNote ? (
          <p className="text-center text-sm text-slate-500">Loading note...</p>
        ) : selectedNote && selectedNote.id === noteId ? (
          <div className="mx-auto max-w-3xl rounded-3xl bg-white/85 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-8 dark:bg-zinc-900/80 dark:ring-white/10">
            <input
              className="w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
            />

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Last update: {formatDate(selectedNote.updatedAt ?? selectedNote.createdAt)}
            </p>

            <textarea
              className="mt-6 min-h-[50vh] w-full resize-none bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 leading-relaxed dark:text-slate-300 dark:placeholder:text-slate-500"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing here..."
            />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-500">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
