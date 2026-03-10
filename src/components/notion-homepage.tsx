import { FileText, Plus, Sparkles } from "lucide-react";
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
        <div className="flex flex-col h-full px-4">
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
                            <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
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
                    <Plus className="w-4 h-4" />
                    Create your first page
                </Button>
            </div>
        </div>
    );
}
