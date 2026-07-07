import {
  CorruptDataError,
  KdfError,
  StorageError,
  WrongPasswordError,
} from "@workspace/core/features/notes/domain/errors";
import type {
  ChangePasswordInput,
  CreateVaultInput,
  EncryptedVaultHeader,
  VaultStatus,
} from "@workspace/core/features/notes/domain/vault-types";
import { getNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { clearSearchIndex } from "@workspace/core/features/notes/services/search-service";
import {
  broadcastVaultMessage,
  subscribeVaultBroadcast,
} from "@workspace/core/features/notes/services/vault-broadcast";
import {
  changeVaultPassword,
  createVault,
  lockVault,
  readVaultHeader,
  unlockVault,
} from "@workspace/core/features/notes/services/vault-service";
import type { WelcomeNoteSpec } from "@workspace/core/stores/notes-store";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { create } from "zustand";

export type VaultUiError = "wrongPassword" | "storage" | "corrupt" | "kdf";

interface VaultState {
  changePassword(input: ChangePasswordInput): Promise<void>;
  createVault(
    input: CreateVaultInput,
    welcome?: WelcomeNoteSpec
  ): Promise<void>;
  error: VaultUiError | null;
  failedAttempts: number;

  initialize(): Promise<void>;
  lastActivityAt: number | null;
  lock(): void;
  registerActivity(): void;
  /** Wipes the entire local vault (irreversible) and returns to setup. */
  resetVault(): Promise<void>;
  sessionStartedAt: number | null;
  status: VaultStatus;
  unlock(password: string): Promise<void>;
  vaultName: string | null;
}

/**
 * The vault header stays in module scope, not in store state: UI never
 * needs the wrapped key material, only the status and name.
 *
 * This store is intentionally NOT persisted. Nothing in it (and nothing
 * derived from the master password) may ever reach persist middleware.
 */
let cachedHeader: EncryptedVaultHeader | null = null;

function toUiError(error: unknown): VaultUiError {
  if (error instanceof WrongPasswordError) {
    return "wrongPassword";
  }
  if (error instanceof CorruptDataError) {
    return "corrupt";
  }
  if (error instanceof KdfError) {
    return "kdf";
  }
  if (error instanceof StorageError) {
    return "storage";
  }
  return "storage";
}

/**
 * UI-side delay after failed attempts. This is intentionally documented as
 * NOT a real offline brute-force bound: an attacker with the ciphertext
 * bypasses the UI entirely. The actual brute-force cost comes from the KDF
 * (Argon2id / 600k-iteration PBKDF2). This delay only slows casual
 * guessing at the keyboard.
 */
const FAILED_ATTEMPT_DELAY_MS = 750;
const MAX_DELAY_STEPS = 5;

function attemptDelay(failedAttempts: number): Promise<void> {
  const steps = Math.min(failedAttempts, MAX_DELAY_STEPS);
  if (steps === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) =>
    setTimeout(resolve, steps * FAILED_ATTEMPT_DELAY_MS)
  );
}

export const useVaultStore = create<VaultState>()((set, get) => ({
  status: "initializing",
  vaultName: null,
  error: null,
  failedAttempts: 0,
  sessionStartedAt: null,
  lastActivityAt: null,

  async initialize() {
    try {
      cachedHeader = await readVaultHeader();
      if (cachedHeader) {
        set({
          status: "locked",
          vaultName: cachedHeader.vaultName,
          error: null,
        });
      } else {
        set({ status: "uninitialized", vaultName: null, error: null });
      }
    } catch (error) {
      set({ status: "error", error: toUiError(error) });
    }
  },

  async createVault(input: CreateVaultInput, welcome?: WelcomeNoteSpec) {
    set({ status: "unlocking", error: null });
    try {
      cachedHeader = await createVault(input);
      const now = Date.now();
      set({
        status: "unlocked",
        vaultName: cachedHeader.vaultName,
        error: null,
        failedAttempts: 0,
        sessionStartedAt: now,
        lastActivityAt: now,
      });
      await useNotesStore.getState().bootstrapNewVault(welcome);
      broadcastVaultMessage({ type: "unlocked" });
    } catch (error) {
      set({ status: "uninitialized", error: toUiError(error) });
      throw error;
    }
  },

  async unlock(password: string) {
    if (!cachedHeader) {
      set({ status: "error", error: "storage" });
      return;
    }
    set({ status: "unlocking", error: null });
    await attemptDelay(get().failedAttempts);
    try {
      await unlockVault(cachedHeader, password);
      const now = Date.now();
      set({
        status: "unlocked",
        error: null,
        failedAttempts: 0,
        sessionStartedAt: now,
        lastActivityAt: now,
      });
      await useNotesStore.getState().loadAll();
      broadcastVaultMessage({ type: "unlocked" });
    } catch (error) {
      // Every unlock failure surfaces as the same generic UI error.
      set((state) => ({
        status: "locked",
        error: toUiError(error),
        failedAttempts:
          error instanceof WrongPasswordError
            ? state.failedAttempts + 1
            : state.failedAttempts,
      }));
    }
  },

  lock() {
    if (get().status !== "unlocked") {
      return;
    }
    // Flush pending saves first, then wipe all decrypted state.
    useNotesStore
      .getState()
      .flushPendingSaves()
      .catch(() => {
        // The note stays intact on disk with its last successful ciphertext.
      })
      .finally(() => {
        lockVault();
        useNotesStore.getState().reset();
        clearSearchIndex();
        set({
          status: "locked",
          error: null,
          sessionStartedAt: null,
          lastActivityAt: null,
        });
        broadcastVaultMessage({ type: "locked" });
      });
  },

  async changePassword(input: ChangePasswordInput) {
    if (!cachedHeader) {
      throw new StorageError();
    }
    cachedHeader = await changeVaultPassword(cachedHeader, input);
  },

  async resetVault() {
    // Irreversible: there is no password recovery for a local vault, so a
    // forgotten password can only be resolved by wiping everything and
    // starting over. Clears storage and all in-memory decrypted state.
    lockVault();
    useNotesStore.getState().reset();
    clearSearchIndex();
    try {
      await getNotesRepository().clearAllData();
    } finally {
      cachedHeader = null;
      set({
        status: "uninitialized",
        vaultName: null,
        error: null,
        failedAttempts: 0,
        sessionStartedAt: null,
        lastActivityAt: null,
      });
    }
  },

  registerActivity() {
    if (get().status === "unlocked") {
      set({ lastActivityAt: Date.now() });
    }
  },
}));

// Lock this tab whenever another tab locks the shared vault.
subscribeVaultBroadcast((message) => {
  if (message.type === "locked") {
    const { status } = useVaultStore.getState();
    if (status === "unlocked") {
      useVaultStore.getState().lock();
    }
  }
});
