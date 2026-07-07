import {
  createVaultHeader,
  rewrapDataKey,
  unlockDataKey,
} from "@workspace/core/features/notes/crypto/vault-crypto";
import { StorageError } from "@workspace/core/features/notes/domain/errors";
import type {
  ChangePasswordInput,
  CreateVaultInput,
  EncryptedVaultHeader,
} from "@workspace/core/features/notes/domain/vault-types";
import { getNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import {
  clearSession,
  getSessionRawDataKey,
  startSession,
} from "@workspace/core/features/notes/services/session-key-service";

export async function readVaultHeader(): Promise<EncryptedVaultHeader | null> {
  try {
    return await getNotesRepository().getVaultHeader();
  } catch {
    throw new StorageError();
  }
}

export async function createVault(
  input: CreateVaultInput
): Promise<EncryptedVaultHeader> {
  const { header, dataKey } = await createVaultHeader(
    input.password,
    input.vaultName
  );
  try {
    await getNotesRepository().saveVaultHeader(header);
  } catch {
    throw new StorageError();
  }
  await startSession(dataKey);
  return header;
}

export async function unlockVault(
  header: EncryptedVaultHeader,
  password: string
): Promise<void> {
  const dataKey = await unlockDataKey(header, password);
  await startSession(dataKey);
}

export function lockVault(): void {
  clearSession();
}

/**
 * Changes the master password by re-wrapping the DEK. The new header is
 * written in a single `saveVaultHeader` call; if any step before that
 * throws, nothing was persisted and the old password keeps working. Note
 * ciphertexts are never touched.
 */
export async function changeVaultPassword(
  header: EncryptedVaultHeader,
  input: ChangePasswordInput
): Promise<EncryptedVaultHeader> {
  // Re-verify the current password even though the session is unlocked.
  const currentDataKey = await unlockDataKey(header, input.currentPassword);
  currentDataKey.fill(0);

  const sessionKey = getSessionRawDataKey();
  const newHeader = await rewrapDataKey(header, sessionKey, input.newPassword);

  // Sanity check before persisting: the new header must unlock with the
  // new password. Guards against writing an unrecoverable header.
  const roundTrip = await unlockDataKey(newHeader, input.newPassword);
  roundTrip.fill(0);

  try {
    await getNotesRepository().saveVaultHeader(newHeader);
  } catch {
    throw new StorageError();
  }
  return newHeader;
}
