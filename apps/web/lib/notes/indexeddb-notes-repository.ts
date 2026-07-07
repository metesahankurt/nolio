import { StorageError } from "@workspace/core/features/notes/domain/errors";
import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";
import type { NotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";

/**
 * IndexedDB-backed repository for the web/PWA build. Stores only encrypted
 * data: the vault header and encrypted note records. Uses raw IndexedDB
 * (no wrapper dependency) with promisified requests.
 *
 * Private-browsing modes and storage quota problems surface as
 * StorageError, which the vault store maps to a user-visible error state.
 */

const DB_NAME = "catalyzer-notes";
const DB_VERSION = 1;
const VAULT_STORE = "vault";
const NOTES_STORE = "encrypted_notes";
const VAULT_HEADER_KEY = "header";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageError());
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new StorageError());
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        db.createObjectStore(VAULT_STORE);
      }
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageError());
    request.onblocked = () => reject(new StorageError());
  });
}

export async function createIndexedDbNotesRepository(): Promise<NotesRepository> {
  const db = await openDatabase();

  function store(name: string, mode: IDBTransactionMode): IDBObjectStore {
    return db.transaction(name, mode).objectStore(name);
  }

  return {
    async getVaultHeader() {
      const result = await requestToPromise(
        store(VAULT_STORE, "readonly").get(VAULT_HEADER_KEY)
      );
      return (result as EncryptedVaultHeader | undefined) ?? null;
    },

    async saveVaultHeader(header: EncryptedVaultHeader) {
      await requestToPromise(
        store(VAULT_STORE, "readwrite").put(header, VAULT_HEADER_KEY)
      );
    },

    async listEncryptedNotes() {
      const result = await requestToPromise(
        store(NOTES_STORE, "readonly").getAll()
      );
      return result as EncryptedNoteRecord[];
    },

    async getEncryptedNote(id: string) {
      const result = await requestToPromise(
        store(NOTES_STORE, "readonly").get(id)
      );
      return (result as EncryptedNoteRecord | undefined) ?? null;
    },

    async upsertEncryptedNote(note: EncryptedNoteRecord) {
      await requestToPromise(store(NOTES_STORE, "readwrite").put(note));
    },

    async deleteEncryptedNote(id: string) {
      await requestToPromise(store(NOTES_STORE, "readwrite").delete(id));
    },

    async clearAllData() {
      await requestToPromise(store(VAULT_STORE, "readwrite").clear());
      await requestToPromise(store(NOTES_STORE, "readwrite").clear());
    },
  };
}
