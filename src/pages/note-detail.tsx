import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { formatDate } from "../utils/format-date";
import { useNotes } from "../hooks/use-notes";

type NoteDetailProps = {
  noteId: number;
  onClose: () => void;
};

export function NoteDetail({ noteId, onClose }: NoteDetailProps) {
  const { selectedNote, fetchNoteById, updateNote, loading } = useNotes();
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
    <section className="relative h-full w-full bg-white p-6 md:p-12">
      {selectedNote && selectedNote.id === noteId ? (
        <div className="mx-auto max-w-3xl">
          <input
            className="w-full bg-transparent text-4xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
          />

          <p className="mt-4 text-sm text-slate-500">
            Last update: {formatDate(selectedNote.updatedAt ?? selectedNote.createdAt)}
          </p>

          <textarea
            className="mt-8 min-h-48 w-full resize-none bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start writing here..."
          />

          <div className="mt-8 flex items-center justify-between">
            <Button onClick={handleUpdate} disabled={loading || !title.trim() || !body.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">Loading note...</p>
      )}
    </section>
  );
}
