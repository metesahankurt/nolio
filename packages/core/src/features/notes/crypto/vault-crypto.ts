/**
 * Envelope encryption for the vault.
 *
 * - A random 32-byte Data Encryption Key (DEK) encrypts every note.
 * - A Key Encryption Key (KEK), derived from the master password via the
 *   vault's KDF config, wraps the DEK with AES-256-GCM.
 * - Only the wrapped DEK is persisted; the password and the unwrapped DEK
 *   never leave process memory.
 *
 * Changing the password therefore only re-wraps the DEK — note ciphertexts
 * stay untouched.
 */

import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  importAesGcmKey,
} from "@workspace/core/features/notes/crypto/aes-gcm";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  randomBytes,
  utf8ToBytes,
  wipeBytes,
} from "@workspace/core/features/notes/crypto/encoding";
import {
  createDefaultKdfConfig,
  deriveKeyEncryptionKey,
} from "@workspace/core/features/notes/crypto/key-derivation";
import {
  CorruptDataError,
  WrongPasswordError,
} from "@workspace/core/features/notes/domain/errors";
import { encryptedVaultHeaderSchema } from "@workspace/core/features/notes/domain/schemas";
import type {
  EncryptedVaultHeader,
  KdfConfig,
} from "@workspace/core/features/notes/domain/vault-types";

const DATA_KEY_LENGTH_BYTES = 32;
const WRAP_AAD = "catalyzer-vault:wrapped-dek:v1";
const VERIFICATION_AAD = "catalyzer-vault:verification:v1";
const VERIFICATION_PLAINTEXT = "catalyzer-vault-verification-v1";

export function generateDataKey(): Uint8Array {
  return randomBytes(DATA_KEY_LENGTH_BYTES);
}

async function wrapDataKey(
  dataKey: Uint8Array,
  kekBytes: Uint8Array
): Promise<{ iv: string; ciphertext: string }> {
  const kek = await importAesGcmKey(kekBytes);
  const box = await aesGcmEncrypt(kek, dataKey, WRAP_AAD);
  return {
    iv: bytesToBase64(box.iv),
    ciphertext: bytesToBase64(box.ciphertext),
  };
}

async function buildVerificationPayload(
  dataKey: Uint8Array
): Promise<{ iv: string; ciphertext: string }> {
  const dek = await importAesGcmKey(dataKey);
  const box = await aesGcmEncrypt(
    dek,
    utf8ToBytes(VERIFICATION_PLAINTEXT),
    VERIFICATION_AAD
  );
  return {
    iv: bytesToBase64(box.iv),
    ciphertext: bytesToBase64(box.ciphertext),
  };
}

export async function createVaultHeader(
  password: string,
  vaultName: string | null
): Promise<{ header: EncryptedVaultHeader; dataKey: Uint8Array }> {
  const kdf = await createDefaultKdfConfig();
  const dataKey = generateDataKey();
  const kekBytes = await deriveKeyEncryptionKey(password, kdf);
  try {
    const wrapped = await wrapDataKey(dataKey, kekBytes);
    const verificationPayload = await buildVerificationPayload(dataKey);
    const header: EncryptedVaultHeader = {
      vaultVersion: 1,
      vaultName,
      createdAt: new Date().toISOString(),
      kdf,
      wrappedDataKey: { algorithm: "AES-GCM", ...wrapped },
      verificationPayload,
    };
    return { header, dataKey };
  } finally {
    wipeBytes(kekBytes);
  }
}

/**
 * Unlocks the vault: derives the KEK, unwraps the DEK and verifies it
 * against the verification payload. Both failure modes (bad unwrap, bad
 * verification) throw WrongPasswordError — a corrupt header and a wrong
 * password are deliberately indistinguishable to the caller.
 */
export async function unlockDataKey(
  header: EncryptedVaultHeader,
  password: string
): Promise<Uint8Array> {
  const parsed = encryptedVaultHeaderSchema.safeParse(header);
  if (!parsed.success) {
    throw new CorruptDataError();
  }
  const kekBytes = await deriveKeyEncryptionKey(password, parsed.data.kdf);
  let dataKey: Uint8Array;
  try {
    const kek = await importAesGcmKey(kekBytes);
    dataKey = await aesGcmDecrypt(
      kek,
      {
        iv: base64ToBytes(parsed.data.wrappedDataKey.iv),
        ciphertext: base64ToBytes(parsed.data.wrappedDataKey.ciphertext),
      },
      WRAP_AAD
    );
  } catch {
    throw new WrongPasswordError();
  } finally {
    wipeBytes(kekBytes);
  }

  try {
    const dek = await importAesGcmKey(dataKey);
    const verification = await aesGcmDecrypt(
      dek,
      {
        iv: base64ToBytes(parsed.data.verificationPayload.iv),
        ciphertext: base64ToBytes(parsed.data.verificationPayload.ciphertext),
      },
      VERIFICATION_AAD
    );
    if (bytesToUtf8(verification) !== VERIFICATION_PLAINTEXT) {
      throw new WrongPasswordError();
    }
  } catch {
    wipeBytes(dataKey);
    throw new WrongPasswordError();
  }
  return dataKey;
}

/**
 * Re-wraps the existing DEK under a KEK derived from the new password with
 * fresh KDF parameters and salt. Returns a complete new header; the caller
 * persists it in a single atomic write so a failure leaves the old header
 * (and the old password) fully intact. Note ciphertexts are not touched.
 */
export async function rewrapDataKey(
  header: EncryptedVaultHeader,
  dataKey: Uint8Array,
  newPassword: string
): Promise<EncryptedVaultHeader> {
  const kdf: KdfConfig = await createDefaultKdfConfig();
  const kekBytes = await deriveKeyEncryptionKey(newPassword, kdf);
  try {
    const wrapped = await wrapDataKey(dataKey, kekBytes);
    const verificationPayload = await buildVerificationPayload(dataKey);
    return {
      ...header,
      kdf,
      wrappedDataKey: { algorithm: "AES-GCM", ...wrapped },
      verificationPayload,
    };
  } finally {
    wipeBytes(kekBytes);
  }
}
