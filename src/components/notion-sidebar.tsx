import {
    Home,
    FileText,
    Star,
    Plus,
    ChevronLeft,
    StickyNote,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";

export type NavSection = "home" | "notes" | "favorites";

type NotionSidebarProps = {
    notes: Note[];
    activeNoteId: number | null;
    activeSection: NavSection;
    isOpen: boolean;
    onToggle: () => void;
    onSelectNote: (id: number) => void;
    onSelectSection: (section: NavSection) => void;
    onNewPage: () => void;
    onLogout?: () => void;
    workspaceName: string;
};

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "favorites", label: "Favorites", icon: Star },
];

export function NotionSidebar({
    notes,
    activeNoteId,
    activeSection,
    isOpen,
    onToggle,
    onSelectNote,
    onSelectSection,
    onNewPage,
    onLogout,
    workspaceName,
}: NotionSidebarProps) {
    return (
        <>
            {/* Sidebar panel */}
            <aside
                className={cn(
                    "flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 py-4",
                    isOpen ? "w-[22rem] " : "w-0 p-0"
                )}
            >
                <div className="flex flex-col h-full min-w-[22rem] rounded-3xl bg-white/80 ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
                    {/* Workspace header */}
                    <div className="flex items-center justify-between px-4 py-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 dark:bg-zinc-100">
                                <StickyNote className="w-4 h-4 text-white dark:text-zinc-900" />
                            </div>
                            <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate dark:text-zinc-100">
                                {workspaceName}
                            </span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-full bg-white/70 text-zinc-500 shadow-sm hover:text-zinc-900 transition-colors dark:bg-white/10 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <Separator className="bg-zinc-200/70 dark:bg-white/10" />

                    {/* Navigation */}
                    <nav className="px-4 py-3 space-y-1.5">
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => onSelectSection(id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[0.95rem] text-left transition-all",
                                    activeSection === id && !activeNoteId
                                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-100"
                                        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                                )}
                            >
                                <Icon className="w-[1.05rem] h-[1.05rem] shrink-0" />
                                {label}
                            </button>
                        ))}
                    </nav>

                    <Separator className="mx-4 bg-zinc-200/70 dark:bg-white/10" />

                    {/* Notes list label */}
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-[0.7rem] font-semibold text-zinc-400 uppercase tracking-[0.22em] dark:text-zinc-500">
                            {activeSection === "favorites" ? "Favorites" : "Pages"}
                        </p>
                    </div>

                    {/* Notes list */}
                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-1 pb-3">
                            {notes.length === 0 ? (
                                <p className="text-xs text-zinc-400 px-3 py-2 dark:text-zinc-500">
                                    No pages yet
                                </p>
                            ) : (
                                notes.map((note) => (
                                    <button
                                        key={note.id}
                                        onClick={() => onSelectNote(note.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[0.95rem] text-left truncate transition-all",
                                            activeNoteId === note.id
                                                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-100"
                                                : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                                        )}
                                    >
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <span className="truncate flex-1">
                                            {note.title || "Untitled"}
                                        </span>
                                        {note.isFavorite && (
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <Separator className="bg-zinc-200/70 dark:bg-white/10" />

                    {/* New Page button */}
                    <div className="p-3 space-y-2">
                        <Button
                            variant="secondary"
                            className="w-full justify-start gap-2 rounded-2xl"
                            onClick={onNewPage}
                        >
                            <Plus className="w-4 h-4" />
                            New Page
                        </Button>

                        {onLogout && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 rounded-2xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={onLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Collapsed toggle button removed; use topbar control */}
        </>
    );
}
