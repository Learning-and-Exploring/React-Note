import {
    Home,
    FileText,
    Star,
    CircleFadingPlus,
    ChevronLeft,
    ChevronRight,
    StickyNote,
    LogOut,
} from "lucide-react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";
import { useState, useEffect, useRef } from "react";

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
    onLoadMoreNotes: () => void;
    hasMoreNotes: boolean;
    loadingMoreNotes: boolean;
    onLogout?: () => void;
    onOpenChat?: () => void;
    workspaceName: string;
};

type NavItem = {
    id: NavSection | "chat";
    label: string;
    icon: React.ElementType;
    isSection?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { id: "home", label: "Home", icon: Home, isSection: true },
    { id: "notes", label: "Notes", icon: FileText, isSection: true },
    { id: "favorites", label: "Favorites", icon: Star, isSection: true },
    { id: "chat", label: "Chat", icon: MessageCircle, isSection: false },
];

const MAX_TITLE_CHARS = 26;

function formatSidebarTitle(raw: string): string {
    const title = raw.trim() || "Untitled";
    if (title.length <= MAX_TITLE_CHARS) return title;
    return `${title.slice(0, MAX_TITLE_CHARS)}…`;
}

export function NotionSidebar({
    notes,
    activeNoteId,
    activeSection,
    isOpen,
    onToggle,
    onSelectNote,
    onSelectSection,
    onNewPage,
    onLoadMoreNotes,
    hasMoreNotes,
    loadingMoreNotes,
    onLogout,
    onOpenChat,
    workspaceName,
}: NotionSidebarProps) {
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    // ── Infinite scroll sentinel ──────────────────────────────────────────────
    const sentinelRef = useRef<HTMLDivElement>(null);

    // 👇 Stable ref — avoids recreating the observer on every render
    const onLoadMoreRef = useRef(onLoadMoreNotes);
    useEffect(() => {
        onLoadMoreRef.current = onLoadMoreNotes;
    }, [onLoadMoreNotes]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreNotes && !loadingMoreNotes) {
                    onLoadMoreRef.current();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreNotes, loadingMoreNotes]);

    return (
        <>
            {/* Sidebar panel */}
            <aside
                className={cn(
                    "flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 py-4",
                    isOpen ? "w-[22rem]" : "w-[4.5rem]"
                )}
            >
                <div className="flex flex-col h-full rounded-3xl bg-white/80 ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10 overflow-hidden">
                    {/* Workspace header */}
                    <div className={cn(
                        "flex items-center py-4 shrink-0",
                        isOpen ? "justify-between px-4" : "justify-center px-0"
                    )}>
                        {isOpen && (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-9 h-9 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 dark:bg-zinc-100">
                                    <StickyNote className="w-4 h-4 text-white dark:text-zinc-900" />
                                </div>
                                <span className="text-sm font-semibold tracking-tight text-zinc-900 truncate dark:text-zinc-100">
                                    {workspaceName}
                                </span>
                            </div>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onToggle}
                                    className="p-2 rounded-full bg-white/70 text-zinc-500 shadow-sm hover:text-zinc-900 transition-colors dark:bg-white/10 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                    {isOpen
                                        ? <ChevronLeft className="w-4 h-4" />
                                        : <ChevronRight className="w-4 h-4" />
                                    }
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {isOpen ? "Collapse sidebar" : "Expand sidebar"}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator className="bg-zinc-200/70 dark:bg-white/10" />

                    {/* Navigation */}
                    <nav className={cn(
                        "py-3 space-y-1.5",
                        isOpen ? "px-4" : "px-2"
                    )}>
                        {NAV_ITEMS.map(({ id, label, icon: Icon, isSection }) => {
                            const isActive = isSection && activeSection === id && !activeNoteId;
                            const onClick = () => {
                                if (id === "chat") {
                                    onOpenChat?.();
                                    return;
                                }
                                onSelectSection(id as NavSection);
                            };

                            return (
                                <Tooltip key={id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={onClick}
                                            className={cn(
                                                "w-full flex items-center gap-3 rounded-2xl text-[0.95rem] text-left transition-all",
                                                isOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center",
                                                isActive
                                                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-100"
                                                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                                            )}
                                        >
                                            <Icon className="w-[1.05rem] h-[1.05rem] shrink-0" />
                                            {isOpen && label}
                                        </button>
                                    </TooltipTrigger>
                                    {!isOpen && (
                                        <TooltipContent side="right">{label}</TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </nav>

                    <Separator className="mx-4 bg-zinc-200/70 dark:bg-white/10" />

                    {/* Notes list label */}
                    {isOpen && (
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-[0.7rem] font-semibold text-zinc-400 uppercase tracking-[0.22em] dark:text-zinc-500">
                                {activeSection === "favorites" ? "Favorites" : "Pages"}
                            </p>
                        </div>
                    )}

                    {/* Notes list */}
                    <div className={cn("flex-1 min-h-0", isOpen ? "px-4" : "px-2")}>
                        <ScrollArea className="h-full">
                            <div className="space-y-1 pb-3 pt-2">
                                {notes.length === 0 ? (
                                    isOpen && (
                                        <p className="text-xs text-zinc-400 px-3 py-2 dark:text-zinc-500">
                                            No pages yet
                                        </p>
                                    )
                                ) : (
                                    notes.map((note) => (
                                        <Tooltip key={note.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => onSelectNote(note.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 rounded-2xl text-[0.95rem] text-left truncate transition-all",
                                                        isOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center",
                                                        activeNoteId === note.id
                                                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-100"
                                                            : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                                                    )}
                                                >
                                                    <FileText className="w-4 h-4 shrink-0" />
                                                    {isOpen && (
                                                        <>
                                                            <span className="truncate flex-1">
                                                                {formatSidebarTitle(note.title || "Untitled")}
                                                            </span>
                                                            {note.isFavorite && (
                                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            {!isOpen && (
                                                <TooltipContent side="right">
                                                    {note.title || "Untitled"}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    ))
                                )}

                                {/* ── Sentinel: triggers onLoadMoreNotes when scrolled into view ── */}
                                <div ref={sentinelRef} className="h-1" />

                                {notes.length > 0 && (
                                    <div className="pt-2 pb-1 px-2 text-[0.7rem] text-zinc-400 flex items-center justify-center dark:text-zinc-500">
                                        {loadingMoreNotes
                                            ? "Loading more..."
                                            : hasMoreNotes
                                                ? "Scroll to load more"
                                                : "All notes loaded"}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <Separator className="bg-zinc-200/70 dark:bg-white/10" />

                    {/* New Page + Logout */}
                    <div className={cn("p-3 space-y-2", !isOpen && "flex flex-col items-center px-2")}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    className={cn(
                                        "rounded-2xl",
                                        isOpen ? "w-full justify-start gap-2" : "w-10 h-10 p-0 justify-center"
                                    )}
                                    onClick={onNewPage}
                                >
                                    <CircleFadingPlus className="w-4 h-4 shrink-0" />
                                    {isOpen && "New Page"}
                                </Button>
                            </TooltipTrigger>
                            {!isOpen && <TooltipContent side="right">New Page</TooltipContent>}
                        </Tooltip>

                        {onLogout && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "rounded-2xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                                            isOpen ? "w-full justify-start gap-2" : "w-10 h-10 p-0 justify-center"
                                        )}
                                        onClick={() => setLogoutDialogOpen(true)}
                                    >
                                        <LogOut className="w-4 h-4 shrink-0" />
                                        {isOpen && "Logout"}
                                    </Button>
                                </TooltipTrigger>
                                {!isOpen && <TooltipContent side="right">Logout</TooltipContent>}
                            </Tooltip>
                        )}
                    </div>
                </div>
            </aside>

            {/* Logout confirmation dialog */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will need to sign in again to access your notes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                                setLogoutDialogOpen(false);
                                onLogout?.();
                            }}
                        >
                            Logout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}