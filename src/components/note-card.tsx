import { Trash2 } from "lucide-react";
import { Button } from "./button";
import { formatDate } from "../utils/format-date";
import type { Note } from "../services/note-service";

type NoteCardProps = {
  note: Note;
  isSelected: boolean;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
};

export function NoteCard({ note, isSelected, onView, onDelete }: NoteCardProps) {
  return (
    <article
      className={`group relative cursor-pointer rounded-lg p-3 transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-100"}`}
      onClick={() => onView(note.id)}
    >
      <h3 className="line-clamp-1 font-semibold text-slate-800">{note.title || "Untitled"}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{note.body}</p>
      <p className="mt-2 text-xs text-slate-400">
        {formatDate(note.updatedAt ?? note.createdAt)}
      </p>
      <div className="absolute right-2 top-2">
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="invisible h-7 w-7 p-0 opacity-0 group-hover:visible group-hover:opacity-100">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
