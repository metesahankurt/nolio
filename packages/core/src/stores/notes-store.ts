import type {
  DecryptedNote,
  NoteDocument,
} from "@workspace/core/features/notes/domain/note-types";
import {
  buildNewNote,
  decryptAllNotes,
  paragraphBlock,
  persistNote,
  removeNotePermanently,
} from "@workspace/core/features/notes/services/notes-service";
import {
  buildSearchIndex,
  removeSearchIndexEntry,
  updateSearchIndexEntry,
} from "@workspace/core/features/notes/services/search-service";
import { create } from "zustand";

export type NotesView =
  | "note"
  | "all"
  | "favorites"
  | "recent"
  | "trash"
  | "settings";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface WelcomeNoteSpec {
  paragraphs: string[];
  title: string;
}

interface NotesState {
  bootstrapNewVault(welcome?: WelcomeNoteSpec): Promise<void>;
  corruptedCount: number;
  createNote(
    parentId?: string | null,
    options?: { select?: boolean }
  ): Promise<string>;
  deletePermanently(id: string): Promise<void>;
  flushPendingSaves(): Promise<void>;

  loadAll(): Promise<void>;
  moveToTrash(id: string): void;
  /** Decrypted notes by id. Cleared completely on lock. */
  notes: Record<string, DecryptedNote>;
  reset(): void;
  restoreFromTrash(id: string): void;
  saveStatus: SaveStatus;
  selectedNoteId: string | null;
  selectNote(id: string | null): void;
  setView(view: NotesView): void;
  toggleFavorite(id: string): void;
  updateNoteContent(id: string, content: NoteDocument): void;
  updateNoteIcon(id: string, icon: string | undefined): void;
  updateNoteTitle(id: string, title: string): void;
  view: NotesView;
}

/**
 * Debounced encrypted persistence. Content changes update the in-memory
 * store immediately and schedule an encrypt+write per note; the timer map
 * lives in module scope so `flushPendingSaves` can drain it before a lock
 * or a note switch. A failed save never overwrites the previous successful
 * ciphertext (upsert either fully replaces the row or throws).
 */
const SAVE_DEBOUNCE_MS = 600;
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

function collectDescendantIds(
  notes: Record<string, DecryptedNote>,
  rootId: string
): string[] {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    for (const note of Object.values(notes)) {
      if (note.parentId === current) {
        ids.push(note.id);
        queue.push(note.id);
      }
    }
  }
  return ids;
}

export const useNotesStore = create<NotesState>()((set, get) => {
  function persistNow(id: string): void {
    const note = get().notes[id];
    if (!note) {
      return;
    }
    set({ saveStatus: "saving" });
    persistNote(note)
      .then(() => {
        if (pendingSaves.size === 0) {
          set({ saveStatus: "saved" });
        }
        updateSearchIndexEntry(note);
      })
      .catch(() => {
        set({ saveStatus: "error" });
      });
  }

  function scheduleSave(id: string): void {
    const existing = pendingSaves.get(id);
    if (existing) {
      clearTimeout(existing);
    }
    pendingSaves.set(
      id,
      setTimeout(() => {
        pendingSaves.delete(id);
        persistNow(id);
      }, SAVE_DEBOUNCE_MS)
    );
  }

  function updateNote(
    id: string,
    patch: Partial<DecryptedNote>,
    options: { debounce: boolean } = { debounce: false }
  ): void {
    const note = get().notes[id];
    if (!note) {
      return;
    }
    const updated: DecryptedNote = {
      ...note,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ notes: { ...state.notes, [id]: updated } }));
    if (options.debounce) {
      scheduleSave(id);
    } else {
      persistNow(id);
    }
  }

  return {
    notes: {},
    selectedNoteId: null,
    view: "note",
    saveStatus: "idle",
    corruptedCount: 0,

    async loadAll() {
      const { notes, corruptedIds } = await decryptAllNotes();
      const byId: Record<string, DecryptedNote> = {};
      for (const note of notes) {
        byId[note.id] = note;
      }
      buildSearchIndex(notes);
      // Never auto-restore the previously open note: nothing about the last
      // session (including which note was open) is persisted while locked.
      const firstRoot = notes
        .filter((n) => n.deletedAt === null && n.parentId === null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      set({
        notes: byId,
        corruptedCount: corruptedIds.length,
        selectedNoteId: firstRoot?.id ?? null,
        view: "note",
        saveStatus: "idle",
      });
    },

    async bootstrapNewVault(welcome?: WelcomeNoteSpec) {
      const content = welcome
        ? welcome.paragraphs.map((text) => paragraphBlock(text))
        : [];
      const note = buildNewNote(null, welcome?.title ?? "", content);
      await persistNote(note);
      set({
        notes: { [note.id]: note },
        selectedNoteId: note.id,
        view: "note",
        saveStatus: "idle",
        corruptedCount: 0,
      });
      buildSearchIndex([note]);
    },

    async createNote(parentId: string | null = null, options = {}) {
      const { select = true } = options;
      const note = buildNewNote(parentId);
      await persistNote(note);
      set((state) => ({
        notes: { ...state.notes, [note.id]: note },
        ...(select ? { selectedNoteId: note.id, view: "note" as const } : {}),
      }));
      updateSearchIndexEntry(note);
      return note.id;
    },

    updateNoteContent(id, content) {
      updateNote(id, { content }, { debounce: true });
    },

    updateNoteTitle(id, title) {
      updateNote(id, { title }, { debounce: true });
    },

    updateNoteIcon(id, icon) {
      updateNote(id, { icon });
    },

    toggleFavorite(id) {
      const note = get().notes[id];
      if (note) {
        updateNote(id, { isFavorite: !note.isFavorite });
      }
    },

    moveToTrash(id) {
      const deletedAt = new Date().toISOString();
      // Children follow their parent into the trash in the same operation.
      const ids = [id, ...collectDescendantIds(get().notes, id)];
      for (const noteId of ids) {
        updateNote(noteId, { deletedAt });
        removeSearchIndexEntry(noteId);
      }
      if (get().selectedNoteId && ids.includes(get().selectedNoteId ?? "")) {
        set({ selectedNoteId: null });
      }
    },

    restoreFromTrash(id) {
      const ids = [id, ...collectDescendantIds(get().notes, id)];
      for (const noteId of ids) {
        updateNote(noteId, { deletedAt: null });
        const note = get().notes[noteId];
        if (note) {
          updateSearchIndexEntry(note);
        }
      }
      // If the restored note's parent is still trashed, lift it to root.
      const note = get().notes[id];
      if (note?.parentId) {
        const parent = get().notes[note.parentId];
        if (!parent || parent.deletedAt !== null) {
          updateNote(id, { parentId: null });
        }
      }
    },

    async deletePermanently(id) {
      const ids = [id, ...collectDescendantIds(get().notes, id)];
      for (const noteId of ids) {
        const timer = pendingSaves.get(noteId);
        if (timer) {
          clearTimeout(timer);
          pendingSaves.delete(noteId);
        }
        await removeNotePermanently(noteId);
        removeSearchIndexEntry(noteId);
      }
      set((state) => {
        const next = { ...state.notes };
        for (const noteId of ids) {
          delete next[noteId];
        }
        return {
          notes: next,
          selectedNoteId:
            state.selectedNoteId && ids.includes(state.selectedNoteId)
              ? null
              : state.selectedNoteId,
        };
      });
    },

    selectNote(id) {
      // Flush the outgoing note's pending save so switching notes never
      // loses edits or carries stale state into the next editor instance.
      get()
        .flushPendingSaves()
        .catch(() => {
          set({ saveStatus: "error" });
        });
      set({ selectedNoteId: id, view: "note" });
    },

    setView(view) {
      set({ view });
    },

    async flushPendingSaves() {
      const ids = [...pendingSaves.keys()];
      for (const [, timer] of pendingSaves) {
        clearTimeout(timer);
      }
      pendingSaves.clear();
      await Promise.all(
        ids.map(async (id) => {
          const note = get().notes[id];
          if (note) {
            await persistNote(note);
            updateSearchIndexEntry(note);
          }
        })
      );
      if (ids.length > 0) {
        set({ saveStatus: "saved" });
      }
    },

    reset() {
      for (const [, timer] of pendingSaves) {
        clearTimeout(timer);
      }
      pendingSaves.clear();
      set({
        notes: {},
        selectedNoteId: null,
        view: "note",
        saveStatus: "idle",
        corruptedCount: 0,
      });
    },
  };
});
