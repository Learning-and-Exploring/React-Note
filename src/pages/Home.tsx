import { useState, useCallback, useMemo, useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { NotionSidebar, type NavSection } from "@/components/notion-sidebar";
import { NotionTopbar } from "@/components/notion-topbar";
import { NotionEditor } from "@/components/notion-editor";
import { NotionHomepage } from "@/components/notion-homepage";
import { NewPageDialog } from "@/components/new-page-dialog";
import { ChatPanel } from "@/components/chat-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShareDialog } from "@/components/share-dialog";


export function Home() {
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleSelectNote = useCallback(
    async (id: number) => {
      setActiveNoteId(id);
      await fetchNoteById(id);
    },
    [fetchNoteById]
  );

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    setActiveNoteId(null);
    clearSelection();
  };

  const handleNewPage = () => setDialogOpen(true);

  const handleCreate = async (payload: { title: string; body: string }) => {
    await createNote(payload);
    // Select the newly-created note (it's pushed to front of notes by context)
    // We need a small tick to let the state update
    setTimeout(() => {
      const first = notes[0];
      if (first) void handleSelectNote(first.id);
    }, 100);
  };

  const handleDelete = async (id: number) => {
    await deleteNote(id);
    setActiveNoteId(null);
    clearSelection();
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
            ) : (
              <NotionHomepage
                workspaceName={workspaceName}
                noteCount={notes.length}
                onNewPage={handleNewPage}
              />
            )}
          </main>
        </div>

        {/* New Page Dialog */}
        <NewPageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreate={handleCreate}
          loading={loading}
        />

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
