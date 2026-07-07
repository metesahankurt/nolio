/**
 * Holds the unlocked Data Encryption Key for the current session.
 *
 * The key lives ONLY in this module's closure:
 * - never in a Zustand store (so it cannot leak via persist middleware,
 *   devtools serialization or state snapshots),
 * - never in localStorage / sessionStorage / IndexedDB / SQLite,
 * - never logged.
 *
 * `clear()` overwrites the raw bytes before dropping the references.
 * JavaScript cannot guarantee that no copies remain in engine-managed
 * memory, but this removes every reference the application holds, and the
 * non-extractable CryptoKey cannot be read back from WebCrypto.
 */

import { importAesGcmKey } from "@workspace/core/features/notes/crypto/aes-gcm";
import { wipeBytes } from "@workspace/core/features/notes/crypto/encoding";
import { VaultLockedError } from "@workspace/core/features/notes/domain/errors";

let rawDataKey: Uint8Array | null = null;
let dataCryptoKey: CryptoKey | null = null;

export async function startSession(dataKey: Uint8Array): Promise<void> {
  clearSession();
  rawDataKey = dataKey;
  dataCryptoKey = await importAesGcmKey(dataKey);
}

export function getSessionDataKey(): CryptoKey {
  if (!dataCryptoKey) {
    throw new VaultLockedError();
  }
  return dataCryptoKey;
}

/**
 * Raw key bytes are needed only to re-wrap the DEK during a password
 * change. Do not copy or persist the returned buffer.
 */
export function getSessionRawDataKey(): Uint8Array {
  if (!rawDataKey) {
    throw new VaultLockedError();
  }
  return rawDataKey;
}

export function hasActiveSession(): boolean {
  return dataCryptoKey !== null;
}

export function clearSession(): void {
  wipeBytes(rawDataKey);
  rawDataKey = null;
  dataCryptoKey = null;
}
