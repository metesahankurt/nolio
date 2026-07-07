/**
 * Typed error hierarchy for the encrypted notes feature.
 *
 * Error messages here are internal identifiers. UI code must map them to
 * translated, deliberately generic user-facing messages (e.g. a failed
 * unwrap and a missing header both surface as "password could not be
 * verified") so internals are never leaked to the user.
 *
 * None of these errors may ever carry passwords, derived keys, plaintext
 * or ciphertext in their message or properties.
 */
export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}

export class WrongPasswordError extends VaultError {
  constructor() {
    super("Password could not be verified");
    this.name = "WrongPasswordError";
  }
}

export class VaultLockedError extends VaultError {
  constructor() {
    super("Vault is locked");
    this.name = "VaultLockedError";
  }
}

export class CorruptDataError extends VaultError {
  constructor() {
    super("Stored data failed integrity checks");
    this.name = "CorruptDataError";
  }
}

export class KdfError extends VaultError {
  constructor() {
    super("Key derivation failed");
    this.name = "KdfError";
  }
}

export class StorageError extends VaultError {
  constructor() {
    super("Storage operation failed");
    this.name = "StorageError";
  }
}
