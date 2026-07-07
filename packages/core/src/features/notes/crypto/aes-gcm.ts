import {
  randomBytes,
  utf8ToBytes,
} from "@workspace/core/features/notes/crypto/encoding";

export const AES_GCM_IV_LENGTH_BYTES = 12;

export async function importAesGcmKey(
  rawKey: Uint8Array,
  extractable = false
): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    rawKey as BufferSource,
    { name: "AES-GCM" },
    extractable,
    ["encrypt", "decrypt"]
  );
}

export interface AesGcmBox {
  ciphertext: Uint8Array;
  iv: Uint8Array;
}

/**
 * AES-256-GCM encryption with a fresh random 96-bit IV per call. Reusing an
 * IV under the same key breaks GCM completely, so the IV is generated here
 * and never accepted from the caller.
 */
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
  additionalData?: string
): Promise<AesGcmBox> {
  const iv = randomBytes(AES_GCM_IV_LENGTH_BYTES);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      additionalData: additionalData
        ? (utf8ToBytes(additionalData) as BufferSource)
        : undefined,
    },
    key,
    plaintext as BufferSource
  );
  return { iv, ciphertext: new Uint8Array(ciphertext) };
}

/**
 * Throws (via WebCrypto) when the auth tag or AAD does not verify. Callers
 * translate that failure into WrongPasswordError / CorruptDataError.
 */
export async function aesGcmDecrypt(
  key: CryptoKey,
  box: AesGcmBox,
  additionalData?: string
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: box.iv as BufferSource,
      additionalData: additionalData
        ? (utf8ToBytes(additionalData) as BufferSource)
        : undefined,
    },
    key,
    box.ciphertext as BufferSource
  );
  return new Uint8Array(plaintext);
}
