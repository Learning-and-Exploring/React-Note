import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";

type SaveStatus = "idle" | "saving" | "saved";

type NotionEditorProps = {
    note: Note;
    onUpdate: (id: number, payload: { title?: string; body?: string }) => Promise<void>;
};

export function NotionEditor({ note, onUpdate }: NotionEditorProps) {
    const [title, setTitle] = useState(note.title);
    const [body, setBody] = useState(note.body);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync when note changes
    useEffect(() => {
        setTitle(note.title);
        setBody(note.body);
        setSaveStatus("idle");
    }, [note.id]);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [body]);

    const scheduleSave = useCallback(
        (nextTitle: string, nextBody: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setSaveStatus("saving");
            debounceRef.current = setTimeout(async () => {
                await onUpdate(note.id, { title: nextTitle, body: nextBody });
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            }, 1000);
        },
        [note.id, onUpdate]
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        scheduleSave(e.target.value, body);
    };

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value);
        scheduleSave(title, e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Save status */}
            <div className="flex items-center justify-end px-4 pt-4 sm:px-8">
                {saveStatus === "saving" && (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                    </span>
                )}
                {saveStatus === "saved" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <Check className="w-3 h-3" />
                        Saved
                    </span>
                )}
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
                <div className="mx-auto rounded-3xl bg-white/85 px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:px-8 sm:py-8 dark:bg-zinc-900/80 dark:ring-white/10">
                    {/* Title */}
                    <input
                        className={cn(
                            "w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-300 dark:placeholder:text-zinc-600",
                            "outline-none border-none resize-none leading-tight mb-4",
                            "caret-zinc-900 dark:caret-zinc-100"
                        )}
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        spellCheck={false}
                    />

                    {/* Divider hint */}
                    <div className="flex items-center gap-3 mb-6 group">
                        <div className="h-px flex-1 bg-zinc-100 group-hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:group-hover:bg-zinc-700" />
                    </div>

                    {/* Body */}
                    <textarea
                        ref={textareaRef}
                        className={cn(
                            "w-full bg-transparent text-base text-zinc-700 dark:text-zinc-300",
                            "placeholder:text-zinc-300 dark:placeholder:text-zinc-600",
                            "outline-none border-none resize-none leading-relaxed",
                            "caret-zinc-700 dark:caret-zinc-300",
                            "min-h-[55vh]"
                        )}
                        value={body}
                        onChange={handleBodyChange}
                        placeholder="Start writing, or press '/' for commands..."
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
