import type { NoteDocument } from "@workspace/core/features/notes/domain/note-types";
import { create } from "zustand";

/**
 * Floating sticky-note widgets (desktop only).
 *
 * The vault key never leaves the main window: sticky windows are thin views
 * that receive an already-decrypted snapshot over Tauri events and send
 * edits back, and the main window persists them through the regular
 * encrypted notes store. This module only holds the platform adapter and
 * the event protocol shared by both sides — no Tauri imports, so the core
 * package stays platform-neutral and the web build simply never registers
 * an adapter (hiding the feature).
 */

export const STICKY_LABEL_PREFIX = "sticky-";

export const STICKY_EVENTS = {
  /** sticky → main: window mounted, requests its note snapshot. */
  ready: "sticky-ready",
  /** main → sticky window: decrypted note snapshot. */
  note: "sticky-note",
  /** main → sticky window: note unavailable (locked/trashed), close. */
  close: "sticky-close",
  /** sticky → main: content edited. */
  update: "sticky-update",
  /** sticky → main: title edited. */
  title: "sticky-title",
} as const;

export interface StickyReadyPayload {
  label: string;
  noteId: string;
}

export interface StickySnapshotPayload {
  content: NoteDocument;
  id: string;
  title: string;
}

export interface StickyUpdatePayload {
  content: NoteDocument;
  noteId: string;
}

export interface StickyTitlePayload {
  noteId: string;
  title: string;
}

export interface StickyNotesAdapter {
  /** Opens (or focuses) the floating widget window for a note. */
  openSticky(noteId: string): Promise<void>;
}

interface StickyAdapterState {
  adapter: StickyNotesAdapter | null;
  setAdapter(adapter: StickyNotesAdapter | null): void;
}

export const useStickyAdapterStore = create<StickyAdapterState>()((set) => ({
  adapter: null,
  setAdapter: (adapter) => set({ adapter }),
}));
