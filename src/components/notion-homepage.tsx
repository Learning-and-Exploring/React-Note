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
        <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="max-w-lg w-full">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-6">
                    <Sparkles className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>

                {/* Greeting */}
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                    {greeting}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
                    Welcome to <span className="font-medium text-zinc-700 dark:text-zinc-300">{workspaceName}</span>.{" "}
                    {noteCount === 0
                        ? "Create your first page to get started."
                        : `You have ${noteCount} page${noteCount === 1 ? "" : "s"}.`}
                </p>

                {/* Quick actions */}
                <div className="grid sm:grid-cols-2 gap-3">
                    <button
                        onClick={onNewPage}
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New page</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Start from blank</p>
                        </div>
                    </button>

                    <button
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors group"
                        onClick={onNewPage}
                    >
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                            <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New note</p>
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
