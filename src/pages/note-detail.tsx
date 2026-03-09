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
    <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Note Detail</h2>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {selectedNote && selectedNote.id === noteId ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Last update: {formatDate(selectedNote.updatedAt ?? selectedNote.createdAt)}
          </p>

          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <textarea
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
          />

          <Button onClick={handleUpdate} disabled={loading || !title.trim() || !body.trim()}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Loading note detail...</p>
      )}
    </section>
  );
}
