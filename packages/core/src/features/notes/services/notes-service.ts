import { randomId } from "@workspace/core/features/notes/crypto/encoding";
import {
  decryptNote,
  encryptNote,
} from "@workspace/core/features/notes/crypto/note-crypto";
import {
  CorruptDataError,
  StorageError,
} from "@workspace/core/features/notes/domain/errors";
import type {
  DecryptedNote,
  NoteDocument,
} from "@workspace/core/features/notes/domain/note-types";
import { getNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { getSessionDataKey } from "@workspace/core/features/notes/services/session-key-service";

export interface DecryptAllResult {
  corruptedIds: string[];
  notes: DecryptedNote[];
}

/**
 * Decrypts the whole vault after unlock. Records that fail authentication
 * or schema validation are reported as corrupted, never silently dropped —
 * and never deleted, so no data is destroyed by a transient bug.
 *
 * Decryption runs in batches with a yield to the event loop between them,
 * keeping the main thread responsive for large vaults.
 */
export async function decryptAllNotes(): Promise<DecryptAllResult> {
  let records: Awaited<
    ReturnType<ReturnType<typeof getNotesRepository>["listEncryptedNotes"]>
  >;
  try {
    records = await getNotesRepository().listEncryptedNotes();
  } catch {
    throw new StorageError();
  }
  const dataKey = getSessionDataKey();
  const notes: DecryptedNote[] = [];
  const corruptedIds: string[] = [];
  const BATCH_SIZE = 25;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (record) => {
        try {
          return await decryptNote(record, dataKey);
        } catch (error) {
          if (error instanceof CorruptDataError) {
            corruptedIds.push(record.id);
            return null;
          }
          throw error;
        }
      })
    );
    for (const note of results) {
      if (note) {
        notes.push(note);
      }
    }
    if (i + BATCH_SIZE < records.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return { notes, corruptedIds };
}

export async function persistNote(note: DecryptedNote): Promise<void> {
  const record = await encryptNote(note, getSessionDataKey());
  try {
    await getNotesRepository().upsertEncryptedNote(record);
  } catch {
    throw new StorageError();
  }
}

export async function removeNotePermanently(id: string): Promise<void> {
  try {
    await getNotesRepository().deleteEncryptedNote(id);
  } catch {
    throw new StorageError();
  }
}

export function buildNewNote(
  parentId: string | null,
  title = "",
  content: NoteDocument = []
): DecryptedNote {
  const now = new Date().toISOString();
  return {
    id: randomId(),
    title,
    content,
    parentId,
    tags: [],
    isFavorite: false,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Builds a single paragraph block for programmatically-authored content. */
export function paragraphBlock(text: string): NoteDocument[number] {
  return {
    children: [{ text }],
    type: "p",
  };
}
