export type VaultStatus =
  | "initializing"
  | "uninitialized"
  | "locked"
  | "unlocking"
  | "unlocked"
  | "error";

export type KdfConfig =
  | {
      algorithm: "argon2id";
      salt: string;
      memoryKiB: number;
      iterations: number;
      parallelism: number;
    }
  | {
      algorithm: "pbkdf2-sha256";
      salt: string;
      iterations: number;
    };

export interface WrappedDataKey {
  algorithm: "AES-GCM";
  ciphertext: string;
  iv: string;
}

export interface VerificationPayload {
  ciphertext: string;
  iv: string;
}

export interface EncryptedVaultHeader {
  createdAt: string;
  kdf: KdfConfig;
  vaultName: string | null;
  vaultVersion: 1;
  verificationPayload: VerificationPayload;
  wrappedDataKey: WrappedDataKey;
}

export interface CreateVaultInput {
  password: string;
  vaultName: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
