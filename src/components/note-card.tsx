import { Button } from "./button";
import { formatDate } from "../utils/format-date";
import type { Note } from "../services/note-service";

type NoteCardProps = {
  note: Note;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
};

export function NoteCard({ note, onView, onDelete }: NoteCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{note.title}</h3>
        <span className="text-xs text-slate-500">#{note.id}</span>
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-slate-700">{note.body}</p>

      <p className="mb-4 text-xs text-slate-500">
        Updated: {formatDate(note.updatedAt ?? note.createdAt)}
      </p>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => onView(note.id)}>
          View / Edit
        </Button>

        <Button size="sm" variant="danger" onClick={() => onDelete(note.id)}>
          Delete
        </Button>
      </div>
    </article>
  );
}
