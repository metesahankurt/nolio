import {
  aesGcmDecrypt,
  aesGcmEncrypt,
} from "@workspace/core/features/notes/crypto/aes-gcm";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from "@workspace/core/features/notes/crypto/encoding";
import { CorruptDataError } from "@workspace/core/features/notes/domain/errors";
import type {
  DecryptedNote,
  EncryptedNotePayloadV1,
  EncryptedNoteRecord,
} from "@workspace/core/features/notes/domain/note-types";
import {
  decryptedNoteSchema,
  encryptedNotePayloadSchema,
  encryptedNoteRecordSchema,
} from "@workspace/core/features/notes/domain/schemas";

const NOTE_ENCRYPTION_VERSION = 1;
const NOTE_SCHEMA_VERSION = 1;

/**
 * Binds the ciphertext to the record id and versions via AAD: a ciphertext
 * copied onto another note id (or claimed as another version) fails
 * authentication on decrypt.
 */
function noteAad(noteId: string): string {
  return `catalyzer-note:${noteId}:enc${NOTE_ENCRYPTION_VERSION}:schema${NOTE_SCHEMA_VERSION}`;
}

/**
 * Encrypts a full note (title, content, tags, hierarchy — everything) into
 * a record whose only plaintext fields are the random id, versions and IV.
 * A fresh IV is generated on every call, including re-saves of the same note.
 */
export async function encryptNote(
  note: DecryptedNote,
  dataKey: CryptoKey
): Promise<EncryptedNoteRecord> {
  const validNote = decryptedNoteSchema.parse(note);
  const payload: EncryptedNotePayloadV1 = {
    schemaVersion: NOTE_SCHEMA_VERSION,
    note: validNote,
  };
  const box = await aesGcmEncrypt(
    dataKey,
    utf8ToBytes(JSON.stringify(payload)),
    noteAad(note.id)
  );
  return {
    id: note.id,
    encryptionVersion: NOTE_ENCRYPTION_VERSION,
    iv: bytesToBase64(box.iv),
    ciphertext: bytesToBase64(box.ciphertext),
  };
}

/**
 * Decrypts and validates a stored record. Any failure — malformed record,
 * failed GCM authentication, invalid JSON, schema mismatch — surfaces as
 * CorruptDataError so callers treat the record as damaged.
 */
export async function decryptNote(
  record: EncryptedNoteRecord,
  dataKey: CryptoKey
): Promise<DecryptedNote> {
  const parsedRecord = encryptedNoteRecordSchema.safeParse(record);
  if (!parsedRecord.success) {
    throw new CorruptDataError();
  }
  let plaintext: Uint8Array;
  try {
    plaintext = await aesGcmDecrypt(
      dataKey,
      {
        iv: base64ToBytes(parsedRecord.data.iv),
        ciphertext: base64ToBytes(parsedRecord.data.ciphertext),
      },
      noteAad(parsedRecord.data.id)
    );
  } catch {
    throw new CorruptDataError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bytesToUtf8(plaintext));
  } catch {
    throw new CorruptDataError();
  }
  const parsedPayload = encryptedNotePayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new CorruptDataError();
  }
  if (parsedPayload.data.note.id !== parsedRecord.data.id) {
    throw new CorruptDataError();
  }
  return parsedPayload.data.note;
}
