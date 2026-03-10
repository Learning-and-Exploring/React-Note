import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";

type SaveStatus = "idle" | "saving" | "saved";

type NotionEditorProps = {
    note: Note;
    onUpdate: (id: number, payload: { title?: string; body?: string }) => Promise<void>;
};

export function NotionEditor({ note, onUpdate }: NotionEditorProps) {
    const [title, setTitle] = useState(note.title);
    const [bodyHtml, setBodyHtml] = useState(note.body);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [isBodyActive, setIsBodyActive] = useState(!isHtmlEmpty(note.body));

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const activePreRef = useRef<HTMLPreElement | null>(null);
    const [copyAnchor, setCopyAnchor] = useState<{
        top: number;
        left: number;
        code: string;
    } | null>(null);
    const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied">("Copy");
    const [activeMarks, setActiveMarks] = useState({
        bold: false,
        italic: false,
        underline: false,
        ul: false,
        ol: false,
        block: "p",
    });
    const [slashMenu, setSlashMenu] = useState<{
        top: number;
        left: number;
        open: boolean;
    }>({ top: 0, left: 0, open: false });

    // Sync when note changes
    useEffect(() => {
        setTitle(note.title);
        setBodyHtml(note.body);
        setSaveStatus("idle");
        setIsBodyActive(!isHtmlEmpty(note.body));
    }, [note.id]);

    // Sync editor HTML when note changes
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (el.innerHTML !== bodyHtml) {
            el.innerHTML = bodyHtml || "";
        }
    }, [bodyHtml]);

    const scheduleSave = useCallback(
        (nextTitle: string, nextBody: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setSaveStatus("saving");
            debounceRef.current = setTimeout(async () => {
                await onUpdate(note.id, { title: nextTitle, body: nextBody });
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
            }, 1000);
        },
        [note.id, onUpdate]
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        scheduleSave(e.target.value, bodyHtml);
    };

    const handleBodyInput = () => {
        const html = editorRef.current?.innerHTML ?? "";
        const normalized = normalizeHtml(html);
        setBodyHtml(normalized);
        scheduleSave(title, normalized);
    };

    const handleBodyBlur = () => {
        const html = editorRef.current?.innerHTML ?? "";
        if (isHtmlEmpty(html)) {
            setIsBodyActive(false);
            setBodyHtml("");
            if (editorRef.current) editorRef.current.innerHTML = "";
            scheduleSave(title, "");
        }
    };

    const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement | null;
        const pre = target?.closest("pre") as HTMLPreElement | null;
        if (!pre || pre === activePreRef.current) return;
        const container = editorRef.current?.parentElement;
        if (!container) return;
        const preRect = pre.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        activePreRef.current = pre;
        setCopyAnchor({
            top: preRect.top - containerRect.top + 8,
            left: preRect.right - containerRect.left - 64,
            code: pre.innerText,
        });
    };

    const handleEditorMouseLeave = () => {
        activePreRef.current = null;
        setCopyAnchor(null);
    };

    const handleCopyCode = async () => {
        if (!copyAnchor?.code) return;
        try {
            await navigator.clipboard.writeText(copyAnchor.code);
            setCopyLabel("Copied");
            window.setTimeout(() => setCopyLabel("Copy"), 1600);
        } catch {
            // ignore clipboard errors
        }
    };

    const updateActiveMarks = useCallback(() => {
        setActiveMarks({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            ul: document.queryCommandState("insertUnorderedList"),
            ol: document.queryCommandState("insertOrderedList"),
            block: String(document.queryCommandValue("formatBlock") || "p")
                .replace(/[<>]/g, "")
                .toLowerCase(),
        });
    }, []);

    useEffect(() => {
        const handler = () => updateActiveMarks();
        document.addEventListener("selectionchange", handler);
        return () => document.removeEventListener("selectionchange", handler);
    }, [updateActiveMarks]);

    const openSlashMenu = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0).cloneRange();
        const rect = range.getBoundingClientRect();
        const container = editorRef.current?.parentElement;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        setSlashMenu({
            open: true,
            top: rect.top - containerRect.top + 18,
            left: rect.left - containerRect.left,
        });
    };

    const closeSlashMenu = () => setSlashMenu((prev) => ({ ...prev, open: false }));

    const removeSlashToken = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const node = selection.anchorNode;
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent ?? "";
        const offset = selection.anchorOffset;
        const index = text.lastIndexOf("/", offset - 1);
        if (index === -1) return;
        const nextText = text.slice(0, index) + text.slice(offset);
        node.textContent = nextText;
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index);
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const applySlashCommand = (fn: () => void) => {
        removeSlashToken();
        fn();
        closeSlashMenu();
    };

    const applyCommand = (command: string, value?: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        document.execCommand(command, false, value);
        handleBodyInput();
        updateActiveMarks();
    };

    const applyBlock = (tag: string) => applyCommand("formatBlock", tag);

    return (
        <div className="flex flex-col h-full">
            {/* Editor content */}
            <div className="flex-1 overflow-y-auto pb-10 px-4">
                <div className="relative mx-auto rounded-3xl bg-white/85 px-5 py-6 ring-1 ring-white/70 backdrop-blur sm:px-8 sm:py-8 dark:bg-zinc-900/80 dark:ring-white/10">
                    {(saveStatus === "saving" || saveStatus === "saved") && (
                        <div
                            aria-live="polite"
                            className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs shadow-sm ring-1 ring-black/5 backdrop-blur sm:right-6 sm:top-6 dark:bg-zinc-950/80 dark:ring-white/10"
                        >
                            {saveStatus === "saving" ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                                    <span className="text-zinc-500">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Saved</span>
                                </>
                            )}
                        </div>
                    )}
                    {/* Title */}
                    <input
                        className={cn(
                            "w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-300 dark:placeholder:text-zinc-600",
                            "outline-none border-none resize-none leading-tight mb-4",
                            "caret-zinc-900 dark:caret-zinc-100"
                        )}
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        spellCheck={false}
                    />

                    {/* Divider hint */}
                    <div className="flex items-center gap-3 mb-6 group">
                        <div className="h-px flex-1 bg-zinc-100 group-hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:group-hover:bg-zinc-700" />
                    </div>

                    {/* Body */}
                    {!isBodyActive && isHtmlEmpty(bodyHtml) ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsBodyActive(true);
                                requestAnimationFrame(() => editorRef.current?.focus());
                            }}
                            className="flex min-h-[55vh] w-full items-start rounded-2xl border border-dashed border-zinc-200/70 px-4 py-3 text-left text-base text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-400"
                        >
                            Click to start writing, or press "/" for commands...
                        </button>
                    ) : (
                        <div
                            className="relative"
                            onMouseMove={handleEditorMouseMove}
                            onMouseLeave={handleEditorMouseLeave}
                            onClick={() => {
                                if (editorRef.current) {
                                    if (isHtmlEmpty(editorRef.current.innerHTML)) {
                                        editorRef.current.innerHTML = "<p><br /></p>";
                                    }
                                    editorRef.current.focus();
                                }
                            }}
                        >
                            <div className="notion-toolbar mb-4 flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => applyBlock("p")}
                                    data-active={activeMarks.block === "p"}
                                >
                                    Text
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyBlock("h1")}
                                    data-active={activeMarks.block === "h1"}
                                >
                                    H1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyBlock("h2")}
                                    data-active={activeMarks.block === "h2"}
                                >
                                    H2
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyBlock("blockquote")}
                                    data-active={activeMarks.block === "blockquote"}
                                >
                                    Quote
                                </button>
                                <span className="mx-1 h-4 w-px bg-zinc-200/70 dark:bg-zinc-800/70" />
                                <button
                                    type="button"
                                    onClick={() => applyCommand("bold")}
                                    data-active={activeMarks.bold}
                                >
                                    Bold
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyCommand("italic")}
                                    data-active={activeMarks.italic}
                                >
                                    Italic
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyCommand("underline")}
                                    data-active={activeMarks.underline}
                                >
                                    Underline
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyCommand("insertUnorderedList")}
                                    data-active={activeMarks.ul}
                                >
                                    Bullet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyCommand("insertOrderedList")}
                                    data-active={activeMarks.ol}
                                >
                                    Numbered
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyBlock("pre")}
                                    data-active={activeMarks.block === "pre"}
                                >
                                    Code
                                </button>
                            </div>

                            {copyAnchor && (
                                <button
                                    type="button"
                                    onClick={handleCopyCode}
                                    className="notion-copy-btn"
                                    style={{ top: copyAnchor.top, left: copyAnchor.left }}
                                >
                                    {copyLabel}
                                </button>
                            )}

                            {slashMenu.open && (
                                <div className="notion-slash-menu" style={{ top: slashMenu.top, left: slashMenu.left }}>
                                    <button type="button" onClick={() => applySlashCommand(() => applyBlock("p"))}>
                                        Text
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyBlock("h1"))}>
                                        Heading 1
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyBlock("h2"))}>
                                        Heading 2
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyBlock("blockquote"))}>
                                        Quote
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyCommand("insertUnorderedList"))}>
                                        Bulleted list
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyCommand("insertOrderedList"))}>
                                        Numbered list
                                    </button>
                                    <button type="button" onClick={() => applySlashCommand(() => applyBlock("pre"))}>
                                        Code block
                                    </button>
                                </div>
                            )}

                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                data-placeholder="Start writing, or press '/' for commands..."
                                onInput={handleBodyInput}
                                onBlur={handleBodyBlur}
                                onFocus={() => setIsBodyActive(true)}
                                onKeyUp={(e) => {
                                    if (e.key === "/") {
                                        openSlashMenu();
                                    } else if (e.key === "Escape") {
                                        closeSlashMenu();
                                    } else {
                                        updateActiveMarks();
                                    }
                                }}
                                onMouseUp={updateActiveMarks}
                                spellCheck={false}
                                className={cn(
                                    "notion-richtext min-h-[55vh] w-full bg-transparent text-base text-zinc-700 dark:text-zinc-300",
                                    "outline-none border-none leading-relaxed",
                                    "caret-zinc-700 dark:caret-zinc-300"
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function isHtmlEmpty(html: string) {
    const stripped = html
        .replace(/<br\s*\/?>/gi, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/<[^>]*>/g, "")
        .trim();
    return stripped.length === 0;
}

function normalizeHtml(html: string) {
    return isHtmlEmpty(html) ? "" : html;
}
