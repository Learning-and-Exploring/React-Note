import { useState } from "react";
import {
    ChevronRight,
    Share,
    Star,
    Loader2,
    MoreHorizontal,
    Sun,
    Moon,
    Trash2,
    Clock,
    Menu,
    MessageCircle,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useTheme } from "@/components/theme-provider";
import { formatDate } from "@/utils/format-date";
import type { Note } from "@/services/note-service";

type NotionTopbarProps = {
    activeNote: Note | null;
    workspaceName: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onDeleteNote: (id: number) => void;
    onToggleFavorite?: () => void;
    isFavorited?: boolean;
    onShareNote?: () => void;
    shareLoading?: boolean;
    onOpenChat?: () => void;
    onQuickNew?: () => void;
};

export function NotionTopbar({
    activeNote,
    workspaceName,
    isSidebarOpen,
    onToggleSidebar,
    onDeleteNote,
    onToggleFavorite,
    isFavorited,
    onShareNote,
    shareLoading,
    onOpenChat,
    onQuickNew,
}: NotionTopbarProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <>
            <header className="mx-3 mt-3 mb-3 flex h-12 items-center justify-between rounded-2xl bg-white/80 px-4 shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:mx-4 sm:mt-4 dark:bg-zinc-900/70 dark:ring-white/10">
                {/* Left: Sidebar toggle + Breadcrumb */}
                <div className="flex items-center gap-2 min-w-0">
                    {!isSidebarOpen && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                    onClick={onToggleSidebar}
                                >
                                    <Menu className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Open sidebar</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1 text-xs text-zinc-500 min-w-0 dark:text-zinc-400">
                        <span className="hover:text-zinc-900 cursor-default transition-colors dark:hover:text-zinc-100">
                            {workspaceName}
                        </span>
                        {activeNote && (
                            <>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-zinc-900 font-medium truncate max-w-48 dark:text-zinc-100">
                                    {activeNote.title || "Untitled"}
                                </span>
                            </>
                        )}
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Last edited */}
                    {activeNote && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 mr-2 dark:text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>Edited {formatDate(activeNote.updatedAt ?? activeNote.createdAt)}</span>
                        </div>
                    )}

                    {/* Share */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={onShareNote}
                                disabled={!activeNote || shareLoading}
                            >
                                {shareLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Share className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Share</TooltipContent>
                    </Tooltip>

                    {/* Quick New */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={onQuickNew}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">New page</TooltipContent>
                    </Tooltip>

                    {/* Chat */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={onOpenChat}
                            >
                                <MessageCircle className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Chat (coming soon)</TooltipContent>
                    </Tooltip>

                    {/* Favorite */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={onToggleFavorite}
                                disabled={!activeNote}
                            >
                                <Star
                                    className="w-4 h-4"
                                    fill={isFavorited ? "currentColor" : "none"}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {isFavorited ? "Unfavorite" : "Favorite"}
                        </TooltipContent>
                    </Tooltip>

                    {/* Dark mode toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={toggleTheme}
                            >
                                {resolvedTheme === "dark" ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                        </TooltipContent>
                    </Tooltip>

                    {/* More options */}
                    {activeNote && (
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">More options</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete page
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </header>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-red-500" />
                            Delete page?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => activeNote && onDeleteNote(activeNote.id)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
