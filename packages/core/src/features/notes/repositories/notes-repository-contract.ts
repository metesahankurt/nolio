import type { EncryptedNoteRecord } from "@workspace/core/features/notes/domain/note-types";
import type { EncryptedVaultHeader } from "@workspace/core/features/notes/domain/vault-types";
import type { NotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { describe, expect, it } from "vitest";

function sampleHeader(name: string | null = "Vault"): EncryptedVaultHeader {
  return {
    vaultVersion: 1,
    vaultName: name,
    createdAt: new Date().toISOString(),
    kdf: {
      algorithm: "pbkdf2-sha256",
      salt: "c2FsdA==",
      iterations: 600_000,
    },
    wrappedDataKey: { algorithm: "AES-GCM", iv: "aXY=", ciphertext: "Y3Q=" },
    verificationPayload: { iv: "aXY=", ciphertext: "Y3Q=" },
  };
}

function sampleRecord(id: string): EncryptedNoteRecord {
  return { id, encryptionVersion: 1, iv: "aXY=", ciphertext: "Y3QtJHtpZH0=" };
}

/**
 * Behavioral contract every NotesRepository implementation must satisfy.
 * Run it against each adapter (memory, IndexedDB, SQLite) from a test file:
 *
 *   describeNotesRepositoryContract("indexeddb", () => createRepo());
 */
export function describeNotesRepositoryContract(
  name: string,
  createRepository: () => Promise<NotesRepository> | NotesRepository
): void {
  describe(`NotesRepository contract: ${name}`, () => {
    it("returns null when no vault header exists", async () => {
      const repo = await createRepository();
      expect(await repo.getVaultHeader()).toBeNull();
    });

    it("saves and reads back the vault header", async () => {
      const repo = await createRepository();
      const header = sampleHeader("My Vault");
      await repo.saveVaultHeader(header);
      expect(await repo.getVaultHeader()).toEqual(header);
    });

    it("overwrites the header on re-save", async () => {
      const repo = await createRepository();
      await repo.saveVaultHeader(sampleHeader("First"));
      await repo.saveVaultHeader(sampleHeader("Second"));
      const stored = await repo.getVaultHeader();
      expect(stored?.vaultName).toBe("Second");
    });

    it("creates, reads, lists, updates and deletes notes", async () => {
      const repo = await createRepository();
      const a = sampleRecord("note-a");
      const b = sampleRecord("note-b");
      await repo.upsertEncryptedNote(a);
      await repo.upsertEncryptedNote(b);

      expect(await repo.getEncryptedNote("note-a")).toEqual(a);
      const listed = await repo.listEncryptedNotes();
      expect(listed.map((r) => r.id).sort()).toEqual(["note-a", "note-b"]);

      const updated = { ...a, iv: "bmV3aXY=", ciphertext: "bmV3Y3Q=" };
      await repo.upsertEncryptedNote(updated);
      expect(await repo.getEncryptedNote("note-a")).toEqual(updated);
      expect((await repo.listEncryptedNotes()).length).toBe(2);

      await repo.deleteEncryptedNote("note-a");
      expect(await repo.getEncryptedNote("note-a")).toBeNull();
      expect((await repo.listEncryptedNotes()).length).toBe(1);
    });

    it("returns null for a missing note and tolerates deleting one", async () => {
      const repo = await createRepository();
      expect(await repo.getEncryptedNote("missing")).toBeNull();
      await expect(
        repo.deleteEncryptedNote("missing")
      ).resolves.toBeUndefined();
    });

    it("clears all data", async () => {
      const repo = await createRepository();
      await repo.saveVaultHeader(sampleHeader());
      await repo.upsertEncryptedNote(sampleRecord("note-a"));
      await repo.clearAllData();
      expect(await repo.getVaultHeader()).toBeNull();
      expect(await repo.listEncryptedNotes()).toEqual([]);
    });
  });
}
