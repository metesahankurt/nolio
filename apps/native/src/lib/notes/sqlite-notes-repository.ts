import Database from "@tauri-apps/plugin-sql";
import { StorageError } from "@workspace/core/features/notes/domain/errors";
import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import { encryptedVaultHeaderSchema } from "@workspace/core/features/notes/domain/schemas";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";
import type { NotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";

/**
 * SQLite-backed repository for desktop and mobile (Tauri SQL plugin).
 * The schema is created by Rust-side migrations (see src-tauri/src/lib.rs).
 * Every statement is parameterized — user data never lands in SQL strings.
 * Only encrypted material is stored.
 */

const DB_URL = "sqlite:notes.db";
const VAULT_HEADER_KEY = "vault_header";

interface MetadataRow {
  key: string;
  value: string;
}
interface NoteRow {
  ciphertext: string;
  id: string;
  iv: string;
  version: number;
}

export async function createSqliteNotesRepository(): Promise<NotesRepository> {
  let db: Database;
  try {
    db = await Database.load(DB_URL);
  } catch {
    throw new StorageError();
  }

  return {
    async getVaultHeader() {
      let rows: MetadataRow[];
      try {
        rows = await db.select<MetadataRow[]>(
          "SELECT key, value FROM vault_metadata WHERE key = $1",
          [VAULT_HEADER_KEY]
        );
      } catch {
        throw new StorageError();
      }
      const raw = rows[0]?.value;
      if (!raw) {
        return null;
      }
      const parsed = encryptedVaultHeaderSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        throw new StorageError();
      }
      return parsed.data;
    },

    async saveVaultHeader(header: EncryptedVaultHeader) {
      try {
        await db.execute(
          "INSERT INTO vault_metadata (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          [VAULT_HEADER_KEY, JSON.stringify(header)]
        );
      } catch {
        throw new StorageError();
      }
    },

    async listEncryptedNotes() {
      try {
        const rows = await db.select<NoteRow[]>(
          "SELECT id, version, iv, ciphertext FROM encrypted_notes"
        );
        return rows.map(rowToRecord);
      } catch {
        throw new StorageError();
      }
    },

    async getEncryptedNote(id: string) {
      try {
        const rows = await db.select<NoteRow[]>(
          "SELECT id, version, iv, ciphertext FROM encrypted_notes WHERE id = $1",
          [id]
        );
        const row = rows[0];
        return row ? rowToRecord(row) : null;
      } catch {
        throw new StorageError();
      }
    },

    async upsertEncryptedNote(note: EncryptedNoteRecord) {
      try {
        await db.execute(
          "INSERT INTO encrypted_notes (id, version, iv, ciphertext) VALUES ($1, $2, $3, $4) ON CONFLICT(id) DO UPDATE SET version = excluded.version, iv = excluded.iv, ciphertext = excluded.ciphertext",
          [note.id, note.encryptionVersion, note.iv, note.ciphertext]
        );
      } catch {
        throw new StorageError();
      }
    },

    async deleteEncryptedNote(id: string) {
      try {
        await db.execute("DELETE FROM encrypted_notes WHERE id = $1", [id]);
      } catch {
        throw new StorageError();
      }
    },

    async clearAllData() {
      try {
        await db.execute("DELETE FROM encrypted_notes");
        await db.execute("DELETE FROM vault_metadata");
      } catch {
        throw new StorageError();
      }
    },
  };
}

function rowToRecord(row: NoteRow): EncryptedNoteRecord {
  return {
    id: row.id,
    encryptionVersion: 1,
    iv: row.iv,
    ciphertext: row.ciphertext,
  };
}
