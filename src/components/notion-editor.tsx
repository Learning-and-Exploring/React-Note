// import { useEffect, useRef, useState, useCallback } from "react";
// import { Check, Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";
// import type { Note } from "@/services/note-service";

// type SaveStatus = "idle" | "saving" | "saved";

// const TITLE_MAX_LENGTH = 50;
// const TITLE_LIMIT_MESSAGE = "Title is limited to 50 characters";

// type NotionEditorProps = {
//     note: Note;
//     onUpdate: (id: number, payload: { title?: string; body?: string }) => Promise<void>;
// };

// // ── Slash menu items ──────────────────────────────────────────────────────────
// const SLASH_ITEMS = [
//     { label: "Text",          action: (applyBlock: (t: string) => void, applyCommand: (c: string, v?: string) => void) => applyBlock("p") },
//     { label: "Heading 1",     action: (applyBlock: (t: string) => void) => applyBlock("h1") },
//     { label: "Heading 2",     action: (applyBlock: (t: string) => void) => applyBlock("h2") },
//     { label: "Quote",         action: (applyBlock: (t: string) => void) => applyBlock("blockquote") },
//     { label: "Bulleted list", action: (_: (t: string) => void, applyCommand: (c: string, v?: string) => void) => applyCommand("insertUnorderedList") },
//     { label: "Numbered list", action: (_: (t: string) => void, applyCommand: (c: string, v?: string) => void) => applyCommand("insertOrderedList") },
//     { label: "Code block",    action: (applyBlock: (t: string) => void) => applyBlock("pre") },
// ] as const;

// export function NotionEditor({ note, onUpdate }: NotionEditorProps) {
//     const [title, setTitle] = useState(note.title);
//     const [bodyHtml, setBodyHtml] = useState(note.body);
//     const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
//     const [isBodyActive, setIsBodyActive] = useState(!isHtmlEmpty(note.body));

//     const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//     const editorRef = useRef<HTMLDivElement>(null);
//     const activePreRef = useRef<HTMLPreElement | null>(null);
//     const slashMenuRef = useRef<HTMLDivElement | null>(null);

//     const [copyAnchor, setCopyAnchor] = useState<{ top: number; left: number; code: string } | null>(null);
//     const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied">("Copy");
//     const [activeMarks, setActiveMarks] = useState({
//         bold: false, italic: false, underline: false,
//         ul: false, ol: false, block: "p",
//     });
//     const [slashMenu, setSlashMenu] = useState<{ top: number; left: number; open: boolean }>({
//         top: 0, left: 0, open: false,
//     });
//     // ── NEW: track which slash item is highlighted ────────────────────────────
//     const [slashIndex, setSlashIndex] = useState(0);

//     // Sync when note changes
//     useEffect(() => {
//         setTitle(note.title);
//         setBodyHtml(note.body);
//         setSaveStatus("idle");
//         setIsBodyActive(!isHtmlEmpty(note.body));
//     }, [note.id]);

//     // Sync editor HTML when note changes
//     useEffect(() => {
//         const el = editorRef.current;
//         if (!el) return;
//         if (el.innerHTML !== bodyHtml) el.innerHTML = bodyHtml || "";
//     }, [bodyHtml]);

//     const scheduleSave = useCallback(
//         (nextTitle: string, nextBody: string) => {
//             if (debounceRef.current) clearTimeout(debounceRef.current);
//             setSaveStatus("saving");
//             debounceRef.current = setTimeout(async () => {
//                 await onUpdate(note.id, { title: nextTitle, body: nextBody });
//                 setSaveStatus("saved");
//                 setTimeout(() => setSaveStatus("idle"), 2000);
//             }, 1000);
//         },
//         [note.id, onUpdate]
//     );

//     const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value.slice(0, TITLE_MAX_LENGTH);
//         setTitle(value);
//         scheduleSave(value, bodyHtml);
//     };

//     const handleBodyInput = () => {
//         const html = editorRef.current?.innerHTML ?? "";
//         const normalized = normalizeHtml(html);
//         setBodyHtml(normalized);
//         scheduleSave(title, normalized);
//     };

//     const handleBodyBlur = () => {
//         const html = editorRef.current?.innerHTML ?? "";
//         if (isHtmlEmpty(html)) {
//             setIsBodyActive(false);
//             setBodyHtml("");
//             if (editorRef.current) editorRef.current.innerHTML = "";
//             scheduleSave(title, "");
//         }
//     };

//     const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//         const pre = (e.target as HTMLElement)?.closest("pre") as HTMLPreElement | null;
//         if (!pre || pre === activePreRef.current) return;
//         const container = editorRef.current?.parentElement;
//         if (!container) return;
//         const preRect = pre.getBoundingClientRect();
//         const containerRect = container.getBoundingClientRect();
//         activePreRef.current = pre;
//         setCopyAnchor({
//             top: preRect.top - containerRect.top + 8,
//             left: preRect.right - containerRect.left - 64,
//             code: pre.innerText,
//         });
//     };

//     const handleEditorMouseLeave = () => {
//         activePreRef.current = null;
//         setCopyAnchor(null);
//     };

//     const handleCopyCode = async () => {
//         if (!copyAnchor?.code) return;
//         try {
//             await navigator.clipboard.writeText(copyAnchor.code);
//             setCopyLabel("Copied");
//             window.setTimeout(() => setCopyLabel("Copy"), 1600);
//         } catch { /* ignore */ }
//     };

//     const updateActiveMarks = useCallback(() => {
//         setActiveMarks({
//             bold: document.queryCommandState("bold"),
//             italic: document.queryCommandState("italic"),
//             underline: document.queryCommandState("underline"),
//             ul: document.queryCommandState("insertUnorderedList"),
//             ol: document.queryCommandState("insertOrderedList"),
//             block: String(document.queryCommandValue("formatBlock") || "p")
//                 .replace(/[<>]/g, "").toLowerCase(),
//         });
//     }, []);

//     useEffect(() => {
//         const handler = () => updateActiveMarks();
//         document.addEventListener("selectionchange", handler);
//         return () => document.removeEventListener("selectionchange", handler);
//     }, [updateActiveMarks]);

//     const openSlashMenu = () => {
//         const selection = window.getSelection();
//         if (!selection || selection.rangeCount === 0) return;
//         const rect = selection.getRangeAt(0).cloneRange().getBoundingClientRect();
//         const container = editorRef.current?.parentElement;
//         if (!container) return;
//         const containerRect = container.getBoundingClientRect();
//         setSlashIndex(0); // reset highlight when opening
//         setSlashMenu({
//             open: true,
//             top: rect.top - containerRect.top + 18,
//             left: rect.left - containerRect.left,
//         });
//     };

//     const closeSlashMenu = () => setSlashMenu((prev) => ({ ...prev, open: false }));

//     const removeSlashToken = () => {
//         const selection = window.getSelection();
//         if (!selection || selection.rangeCount === 0) return;
//         const node = selection.anchorNode;
//         if (!node || node.nodeType !== Node.TEXT_NODE) return;
//         const text = node.textContent ?? "";
//         const offset = selection.anchorOffset;
//         const index = text.lastIndexOf("/", offset - 1);
//         if (index === -1) return;
//         node.textContent = text.slice(0, index) + text.slice(offset);
//         const range = document.createRange();
//         range.setStart(node, index);
//         range.setEnd(node, index);
//         selection.removeAllRanges();
//         selection.addRange(range);
//     };

//     const applySlashCommand = (fn: () => void) => {
//         removeSlashToken();
//         fn();
//         closeSlashMenu();
//     };

//     // Close slash menu on outside click
//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             if (!slashMenu.open) return;
//             if (slashMenuRef.current?.contains(event.target as Node)) return;
//             closeSlashMenu();
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, [slashMenu.open]);

//     const applyCommand = (command: string, value?: string) => {
//         const el = editorRef.current;
//         if (!el) return;
//         el.focus();
//         document.execCommand(command, false, value);
//         handleBodyInput();
//         updateActiveMarks();
//     };

//     const applyBlock = (tag: string) => applyCommand("formatBlock", tag);

//     // ── NEW: keyboard handler for slash menu navigation ───────────────────────
//     const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
//         if (!slashMenu.open) return;

//         if (e.key === "ArrowDown") {
//             e.preventDefault(); // stop cursor moving in editor
//             setSlashIndex((i) => (i + 1) % SLASH_ITEMS.length);
//         } else if (e.key === "ArrowUp") {
//             e.preventDefault();
//             setSlashIndex((i) => (i - 1 + SLASH_ITEMS.length) % SLASH_ITEMS.length);
//         } else if (e.key === "Enter") {
//             e.preventDefault();
//             const item = SLASH_ITEMS[slashIndex];
//             applySlashCommand(() => item.action(applyBlock, applyCommand));
//         } else if (e.key === "Escape") {
//             closeSlashMenu();
//         }
//     };

//     return (
//         <div className="flex flex-col h-full">
//             <div className="flex-1 overflow-hidden pb-10 px-4">
//                 <div className="relative mx-auto flex flex-col rounded-3xl bg-white/85 px-5 py-6 ring-1 ring-white/70 backdrop-blur sm:px-8 sm:py-8 dark:bg-zinc-900/80 dark:ring-white/10 max-h-[75vh] sm:max-h-[78vh] overflow-hidden">
//                     <div className="sticky -top-10 z-10 -mx-5 -mt-6 mb-4 px-5 pt-5 pb-4 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8 bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur rounded-2xl border border-white/60 dark:bg-zinc-900/90 dark:border-white/10">
//                         {(saveStatus === "saving" || saveStatus === "saved") && (
//                             <div
//                                 aria-live="polite"
//                                 className="absolute right-5 top-5 sm:right-7 sm:top-7 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-zinc-950/80 dark:ring-white/10"
//                             >
//                                 {saveStatus === "saving" ? (
//                                     <><Loader2 className="w-3 h-3 animate-spin text-zinc-400" /><span className="text-zinc-500">Saving...</span></>
//                                 ) : (
//                                     <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Saved</span></>
//                                 )}
//                             </div>
//                         )}
//                         <div className="space-y-1">
//                             <input
//                                 className={cn(
//                                     "w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
//                                     "placeholder:text-zinc-300 dark:placeholder:text-zinc-600",
//                                     "outline-none border-none resize-none leading-tight",
//                                     "caret-zinc-900 dark:caret-zinc-100"
//                                 )}
//                                 value={title}
//                                 onChange={handleTitleChange}
//                                 placeholder="Untitled"
//                                 spellCheck={false}
//                                 maxLength={TITLE_MAX_LENGTH}
//                                 aria-describedby={title.length >= TITLE_MAX_LENGTH ? "title-limit-message" : undefined}
//                             />
//                             {title.length >= TITLE_MAX_LENGTH && (
//                                 <p id="title-limit-message" className="text-xs text-amber-600 dark:text-amber-400" role="alert">
//                                     {TITLE_LIMIT_MESSAGE}
//                                 </p>
//                             )}
//                         </div>
//                         <div className="flex items-center gap-3 mt-4 group">
//                             <div className="h-px flex-1 bg-zinc-100 group-hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:group-hover:bg-zinc-700" />
//                         </div>
//                     </div>

//                     <div className="flex-1 overflow-y-auto pr-1 sm:pr-2">
//                         {!isBodyActive && isHtmlEmpty(bodyHtml) ? (
//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     setIsBodyActive(true);
//                                     requestAnimationFrame(() => editorRef.current?.focus());
//                                 }}
//                                 className="flex min-h-[55vh] w-full items-start rounded-2xl border border-dashed border-zinc-200/70 px-4 py-3 text-left text-base text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-400"
//                             >
//                                 Click to start writing, or press "/" for commands...
//                             </button>
//                         ) : (
//                             <div
//                                 className="relative"
//                                 onMouseMove={handleEditorMouseMove}
//                                 onMouseLeave={handleEditorMouseLeave}
//                                 onClick={() => {
//                                     if (editorRef.current) {
//                                         if (isHtmlEmpty(editorRef.current.innerHTML)) {
//                                             editorRef.current.innerHTML = "<p><br /></p>";
//                                         }
//                                         editorRef.current.focus();
//                                     }
//                                 }}
//                             >
//                                 {/* Toolbar */}
//                                 <div className="notion-toolbar mb-4 flex flex-wrap items-center gap-1.5">
//                                     {(["p","h1","h2","blockquote"] as const).map((tag) => (
//                                         <button key={tag} type="button" onClick={() => applyBlock(tag)} data-active={activeMarks.block === tag}>
//                                             {{ p: "Text", h1: "H1", h2: "H2", blockquote: "Quote" }[tag]}
//                                         </button>
//                                     ))}
//                                     <span className="mx-1 h-4 w-px bg-zinc-200/70 dark:bg-zinc-800/70" />
//                                     {(["bold","italic","underline"] as const).map((cmd) => (
//                                         <button key={cmd} type="button" onClick={() => applyCommand(cmd)} data-active={activeMarks[cmd]}>
//                                             {{ bold: "Bold", italic: "Italic", underline: "Underline" }[cmd]}
//                                         </button>
//                                     ))}
//                                     <button type="button" onClick={() => applyCommand("insertUnorderedList")} data-active={activeMarks.ul}>Bullet</button>
//                                     <button type="button" onClick={() => applyCommand("insertOrderedList")} data-active={activeMarks.ol}>Numbered</button>
//                                     <button type="button" onClick={() => applyBlock("pre")} data-active={activeMarks.block === "pre"}>Code</button>
//                                 </div>

//                                 {copyAnchor && (
//                                     <button type="button" onClick={handleCopyCode} className="notion-copy-btn" style={{ top: copyAnchor.top, left: copyAnchor.left }}>
//                                         {copyLabel}
//                                     </button>
//                                 )}

//                                 {/* Slash menu */}
//                                 {slashMenu.open && (
//                                     <div
//                                         ref={slashMenuRef}
//                                         className="notion-slash-menu"
//                                         style={{ top: slashMenu.top, left: slashMenu.left }}
//                                     >
//                                         {SLASH_ITEMS.map((item, i) => (
//                                             <button
//                                                 key={item.label}
//                                                 type="button"
//                                                 // ── highlight active item ──
//                                                 data-active={i === slashIndex}
//                                                 className={cn(i === slashIndex && "bg-zinc-100 dark:bg-zinc-800")}
//                                                 onMouseEnter={() => setSlashIndex(i)}
//                                                 onClick={() => applySlashCommand(() => item.action(applyBlock, applyCommand))}
//                                             >
//                                                 {item.label}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 )}

//                                 <div
//                                     ref={editorRef}
//                                     contentEditable
//                                     suppressContentEditableWarning
//                                     data-placeholder="Start writing, or press '/' for commands..."
//                                     onInput={handleBodyInput}
//                                     onBlur={handleBodyBlur}
//                                     onFocus={() => setIsBodyActive(true)}
//                                     // ── keydown handles arrow/enter in slash menu ──
//                                     onKeyDown={handleEditorKeyDown}
//                                     onKeyUp={(e) => {
//                                         if (slashMenu.open) return; // already handled in keydown
//                                         if (e.key === "/") openSlashMenu();
//                                         else updateActiveMarks();
//                                     }}
//                                     onMouseUp={updateActiveMarks}
//                                     spellCheck={false}
//                                     className={cn(
//                                         "notion-richtext min-h-[55vh] w-full bg-transparent text-base text-zinc-700 dark:text-zinc-300",
//                                         "outline-none border-none leading-relaxed",
//                                         "caret-zinc-700 dark:caret-zinc-300"
//                                     )}
//                                 />
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function isHtmlEmpty(html: string) {
//     return html.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;/gi, " ").replace(/<[^>]*>/g, "").trim().length === 0;
// }

// function normalizeHtml(html: string) {
//     return isHtmlEmpty(html) ? "" : html;
// }

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";
import { noteService } from "@/services/note-service";
import { useSelector } from "react-redux";
import { selectAuthToken } from "@/store";

type SaveStatus = "idle" | "saving" | "saved";

const TITLE_MAX_LENGTH = 50;
const TITLE_LIMIT_MESSAGE = "Title is limited to 50 characters";

type NotionEditorProps = {
  note: Note;
  onUpdate: (id: number, payload: { title?: string; body?: string }) => Promise<void>;
};

const SLASH_ITEMS = [
  { label: "Text",          action: (applyBlock: (t: string) => void, _: (c: string, v?: string) => void) => applyBlock("p") },
  { label: "Heading 1",     action: (applyBlock: (t: string) => void) => applyBlock("h1") },
  { label: "Heading 2",     action: (applyBlock: (t: string) => void) => applyBlock("h2") },
  { label: "Quote",         action: (applyBlock: (t: string) => void) => applyBlock("blockquote") },
  { label: "Bulleted list", action: (_: (t: string) => void, applyCommand: (c: string, v?: string) => void) => applyCommand("insertUnorderedList") },
  { label: "Numbered list", action: (_: (t: string) => void, applyCommand: (c: string, v?: string) => void) => applyCommand("insertOrderedList") },
  { label: "Code block",    action: (applyBlock: (t: string) => void) => applyBlock("pre") },
  { label: "Image",         action: () => {} }, // 👈 handled separately
] as const;

export function NotionEditor({ note, onUpdate }: NotionEditorProps) {
  const token = useSelector(selectAuthToken);
  const [title, setTitle] = useState(note.title);
  const [bodyHtml, setBodyHtml] = useState(note.body);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isBodyActive, setIsBodyActive] = useState(!isHtmlEmpty(note.body));
  const [isUploading, setIsUploading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const activePreRef = useRef<HTMLPreElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);         // 👈 hidden file input
  const savedRangeRef = useRef<Range | null>(null);            // 👈 save cursor before file dialog

  const [copyAnchor, setCopyAnchor] = useState<{ top: number; left: number; code: string } | null>(null);
  const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied">("Copy");
  const [activeMarks, setActiveMarks] = useState({
    bold: false, italic: false, underline: false,
    ul: false, ol: false, block: "p",
  });
  const [slashMenu, setSlashMenu] = useState<{ top: number; left: number; open: boolean }>({
    top: 0, left: 0, open: false,
  });
  const [slashIndex, setSlashIndex] = useState(0);

  useEffect(() => {
    setTitle(note.title);
    setBodyHtml(note.body);
    setSaveStatus("idle");
    setIsBodyActive(!isHtmlEmpty(note.body));
  }, [note.id]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== bodyHtml) el.innerHTML = bodyHtml || "";
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
    const value = e.target.value.slice(0, TITLE_MAX_LENGTH);
    setTitle(value);
    scheduleSave(value, bodyHtml);
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

  // ── Image upload ────────────────────────────────────────────────────────────

  // Save cursor position before file dialog steals focus
  const saveRange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Restore cursor and insert image HTML at that position
  const insertImageAtCursor = (imageHtml: string) => {
    const el = editorRef.current;
    if (!el) return;

    el.focus();

    const selection = window.getSelection();
    if (!selection) return;

    // Restore saved range if selection is lost
    if (savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }

    document.execCommand("insertHTML", false, imageHtml);
    handleBodyInput();
  };

  const handleImageFile = useCallback(async (file: File) => {
    if (!token) return;
    if (!file.type.startsWith("image/")) return;

    setIsUploading(true);
    try {
      const { url, fileId, filePath } = await noteService.uploadImage(file, token);

      // Insert image with data attributes so cleanup can find fileId later
      const imageHtml = `
        <img
          src="${url}"
          data-file-id="${fileId}"
          data-file-path="${filePath}"
          alt="note image"
          class="notion-image"
          style="max-width:100%;border-radius:8px;margin:8px 0;display:block;"
        />
      `;
      insertImageAtCursor(imageHtml);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  }, [token]);

  // Triggered when user selects a file via the hidden input
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageFile(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  // Triggered from slash menu "Image" item
  const triggerImageUpload = () => {
    saveRange();
    fileInputRef.current?.click();
  };

  // Paste image directly into editor
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (!imageItem) return; // let default paste handle text

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    await handleImageFile(file);
  }, [handleImageFile]);

  // ── Existing handlers (unchanged) ──────────────────────────────────────────

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pre = (e.target as HTMLElement)?.closest("pre") as HTMLPreElement | null;
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
    } catch { /* ignore */ }
  };

  const updateActiveMarks = useCallback(() => {
    setActiveMarks({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      block: String(document.queryCommandValue("formatBlock") || "p")
        .replace(/[<>]/g, "").toLowerCase(),
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
    const rect = selection.getRangeAt(0).cloneRange().getBoundingClientRect();
    const container = editorRef.current?.parentElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    setSlashIndex(0);
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
    node.textContent = text.slice(0, index) + text.slice(offset);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!slashMenu.open) return;
      if (slashMenuRef.current?.contains(event.target as Node)) return;
      closeSlashMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashMenu.open]);

  const applyCommand = (command: string, value?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    handleBodyInput();
    updateActiveMarks();
  };

  const applyBlock = (tag: string) => applyCommand("formatBlock", tag);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!slashMenu.open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashIndex((i) => (i + 1) % SLASH_ITEMS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashIndex((i) => (i - 1 + SLASH_ITEMS.length) % SLASH_ITEMS.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = SLASH_ITEMS[slashIndex];
      if (item.label === "Image") {
        applySlashCommand(triggerImageUpload);
      } else {
        applySlashCommand(() => item.action(applyBlock, applyCommand));
      }
    } else if (e.key === "Escape") {
      closeSlashMenu();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 👇 Hidden file input — triggered by slash menu or toolbar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex-1 overflow-hidden pb-10 px-4">
        <div className="relative mx-auto flex flex-col rounded-3xl bg-white/85 px-5 py-6 ring-1 ring-white/70 backdrop-blur sm:px-8 sm:py-8 dark:bg-zinc-900/80 dark:ring-white/10 max-h-[75vh] sm:max-h-[78vh] overflow-hidden">
          <div className="sticky -top-10 z-10 -mx-5 -mt-6 mb-4 px-5 pt-5 pb-4 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8 bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur rounded-2xl border border-white/60 dark:bg-zinc-900/90 dark:border-white/10">
            {(saveStatus === "saving" || saveStatus === "saved") && (
              <div
                aria-live="polite"
                className="absolute right-5 top-5 sm:right-7 sm:top-7 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-zinc-950/80 dark:ring-white/10"
              >
                {saveStatus === "saving" ? (
                  <><Loader2 className="w-3 h-3 animate-spin text-zinc-400" /><span className="text-zinc-500">Saving...</span></>
                ) : (
                  <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Saved</span></>
                )}
              </div>
            )}
            <div className="space-y-1">
              <input
                className={cn(
                  "w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
                  "placeholder:text-zinc-300 dark:placeholder:text-zinc-600",
                  "outline-none border-none resize-none leading-tight",
                  "caret-zinc-900 dark:caret-zinc-100"
                )}
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                spellCheck={false}
                maxLength={TITLE_MAX_LENGTH}
              />
              {title.length >= TITLE_MAX_LENGTH && (
                <p className="text-xs text-amber-600 dark:text-amber-400" role="alert">
                  {TITLE_LIMIT_MESSAGE}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4 group">
              <div className="h-px flex-1 bg-zinc-100 group-hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:group-hover:bg-zinc-700" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2">
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
                {/* Toolbar */}
                <div className="notion-toolbar mb-4 flex flex-wrap items-center gap-1.5">
                  {(["p","h1","h2","blockquote"] as const).map((tag) => (
                    <button key={tag} type="button" onClick={() => applyBlock(tag)} data-active={activeMarks.block === tag}>
                      {{ p: "Text", h1: "H1", h2: "H2", blockquote: "Quote" }[tag]}
                    </button>
                  ))}
                  <span className="mx-1 h-4 w-px bg-zinc-200/70 dark:bg-zinc-800/70" />
                  {(["bold","italic","underline"] as const).map((cmd) => (
                    <button key={cmd} type="button" onClick={() => applyCommand(cmd)} data-active={activeMarks[cmd]}>
                      {{ bold: "Bold", italic: "Italic", underline: "Underline" }[cmd]}
                    </button>
                  ))}
                  <button type="button" onClick={() => applyCommand("insertUnorderedList")} data-active={activeMarks.ul}>Bullet</button>
                  <button type="button" onClick={() => applyCommand("insertOrderedList")} data-active={activeMarks.ol}>Numbered</button>
                  <button type="button" onClick={() => applyBlock("pre")} data-active={activeMarks.block === "pre"}>Code</button>

                  {/* 👇 Image button in toolbar */}
                  <button
                    type="button"
                    onClick={triggerImageUpload}
                    disabled={isUploading}
                    className="flex items-center gap-1"
                    title="Upload image"
                  >
                    {isUploading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <ImageIcon className="w-3 h-3" />
                    }
                    Image
                  </button>
                </div>

                {copyAnchor && (
                  <button type="button" onClick={handleCopyCode} className="notion-copy-btn" style={{ top: copyAnchor.top, left: copyAnchor.left }}>
                    {copyLabel}
                  </button>
                )}

                {/* Slash menu */}
                {slashMenu.open && (
                  <div
                    ref={slashMenuRef}
                    className="notion-slash-menu"
                    style={{ top: slashMenu.top, left: slashMenu.left }}
                  >
                    {SLASH_ITEMS.map((item, i) => (
                      <button
                        key={item.label}
                        type="button"
                        data-active={i === slashIndex}
                        className={cn(
                          "flex items-center gap-2",
                          i === slashIndex && "bg-zinc-100 dark:bg-zinc-800"
                        )}
                        onMouseEnter={() => setSlashIndex(i)}
                        onClick={() => {
                          if (item.label === "Image") {
                            applySlashCommand(triggerImageUpload);
                          } else {
                            applySlashCommand(() => item.action(applyBlock, applyCommand));
                          }
                        }}
                      >
                        {/* 👇 Icon for image item */}
                        {item.label === "Image" && <ImageIcon className="w-3 h-3" />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 👇 Upload overlay */}
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading image...
                    </div>
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
                  onKeyDown={handleEditorKeyDown}
                  onKeyUp={(e) => {
                    if (slashMenu.open) return;
                    if (e.key === "/") openSlashMenu();
                    else updateActiveMarks();
                  }}
                  onMouseUp={updateActiveMarks}
                  onPaste={handlePaste}  // 👈 handles paste from clipboard
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
    </div>
  );
}

function isHtmlEmpty(html: string) {
  return html.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;/gi, " ").replace(/<[^>]*>/g, "").trim().length === 0;
}

function normalizeHtml(html: string) {
  return isHtmlEmpty(html) ? "" : html;
}