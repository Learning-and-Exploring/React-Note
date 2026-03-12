import { X, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-full max-w-md transform transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col border-l border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5">
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Chat
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Coming soon</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            Chat features are on the way. Stay tuned!
          </div>
        </main>

        <footer className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <Input
              placeholder="Message (coming soon)"
              disabled
              className="border-none bg-transparent shadow-none disabled:cursor-not-allowed"
            />
            <Button size="icon-sm" disabled>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
