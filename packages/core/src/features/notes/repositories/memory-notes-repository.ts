import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";
import type { NotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";

/**
 * In-memory reference implementation of the repository contract. Used by
 * unit/contract tests; never register it in a real app build.
 */
export function createMemoryNotesRepository(): NotesRepository {
  let header: EncryptedVaultHeader | null = null;
  const notes = new Map<string, EncryptedNoteRecord>();

  return {
    getVaultHeader() {
      return Promise.resolve(header);
    },
    saveVaultHeader(next: EncryptedVaultHeader) {
      header = structuredClone(next);
      return Promise.resolve();
    },
    listEncryptedNotes() {
      return Promise.resolve(
        [...notes.values()].map((record) => structuredClone(record))
      );
    },
    getEncryptedNote(id: string) {
      const record = notes.get(id);
      return Promise.resolve(record ? structuredClone(record) : null);
    },
    upsertEncryptedNote(note: EncryptedNoteRecord) {
      notes.set(note.id, structuredClone(note));
      return Promise.resolve();
    },
    deleteEncryptedNote(id: string) {
      notes.delete(id);
      return Promise.resolve();
    },
    clearAllData() {
      header = null;
      notes.clear();
      return Promise.resolve();
    },
  };
}
