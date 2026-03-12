import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotes } from "@/hooks/use-notes";
import { NotionSidebar, type NavSection } from "@/components/notion-sidebar";
import { NotionTopbar } from "@/components/notion-topbar";
import { NotionEditor } from "@/components/notion-editor";
import { NotionHomepage } from "@/components/notion-homepage";
import { ChatPanel } from "@/components/chat-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShareDialog } from "@/components/share-dialog";


export function Home() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const {
    notes,
    loading,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    fetchNoteById,
    clearSelection,
    toggleFavorite,
    shareNote,
    unshareNote,
    logout,
  } = useNotes();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>("home");
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const routeNoteId = useMemo(() => {
    if (!routeId) return null;
    const parsed = Number(routeId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [routeId]);

  const handleSelectNote = useCallback(
    async (id: number) => {
      setActiveNoteId(id);
      navigate(`/notes/${id}`);
      await fetchNoteById(id);
    },
    [fetchNoteById, navigate]
  );

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    setActiveNoteId(null);
    clearSelection();
    navigate("/");
  };

  const handleNewPage = async () => {
    const created = await createNote({ title: "Untitled", body: "" });
    if (created) {
      await handleSelectNote(created.id);
    }
  };

  const handleCreate = async (payload: { title: string; body: string }) => {
    const created = await createNote({
      title: payload.title || "Untitled",
      body: payload.body ?? "",
    });
    if (created) {
      await handleSelectNote(created.id);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteNote(id);
    setActiveNoteId(null);
    clearSelection();
    navigate("/");
  };

  const handleUpdate = useCallback(
    async (id: number, payload: { title?: string; body?: string }) => {
      await updateNote(id, payload);
    },
    [updateNote]
  );

  // Resolve the active note — prefer selectedNote if IDs match, otherwise fall back to notes list
  const activeNote =
    activeNoteId !== null
      ? selectedNote?.id === activeNoteId
        ? selectedNote
        : notes.find((n) => n.id === activeNoteId) ?? null
      : null;

  const visibleNotes = useMemo(
    () =>
      activeSection === "favorites"
        ? notes.filter((note) => note.isFavorite)
        : notes,
    [notes, activeSection]
  );

  const handleToggleFavorite = useCallback(
    async (id: number) => {
      await toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleShare = useCallback(async () => {
    if (!activeNote) return;
    setShareLoading(true);
    setShareError(null);
    const link = await shareNote(activeNote.id);
    if (link) {
      setShareLink(link);
      setShareDialogOpen(true);
    } else {
      setShareError("Could not generate a share link. Please try again.");
      setShareDialogOpen(true);
    }
    setShareLoading(false);
  }, [activeNote, shareNote]);

  const handleUnshare = useCallback(async () => {
    if (!activeNote) return;
    setShareLoading(true);
    await unshareNote(activeNote.id);
    setShareLink(null);
    setShareLoading(false);
  }, [activeNote, unshareNote]);

  useEffect(() => {
    if (activeSection === "favorites" && activeNote && !activeNote.isFavorite) {
      setActiveNoteId(null);
      clearSelection();
    }
  }, [activeSection, activeNote, clearSelection]);

  useEffect(() => {
    setShareLink(null);
    setShareError(null);
  }, [activeNote?.id]);

  // Sync URL param to active note selection
  useEffect(() => {
    if (routeNoteId === null) {
      setActiveNoteId(null);
      clearSelection();
      return;
    }

    setActiveNoteId(routeNoteId);
    void handleSelectNote(routeNoteId);
  }, [routeNoteId, clearSelection, handleSelectNote]);

  const workspaceName = "My Workspace";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-[#f2f2f7] dark:bg-zinc-950">
        {/* Sidebar */}
        <NotionSidebar
          notes={visibleNotes}
          activeNoteId={activeNoteId}
          activeSection={activeSection}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          onSelectNote={(id) => void handleSelectNote(id)}
          onSelectSection={handleSelectSection}
          onNewPage={handleNewPage}
          onLogout={() => void logout()}
          onOpenChat={() => setChatOpen(true)}
          workspaceName={workspaceName}
        />

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0">
          <NotionTopbar
            activeNote={activeNote}
            workspaceName={workspaceName}
            isSidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onDeleteNote={(id) => void handleDelete(id)}
            onToggleFavorite={activeNote ? () => void handleToggleFavorite(activeNote.id) : undefined}
            isFavorited={activeNote?.isFavorite}
            onShareNote={handleShare}
            shareLoading={shareLoading}
            onOpenChat={() => setChatOpen(true)}
          />

          <main className="flex-1 overflow-y-auto">
            {activeNote ? (
              <NotionEditor
                key={activeNote.id}
                note={activeNote}
                onUpdate={handleUpdate}
              />
            ) : activeSection === "notes" ? (
              <NotionHomepage
                workspaceName={workspaceName}
                noteCount={notes.length}
                onNewPage={handleNewPage}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 pb-10">
                <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/85 p-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-10 dark:bg-zinc-900/85 dark:ring-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white/60 to-blue-50 dark:from-indigo-950/40 dark:via-zinc-900/40 dark:to-blue-950/20 pointer-events-none" />
                  <div className="relative grid gap-8 sm:grid-cols-[1.1fr_0.9fr] items-center">
                    <div className="space-y-4 text-left">
                      <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-100">
                        About Us
                      </p>
                      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Built for fast, focused note-taking and effortless sharing.
                      </h1>
                      <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                        Capture ideas with a clean editor, keep favorites close, and share view-only links when you need to
                        loop others in. Everything stays in sync, so you can pick up right where you left off.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-zinc-200 shadow-sm dark:bg-white/5 dark:ring-white/10">
                          Instant save
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-zinc-200 shadow-sm dark:bg-white/5 dark:ring-white/10">
                          Share links
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-zinc-200 shadow-sm dark:bg-white/5 dark:ring-white/10">
                          Favorites
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] ring-1 ring-zinc-100 overflow-hidden dark:bg-zinc-950 dark:ring-white/10">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                          <span className="text-sm font-semibold">Note Preview</span>
                          <span className="text-xs text-white/80">View-only</span>
                        </div>
                        <div className="p-5 space-y-3 text-left">
                          <div className="h-4 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          <div className="h-4 w-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          <div className="space-y-2 pt-1">
                            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-900" />
                            <div className="h-3 w-5/6 rounded-full bg-zinc-100 dark:bg-zinc-900" />
                            <div className="h-3 w-4/6 rounded-full bg-zinc-100 dark:bg-zinc-900" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* New Page Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={shareLink}
          loading={shareLoading}
          noteTitle={activeNote?.title}
          error={shareError}
          onUnshare={handleUnshare}
        />

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
