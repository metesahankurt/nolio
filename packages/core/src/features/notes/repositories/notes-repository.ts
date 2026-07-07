import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";

/**
 * Platform-agnostic storage contract. Implementations live in the apps
 * (IndexedDB on web, SQLite via Tauri on native) and are injected at app
 * startup — packages/core never touches a concrete storage API.
 *
 * Repositories only ever see encrypted records: the vault header and
 * `EncryptedNoteRecord`s (id, versions, IV, ciphertext). No plaintext note
 * data may pass through this interface.
 */
export interface NotesRepository {
  clearAllData(): Promise<void>;
  deleteEncryptedNote(id: string): Promise<void>;
  getEncryptedNote(id: string): Promise<EncryptedNoteRecord | null>;
  getVaultHeader(): Promise<EncryptedVaultHeader | null>;

  listEncryptedNotes(): Promise<EncryptedNoteRecord[]>;
  saveVaultHeader(header: EncryptedVaultHeader): Promise<void>;
  upsertEncryptedNote(note: EncryptedNoteRecord): Promise<void>;
}

let activeRepository: NotesRepository | null = null;

/**
 * Called once by the platform provider (web or native) during startup.
 * Stores and services resolve the repository through this registry so they
 * stay platform-blind.
 */
export function setNotesRepository(repository: NotesRepository): void {
  activeRepository = repository;
}

export function getNotesRepository(): NotesRepository {
  if (!activeRepository) {
    throw new Error(
      "NotesRepository has not been registered. Wrap the app in a platform notes provider."
    );
  }
  return activeRepository;
}

export function hasNotesRepository(): boolean {
  return activeRepository !== null;
}
