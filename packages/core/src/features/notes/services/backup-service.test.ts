import { CorruptDataError } from "@workspace/core/features/notes/domain/errors";
import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";
import { createMemoryNotesRepository } from "@workspace/core/features/notes/repositories/memory-notes-repository";
import { setNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import {
  buildVaultBackup,
  parseVaultBackup,
  restoreVaultBackup,
} from "@workspace/core/features/notes/services/backup-service";
import { beforeEach, describe, expect, it } from "vitest";

function header(name: string): EncryptedVaultHeader {
  return {
    vaultVersion: 1,
    vaultName: name,
    createdAt: new Date().toISOString(),
    kdf: { algorithm: "pbkdf2-sha256", salt: "c2FsdA==", iterations: 600_000 },
    wrappedDataKey: { algorithm: "AES-GCM", iv: "aXY=", ciphertext: "Y3Q=" },
    verificationPayload: { iv: "aXY=", ciphertext: "Y3Q=" },
  };
}

function record(id: string): EncryptedNoteRecord {
  return { id, encryptionVersion: 1, iv: "aXY=", ciphertext: "Y3Q=" };
}

describe("backup service", () => {
  beforeEach(() => {
    setNotesRepository(createMemoryNotesRepository());
  });

  it("exports and re-imports the encrypted vault round-trip", async () => {
    const source = createMemoryNotesRepository();
    setNotesRepository(source);
    await source.saveVaultHeader(header("Original"));
    await source.upsertEncryptedNote(record("a"));
    await source.upsertEncryptedNote(record("b"));

    const backup = await buildVaultBackup();
    const serialized = JSON.stringify(backup);

    // Restore into a fresh, unrelated repository.
    const target = createMemoryNotesRepository();
    setNotesRepository(target);
    await target.saveVaultHeader(header("To Be Replaced"));
    await target.upsertEncryptedNote(record("stale"));

    await restoreVaultBackup(parseVaultBackup(serialized));

    const restoredHeader = await target.getVaultHeader();
    expect(restoredHeader?.vaultName).toBe("Original");
    const notes = await target.listEncryptedNotes();
    expect(notes.map((n) => n.id).sort()).toEqual(["a", "b"]);
  });

  it("rejects a malformed backup file", () => {
    expect(() => parseVaultBackup("not json")).toThrow(CorruptDataError);
    expect(() => parseVaultBackup(JSON.stringify({ format: "x" }))).toThrow(
      CorruptDataError
    );
  });

  it("contains no plaintext beyond ciphertext fields", async () => {
    await buildVaultBackup().catch(() => null);
    setNotesRepository(createMemoryNotesRepository());
    await (async () => {
      const repo = createMemoryNotesRepository();
      setNotesRepository(repo);
      await repo.saveVaultHeader(header("V"));
      await repo.upsertEncryptedNote(record("a"));
    })();
    const backup = await buildVaultBackup();
    expect(backup.format).toBe("catalyzer-notes-backup");
    expect(backup.backupVersion).toBe(1);
    expect(Object.keys(backup.notes[0] ?? {}).sort()).toEqual([
      "ciphertext",
      "encryptionVersion",
      "id",
      "iv",
    ]);
  });
});
