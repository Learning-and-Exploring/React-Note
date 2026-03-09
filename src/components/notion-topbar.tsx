import {
    ChevronRight,
    Share,
    Star,
    MoreHorizontal,
    Sun,
    Moon,
    Trash2,
    Clock,
    Menu,
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
};

export function NotionTopbar({
    activeNote,
    workspaceName,
    isSidebarOpen,
    onToggleSidebar,
    onDeleteNote,
}: NotionTopbarProps) {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <header className="flex items-center justify-between h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            {/* Left: Sidebar toggle + Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
                {!isSidebarOpen && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                onClick={onToggleSidebar}
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Open sidebar</TooltipContent>
                    </Tooltip>
                )}

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-default transition-colors">
                        {workspaceName}
                    </span>
                    {activeNote && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-48">
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
                    <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 mr-2">
                        <Clock className="w-3 h-3" />
                        <span>Edited {formatDate(activeNote.updatedAt ?? activeNote.createdAt)}</span>
                    </div>
                )}

                {/* Share */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            <Share className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Share</TooltipContent>
                </Tooltip>

                {/* Favorite */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            <Star className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Favorite</TooltipContent>
                </Tooltip>

                {/* Dark mode toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
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
                                        size="icon"
                                        className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
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
                                onClick={() => onDeleteNote(activeNote.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete page
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
