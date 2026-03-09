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
    <section className="relative flex h-full w-full flex-col bg-white">
      <header className="flex flex-shrink-0 items-center justify-end gap-2 border-b p-3">
        <Button onClick={handleUpdate} disabled={loading || !title.trim()}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto p-6 md:p-12">
        {loading && !selectedNote ? (
          <p className="text-center text-sm text-slate-500">Loading note...</p>
        ) : selectedNote && selectedNote.id === noteId ? (
          <div className="mx-auto max-w-3xl">
            <input
              className="w-full bg-transparent text-4xl font-bold text-slate-900 outline-none placeholder:text-slate-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
            />

            <p className="mt-4 text-sm text-slate-500">
              Last update: {formatDate(selectedNote.updatedAt ?? selectedNote.createdAt)}
            </p>

            <textarea
              className="mt-8 min-h-[50vh] w-full resize-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
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
