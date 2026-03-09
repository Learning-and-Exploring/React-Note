import {
    Home,
    FileText,
    Star,
    Trash2,
    Plus,
    ChevronLeft,
    ChevronRight,
    StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";

type NavSection = "home" | "notes" | "favorites" | "trash";

type NotionSidebarProps = {
    notes: Note[];
    activeNoteId: number | null;
    activeSection: NavSection;
    isOpen: boolean;
    onToggle: () => void;
    onSelectNote: (id: number) => void;
    onSelectSection: (section: NavSection) => void;
    onNewPage: () => void;
    workspaceName: string;
};

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "trash", label: "Trash", icon: Trash2 },
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
    workspaceName,
}: NotionSidebarProps) {
    return (
        <>
            {/* Sidebar panel */}
            <aside
                className={cn(
                    "flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800",
                    "transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                    isOpen ? "w-60" : "w-0"
                )}
            >
                <div className="flex flex-col h-full min-w-60">
                    {/* Workspace header */}
                    <div className="flex items-center justify-between px-3 py-3 h-12">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                                <StickyNote className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {workspaceName}
                            </span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                    {/* Navigation */}
                    <nav className="px-2 py-2 space-y-0.5">
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => onSelectSection(id)}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                                    activeSection === id && !activeNoteId
                                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </button>
                        ))}
                    </nav>

                    <Separator className="mx-2 bg-zinc-200 dark:bg-zinc-800" />

                    {/* Notes list label */}
                    <div className="px-4 pt-3 pb-1">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Pages
                        </p>
                    </div>

                    {/* Notes list */}
                    <ScrollArea className="flex-1 px-2">
                        <div className="space-y-0.5 pb-2">
                            {notes.length === 0 ? (
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 px-2 py-2">
                                    No pages yet
                                </p>
                            ) : (
                                notes.map((note) => (
                                    <button
                                        key={note.id}
                                        onClick={() => onSelectNote(note.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left truncate transition-colors group",
                                            activeNoteId === note.id
                                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                        )}
                                    >
                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                            {note.title || "Untitled"}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                    {/* New Page button */}
                    <div className="p-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={onNewPage}
                        >
                            <Plus className="w-4 h-4" />
                            New Page
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Collapsed toggle button */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed left-2 top-3 z-50 p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-sm"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </>
    );
}
