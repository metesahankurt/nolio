import type {
  BlockNoteDocument,
  DecryptedNote,
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

interface InlineContentLike {
  content?: unknown;
  text?: string;
  type?: string;
}

function collectInlineText(content: unknown, out: string[]): void {
  if (!Array.isArray(content)) {
    return;
  }
  for (const item of content as InlineContentLike[]) {
    if (typeof item?.text === "string") {
      out.push(item.text);
    } else if (item && typeof item === "object" && "content" in item) {
      collectInlineText(item.content, out);
    }
  }
}

export function extractPlainText(document: BlockNoteDocument): string {
  const parts: string[] = [];
  const walk = (blocks: BlockNoteDocument): void => {
    for (const block of blocks) {
      collectInlineText(block.content, parts);
      walk(block.children);
    }
  };
  walk(document);
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
