import {
  base64ToBytes,
  bytesToBase64,
  randomBytes,
  utf8ToBytes,
} from "@workspace/core/features/notes/crypto/encoding";
import { KdfError } from "@workspace/core/features/notes/domain/errors";
import type { KdfConfig } from "@workspace/core/features/notes/domain/vault-types";
import { argon2id } from "hash-wasm";

const KEY_LENGTH_BYTES = 32;
const SALT_LENGTH_BYTES = 16;

// OWASP-aligned Argon2id baseline: 19 MiB memory, 2 passes, 1 lane.
const ARGON2_MEMORY_KIB = 19_456;
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;

// PBKDF2 fallback for environments where the Argon2 WASM module cannot run.
const PBKDF2_ITERATIONS = 600_000;

export function createArgon2idConfig(): KdfConfig {
  return {
    algorithm: "argon2id",
    salt: bytesToBase64(randomBytes(SALT_LENGTH_BYTES)),
    memoryKiB: ARGON2_MEMORY_KIB,
    iterations: ARGON2_ITERATIONS,
    parallelism: ARGON2_PARALLELISM,
  };
}

export function createPbkdf2Config(): KdfConfig {
  return {
    algorithm: "pbkdf2-sha256",
    salt: bytesToBase64(randomBytes(SALT_LENGTH_BYTES)),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Picks Argon2id when the WASM implementation works in the current runtime,
 * otherwise falls back to WebCrypto PBKDF2. The chosen algorithm and its
 * parameters are persisted (versioned) inside the vault header, so existing
 * vaults keep unlocking with whatever they were created with.
 */
export async function createDefaultKdfConfig(): Promise<KdfConfig> {
  try {
    await argon2id({
      password: "probe",
      salt: new Uint8Array(SALT_LENGTH_BYTES),
      memorySize: 64,
      iterations: 1,
      parallelism: 1,
      hashLength: KEY_LENGTH_BYTES,
      outputType: "binary",
    });
    return createArgon2idConfig();
  } catch {
    return createPbkdf2Config();
  }
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    passwordKey,
    KEY_LENGTH_BYTES * 8
  );
  return new Uint8Array(bits);
}

/**
 * Derives the Key Encryption Key from the master password. Never persist
 * the returned bytes; wipe them as soon as the wrap/unwrap is done.
 */
export async function deriveKeyEncryptionKey(
  password: string,
  config: KdfConfig
): Promise<Uint8Array> {
  try {
    const salt = base64ToBytes(config.salt);
    if (config.algorithm === "argon2id") {
      return await argon2id({
        password,
        salt,
        memorySize: config.memoryKiB,
        iterations: config.iterations,
        parallelism: config.parallelism,
        hashLength: KEY_LENGTH_BYTES,
        outputType: "binary",
      });
    }
    return await derivePbkdf2(password, salt, config.iterations);
  } catch {
    // Never propagate the underlying error: it could reference key material.
    throw new KdfError();
  }
}
