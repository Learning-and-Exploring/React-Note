import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotes } from "@features/notes/hooks/use-notes";
import { NotionSidebar, type NavSection } from "@features/notes/components/notion-sidebar";
import { NotionTopbar } from "@features/notes/components/notion-topbar";
import { NotionEditor } from "@features/notes/components/notion-editor";
import { NotionHomepage } from "@features/notes/components/notion-homepage";
import { ChatPanel } from "@features/notes/components/chat-panel";
import { ShareDialog } from "@features/notes/components/share-dialog";
import homeIllustration1 from "@shared/assets/images/home1.png";
import homeIllustration2 from "@shared/assets/images/home2.png";
import favoritesIllustration from "@shared/assets/images/favorith.png";


export function Home() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const {
    currentUser,
    notes,
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
    fetchNextNotesPage,
    hasMoreNotes,
    loadingMoreNotes,
  } = useNotes();

  const workspaceName = currentUser?.name
    ? `${currentUser.name}'s Notebook`
    : "Notebook";

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

    if (section === "notes" && notes.length > 0) {
      void handleSelectNote(notes[0].id);
    }
  };

  const handleNewPage = async () => {
    const created = await createNote({ title: "Untitled", body: "" });
    if (created) {
      await handleSelectNote(created.id);
    }
  };

  // const handleCreate = async (payload: { title: string; body: string }) => {
  //   const created = await createNote({
  //     title: payload.title || "Untitled",
  //     body: payload.body ?? "",
  //   });
  //   if (created) {
  //     await handleSelectNote(created.id);
  //   }
  // };

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
      queueMicrotask(() => {
        setActiveNoteId(null);
        clearSelection();
      });
    }
  }, [activeSection, activeNote, clearSelection]);

  useEffect(() => {
    queueMicrotask(() => {
      setShareLink(null);
      setShareError(null);
    });
  }, [activeNote?.id]);

  // When switching to Notes with existing notes and nothing selected, auto-open the first note
  useEffect(() => {
    if (activeSection === "favorites" && activeNote && !activeNote.isFavorite) {
      queueMicrotask(() => {
        setActiveNoteId(null);
        clearSelection();
      });
    }
  }, [activeSection, activeNote, clearSelection]);

  // Sync URL param to active note selection
  useEffect(() => {
    if (routeNoteId === null) {
      queueMicrotask(() => {
        setActiveNoteId(null);
        clearSelection();
      });
      return;
    }

    queueMicrotask(() => {
      setActiveNoteId(routeNoteId);
      void handleSelectNote(routeNoteId);
    });
  }, [routeNoteId, clearSelection, handleSelectNote]);

  const handleGoToNotes = () => {
    handleSelectSection("notes");
  };

  return (
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
        onLoadMoreNotes={() => void fetchNextNotesPage()}
        hasMoreNotes={hasMoreNotes}
        loadingMoreNotes={loadingMoreNotes}
        onLogout={() => void logout()}
        onOpenChat={() => setChatOpen(true)}
        workspaceName={workspaceName}
        user={currentUser}
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
          onQuickNew={handleNewPage}
        />

        <main className="flex-1 overflow-y-auto">
          {activeNote ? (
            <NotionEditor
              key={activeNote.id}
              note={activeNote}
              onUpdate={handleUpdate}
            />
          ) : activeSection === "notes" ? (
            <div className="h-full overflow-y-auto">
              <NotionHomepage
                workspaceName={workspaceName}
                noteCount={notes.length}
                onNewPage={handleNewPage}
              />
            </div>
          ) : activeSection === "favorites" ? (
            <div className="flex h-full items-start justify-center px-4 pb-12 overflow-y-auto">
              <div className="relative w-full overflow-hidden rounded-3xl bg-white/85 p-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-12 dark:bg-zinc-900/85 dark:ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white/60 to-orange-50 dark:from-amber-950/35 dark:via-zinc-900/40 dark:to-orange-950/20 pointer-events-none" />
                <div className="relative grid gap-10 sm:grid-cols-[0.95fr_1.05fr] items-center">
                  <div className="space-y-4 text-left">
                    <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-100">
                      Favorites
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Star the notes you love to keep them one tap away.
                    </h1>
                    <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                      Pin important docs, lists, and ideas. Favorites collect here automatically so you can jump back in
                      fast—no searching required.
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      Whether it's a meeting agenda, a half-finished idea, or a reference you return to every week—favorites
                      make sure it's never more than a single click away. Your most important work, always within reach.
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-amber-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        ⭐ Quick access
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-amber-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        Sorted for you
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-amber-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        🔖 Always in sync
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-amber-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Always in order</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Favorites are sorted automatically so the most relevant notes surface first, every time.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-amber-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No clutter</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Unstar a note any time to remove it from this view without deleting it.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleGoToNotes}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-amber-600"
                      >
                        Go to Notes
                      </button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Open any note and tap the star to pin it here.
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src={favoritesIllustration}
                      alt="Favorites illustration"
                      className="w-full max-w-xl mx-auto max-h-72 object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.1)] rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-start justify-center px-4 pb-12">
              <div className="relative w-full overflow-hidden rounded-3xl bg-white/85 p-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-12 dark:bg-zinc-900/85 dark:ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white/60 to-blue-50 dark:from-indigo-950/40 dark:via-zinc-900/40 dark:to-blue-950/20 pointer-events-none" />
                <div className="relative flex flex-col gap-8">
                  <div className="grid grid-cols-2 gap-4">
                    <img
                      src={homeIllustration1}
                      alt="Home illustration"
                      className="w-full max-h-72 object-cover rounded-2xl drop-shadow-[0_18px_45px_rgba(0,0,0,0.1)] border"
                    />
                    <img
                      src={homeIllustration2}
                      alt="Home illustration 2"
                      className="w-full max-h-72 object-cover rounded-2xl drop-shadow-[0_18px_45px_rgba(0,0,0,0.1)] border"
                    />
                  </div>
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
                    <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      We believe a notes app should get out of your way. No bloat, no steep learning curve—just a calm,
                      distraction-free space to think, write, and organize at your own pace.
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-indigo-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        ✍️ Clean editor
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-indigo-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        🔗 Instant sharing
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-indigo-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        🌙 Dark mode
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-zinc-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Shareable links</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Create view-only links for any note in one click.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-zinc-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stay organized</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Favorites and quick search keep important pages close.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-zinc-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Works everywhere</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Fully responsive across desktop, tablet, and mobile—your notes follow you.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-zinc-100 shadow-sm dark:bg-white/5 dark:ring-white/10">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI-powered chat</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Ask questions about your notes or brainstorm new ideas with the built-in chat panel.
                        </p>
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
  );
}
