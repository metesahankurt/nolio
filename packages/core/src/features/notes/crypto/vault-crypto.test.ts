import { importAesGcmKey } from "@workspace/core/features/notes/crypto/aes-gcm";
import {
  base64ToBytes,
  bytesToBase64,
} from "@workspace/core/features/notes/crypto/encoding";
import {
  decryptNote,
  encryptNote,
} from "@workspace/core/features/notes/crypto/note-crypto";
import {
  createVaultHeader,
  rewrapDataKey,
  unlockDataKey,
} from "@workspace/core/features/notes/crypto/vault-crypto";
import {
  CorruptDataError,
  WrongPasswordError,
} from "@workspace/core/features/notes/domain/errors";
import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import { kdfConfigSchema } from "@workspace/core/features/notes/domain/schemas";
import { describe, expect, it } from "vitest";

const PASSWORD = "correct horse battery staple";
const WRONG_PASSWORD = "not-the-password";

function sampleNote(overrides: Partial<DecryptedNote> = {}): DecryptedNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Gizli başlık",
    content: [
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        props: { textColor: "default" },
        content: [{ type: "text", text: "gizli içerik", styles: {} }],
        children: [],
      },
    ],
    parentId: null,
    tags: ["kişisel"],
    isFavorite: false,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("vault header (envelope encryption)", () => {
  it("creates a header and unlocks with the right password", async () => {
    const { header, dataKey } = await createVaultHeader(PASSWORD, "Test Vault");
    const unlocked = await unlockDataKey(header, PASSWORD);
    expect(bytesToBase64(unlocked)).toBe(bytesToBase64(dataKey));
    expect(header.vaultName).toBe("Test Vault");
  });

  it("rejects the wrong password", async () => {
    const { header } = await createVaultHeader(PASSWORD, null);
    await expect(unlockDataKey(header, WRONG_PASSWORD)).rejects.toBeInstanceOf(
      WrongPasswordError
    );
  });

  it("rejects a tampered wrapped key", async () => {
    const { header } = await createVaultHeader(PASSWORD, null);
    const bytes = base64ToBytes(header.wrappedDataKey.ciphertext);
    const firstByte = bytes[0] ?? 0;
    bytes[0] = (firstByte + 1) % 256;
    const tampered = {
      ...header,
      wrappedDataKey: {
        ...header.wrappedDataKey,
        ciphertext: bytesToBase64(bytes),
      },
    };
    await expect(unlockDataKey(tampered, PASSWORD)).rejects.toBeInstanceOf(
      WrongPasswordError
    );
  });

  it("serializes and validates the KDF config", async () => {
    const { header } = await createVaultHeader(PASSWORD, null);
    const roundTripped = JSON.parse(JSON.stringify(header.kdf));
    const parsed = kdfConfigSchema.parse(roundTripped);
    expect(parsed).toEqual(header.kdf);
  });

  it("re-wraps the data key on password change without touching notes", async () => {
    const { header, dataKey } = await createVaultHeader(PASSWORD, null);
    const dek = await importAesGcmKey(dataKey);
    const record = await encryptNote(sampleNote(), dek);

    const newPassword = "yeni-guclu-parola-123";
    const newHeader = await rewrapDataKey(header, dataKey, newPassword);

    // New password unlocks, old password does not.
    const unlocked = await unlockDataKey(newHeader, newPassword);
    expect(bytesToBase64(unlocked)).toBe(bytesToBase64(dataKey));
    await expect(unlockDataKey(newHeader, PASSWORD)).rejects.toBeInstanceOf(
      WrongPasswordError
    );

    // Existing ciphertext still decrypts with the same DEK.
    const note = await decryptNote(record, await importAesGcmKey(unlocked));
    expect(note.title).toBe("Gizli başlık");
  });
});

describe("note encryption (AES-256-GCM)", () => {
  async function makeDek(): Promise<CryptoKey> {
    const { dataKey } = await createVaultHeader(PASSWORD, null);
    return await importAesGcmKey(dataKey);
  }

  it("round-trips a note", async () => {
    const dek = await makeDek();
    const note = sampleNote();
    const record = await encryptNote(note, dek);
    expect(record.id).toBe(note.id);
    expect(record.ciphertext).not.toContain("Gizli");
    const decrypted = await decryptNote(record, dek);
    expect(decrypted).toEqual(note);
  });

  it("uses a fresh IV for every save of the same note", async () => {
    const dek = await makeDek();
    const note = sampleNote();
    const first = await encryptNote(note, dek);
    const second = await encryptNote(note, dek);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("uses different IVs for different notes", async () => {
    const dek = await makeDek();
    const a = await encryptNote(sampleNote(), dek);
    const b = await encryptNote(sampleNote(), dek);
    expect(a.iv).not.toBe(b.iv);
  });

  it("rejects tampered ciphertext", async () => {
    const dek = await makeDek();
    const record = await encryptNote(sampleNote(), dek);
    const bytes = base64ToBytes(record.ciphertext);
    const midIndex = Math.floor(bytes.length / 2);
    const midByte = bytes[midIndex] ?? 0;
    bytes[midIndex] = (midByte + 1) % 256;
    const tampered = { ...record, ciphertext: bytesToBase64(bytes) };
    await expect(decryptNote(tampered, dek)).rejects.toBeInstanceOf(
      CorruptDataError
    );
  });

  it("rejects a tampered auth tag", async () => {
    const dek = await makeDek();
    const record = await encryptNote(sampleNote(), dek);
    const bytes = base64ToBytes(record.ciphertext);
    // GCM appends the 16-byte tag to the ciphertext.
    const tagIndex = bytes.length - 1;
    const tagByte = bytes[tagIndex] ?? 0;
    bytes[tagIndex] = (tagByte + 1) % 256;
    const tampered = { ...record, ciphertext: bytesToBase64(bytes) };
    await expect(decryptNote(tampered, dek)).rejects.toBeInstanceOf(
      CorruptDataError
    );
  });

  it("fails when the AAD (note id) does not match", async () => {
    const dek = await makeDek();
    const record = await encryptNote(sampleNote(), dek);
    // Same ciphertext claimed under a different note id -> AAD mismatch.
    const reassigned = { ...record, id: crypto.randomUUID() };
    await expect(decryptNote(reassigned, dek)).rejects.toBeInstanceOf(
      CorruptDataError
    );
  });

  it("rejects decryption with the wrong data key", async () => {
    const dek = await makeDek();
    const otherDek = await makeDek();
    const record = await encryptNote(sampleNote(), dek);
    await expect(decryptNote(record, otherDek)).rejects.toBeInstanceOf(
      CorruptDataError
    );
  });
});
