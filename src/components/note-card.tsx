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
      className={`group relative cursor-pointer rounded-2xl p-4 shadow-sm transition-all ${
        isSelected
          ? "bg-white/90 ring-2 ring-blue-500/20 dark:bg-zinc-900/80 dark:ring-blue-400/20"
          : "bg-white/70 hover:bg-white/90 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80"
      }`}
      onClick={() => onView(note.id)}
    >
      <h3 className="line-clamp-1 font-semibold tracking-tight text-slate-800 dark:text-slate-100">
        {note.title || "Untitled"}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{note.body}</p>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {formatDate(note.updatedAt ?? note.createdAt)}
      </p>
      <div className="absolute right-2 top-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="invisible h-7 w-7 p-0 opacity-0 group-hover:visible group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
