import { useEffect, useState } from "react";
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
import { Check, Copy, ExternalLink, Link as LinkIcon, ShieldOff } from "lucide-react";

type ShareDialogProps = {
  open: boolean;
  shareUrl: string | null;
  loading?: boolean;
  noteTitle?: string;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onCopy?: () => void;
  onUnshare?: () => void;
};

export function ShareDialog({
  open,
  shareUrl,
  loading,
  noteTitle,
  error,
  onOpenChange,
  onCopy,
  onUnshare,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy?.();
    } catch {
      /* ignore clipboard errors */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Share link
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view
            {noteTitle ? ` "${noteTitle}"` : " the note"}.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="secondary" onClick={handleCopy} disabled={loading}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(shareUrl, "_blank")}
                disabled={loading}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Generate a share link to show it here.</p>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            className="gap-2 text-red-500 hover:text-red-600"
            onClick={onUnshare}
            disabled={loading}
          >
            <ShieldOff className="w-4 h-4" />
            Unshare
          </Button>
          <Button onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
