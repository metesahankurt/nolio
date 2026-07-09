import type {
  DecryptedNote,
  NoteDocument,
} from "@workspace/core/features/notes/domain/note-types";

/**
 * In-memory search over decrypted notes. The index exists only while the
 * vault is unlocked and only in this module's memory — it is never written
 * to disk, so no plaintext titles or snippets outlive a lock.
 */

export interface SearchResult {
  noteId: string;
  snippet: string;
  title: string;
}

interface IndexEntry {
  noteId: string;
  text: string;
  textLower: string;
  title: string;
  titleLower: string;
}

let index: IndexEntry[] = [];

function collectText(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, out);
    }
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") {
    out.push(record.text);
  }
  if ("content" in record) {
    collectText(record.content, out);
  }
  if ("children" in record) {
    collectText(record.children, out);
  }
}

export function extractPlainText(document: NoteDocument): string {
  const parts: string[] = [];
  collectText(document, parts);
  return parts.join(" ");
}

export function buildSearchIndex(notes: DecryptedNote[]): void {
  index = notes
    .filter((note) => note.deletedAt === null)
    .map((note) => {
      const text = extractPlainText(note.content);
      return {
        noteId: note.id,
        title: note.title,
        titleLower: note.title.toLowerCase(),
        text,
        textLower: text.toLowerCase(),
      };
    });
}

export function updateSearchIndexEntry(note: DecryptedNote): void {
  index = index.filter((entry) => entry.noteId !== note.id);
  if (note.deletedAt === null) {
    const text = extractPlainText(note.content);
    index.push({
      noteId: note.id,
      title: note.title,
      titleLower: note.title.toLowerCase(),
      text,
      textLower: text.toLowerCase(),
    });
  }
}

export function removeSearchIndexEntry(noteId: string): void {
  index = index.filter((entry) => entry.noteId !== noteId);
}

const SNIPPET_RADIUS = 40;
const MAX_RESULTS = 20;

export function searchNotes(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const results: SearchResult[] = [];
  for (const entry of index) {
    const titleHit = entry.titleLower.includes(q);
    const textPos = entry.textLower.indexOf(q);
    if (!titleHit && textPos === -1) {
      continue;
    }
    let snippet = "";
    if (textPos >= 0) {
      const start = Math.max(0, textPos - SNIPPET_RADIUS);
      const end = Math.min(
        entry.text.length,
        textPos + q.length + SNIPPET_RADIUS
      );
      snippet = `${start > 0 ? "…" : ""}${entry.text.slice(start, end)}${end < entry.text.length ? "…" : ""}`;
    }
    results.push({ noteId: entry.noteId, title: entry.title, snippet });
    if (results.length >= MAX_RESULTS) {
      break;
    }
  }
  return results;
}

export function clearSearchIndex(): void {
  index = [];
}
