import { useState } from "react";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type NewPageDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (payload: { title: string; body: string }) => Promise<void>;
    loading: boolean;
};

export function NewPageDialog({ open, onOpenChange, onCreate, loading }: NewPageDialogProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const handleCreate = async () => {
        if (!title.trim()) return;
        await onCreate({ title: title.trim(), body: body.trim() });
        setTitle("");
        setBody("");
        onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            void handleCreate();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Page
                    </DialogTitle>
                    <DialogDescription>
                        Give your page a title to get started. You can always edit it later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <div>
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Untitled"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            className="text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Content <span className="text-zinc-400">(optional)</span>
                        </label>
                        <Textarea
                            placeholder="Start writing…"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="text-sm resize-none min-h-24"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleCreate()}
                        disabled={!title.trim() || loading}
                        className="gap-2"
                    >
                        {loading ? "Creating…" : "Create page"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
