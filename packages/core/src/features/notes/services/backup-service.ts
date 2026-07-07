import {
  CorruptDataError,
  StorageError,
} from "@workspace/core/features/notes/domain/errors";
import {
  encryptedNoteRecordSchema,
  encryptedVaultHeaderSchema,
} from "@workspace/core/features/notes/domain/schemas";
import { getNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { z } from "zod";

/**
 * Encrypted vault backup.
 *
 * Everything persisted by the repository is already ciphertext (the wrapped
 * vault header and per-note AES-GCM records), so a backup is just those
 * bytes wrapped in an envelope. The file contains NO plaintext and NO key
 * material: restoring it still requires the master password that produced
 * the vault. This works identically on web and in the Tauri WebView using
 * only the browser File APIs, so no filesystem permissions are needed.
 */

const BACKUP_FORMAT = "catalyzer-notes-backup";
const BACKUP_VERSION = 1;

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  backupVersion: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  header: encryptedVaultHeaderSchema,
  notes: z.array(encryptedNoteRecordSchema),
});

export type VaultBackup = z.infer<typeof backupSchema>;

export async function buildVaultBackup(): Promise<VaultBackup> {
  const repository = getNotesRepository();
  let header: Awaited<ReturnType<typeof repository.getVaultHeader>>;
  let notes: Awaited<ReturnType<typeof repository.listEncryptedNotes>>;
  try {
    header = await repository.getVaultHeader();
    notes = await repository.listEncryptedNotes();
  } catch {
    throw new StorageError();
  }
  if (!header) {
    throw new StorageError();
  }
  return {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    header,
    notes,
  };
}

/** Suggested filename for a downloaded backup. */
export function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `catalyzer-notes-backup-${stamp}.json`;
}

export function parseVaultBackup(raw: string): VaultBackup {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new CorruptDataError();
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    throw new CorruptDataError();
  }
  return parsed.data;
}

/**
 * Replaces the current vault with the backup's contents. Note ciphertexts
 * are validated (shape only — they still require the backup's password to
 * decrypt) before anything is written. The caller must lock the vault
 * afterwards so the user unlocks with the backup's master password.
 */
export async function restoreVaultBackup(backup: VaultBackup): Promise<void> {
  const repository = getNotesRepository();
  try {
    await repository.clearAllData();
    await repository.saveVaultHeader(backup.header);
    for (const note of backup.notes) {
      await repository.upsertEncryptedNote(note);
    }
  } catch {
    throw new StorageError();
  }
}
