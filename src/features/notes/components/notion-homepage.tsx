import { FileText, CircleFadingPlus, Sparkles, Star, Share2, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotionHomepageProps = {
    workspaceName: string;
    noteCount: number;
    onNewPage: () => void;
};

export function NotionHomepage({ workspaceName, noteCount, onNewPage }: NotionHomepageProps) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="flex flex-col h-full px-4 gap-4">
            {/* Hero card */}
            <div className="mx-auto w-full min-h-[55vh] rounded-3xl bg-white/85 px-5 py-6 text-center ring-1 ring-white/70 backdrop-blur sm:px-8 sm:py-8 dark:bg-zinc-900/80 dark:ring-white/10">
                {/* Icon */}
                <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/70 shadow-sm dark:bg-white/10">
                    <Sparkles className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>

                {/* Greeting */}
                <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {greeting}
                </h1>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Welcome to <span className="font-medium text-zinc-700 dark:text-zinc-200">{workspaceName}</span>.{" "}
                    {noteCount === 0
                        ? "Create your first page to get started."
                        : `You have ${noteCount} page${noteCount === 1 ? "" : "s"}.`}
                </p>

                {/* Quick actions */}
                <div className="mt-8 grid w-full max-w-md gap-4 mx-auto sm:grid-cols-2">
                    <button
                        onClick={onNewPage}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/80 shadow-sm hover:shadow-md text-left transition-all dark:bg-white/10"
                    >
                        <div className="w-9 h-9 rounded-2xl bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                            <CircleFadingPlus className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New page</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Start from blank</p>
                        </div>
                    </button>

                    <button
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/80 shadow-sm hover:shadow-md text-left transition-all dark:bg-white/10"
                        onClick={onNewPage}
                    >
                        <div className="w-9 h-9 rounded-2xl bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                            <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New note</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Capture your thoughts</p>
                        </div>
                    </button>
                </div>

                {/* CTA */}
                <Button
                    className="mt-8 gap-2"
                    onClick={onNewPage}
                >
                    <CircleFadingPlus className="w-4 h-4" />
                    Create your first page
                </Button>
            </div>

            {/* Features strip */}
            <div className="mx-auto w-full grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/85 shadow-sm ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 dark:bg-amber-900/30">
                        <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Favorites</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Star pages to pin them for quick access</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/85 shadow-sm ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 dark:bg-indigo-900/30">
                        <Share2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Share instantly</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Generate a view-only link in one click</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/85 shadow-sm ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 dark:bg-emerald-900/30">
                        <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI chat</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Ask questions about your notes anytime</p>
                    </div>
                </div>
            </div>

            {/* Tips row */}
            <div className="mx-auto w-full rounded-3xl bg-white/85 px-5 py-5 ring-1 ring-white/70 backdrop-blur mb-4 sm:px-8 dark:bg-zinc-900/80 dark:ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-4">
                    Tips to get started
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 dark:bg-zinc-800">
                            <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Pick up where you left off</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                Your notes auto-save as you type—no manual saving needed.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 dark:bg-zinc-800">
                            <Star className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Star what matters</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                Open a note and tap the star icon to add it to Favorites.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 dark:bg-zinc-800">
                            <Share2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Loop others in</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                Use the share button to create a read-only link for any note.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 dark:bg-zinc-800">
                            <MessageSquare className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Chat with your notes</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                Open the chat panel to ask AI questions about anything you've written.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}