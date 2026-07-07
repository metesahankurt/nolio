/**
 * Binary <-> string helpers for the crypto layer. Works in browsers, Tauri
 * WebViews and Node (>= 20), all of which expose `globalThis.crypto`,
 * `atob`/`btoa` and `TextEncoder`.
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function utf8ToBytes(value: string): Uint8Array {
  return textEncoder.encode(value);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomId(): string {
  return crypto.randomUUID();
}

/**
 * Best-effort zeroing of key material. JavaScript cannot guarantee that no
 * copies remain elsewhere in memory (GC, engine internals), but overwriting
 * removes the value from every reference the application itself holds.
 */
export function wipeBytes(bytes: Uint8Array | null): void {
  bytes?.fill(0);
}
