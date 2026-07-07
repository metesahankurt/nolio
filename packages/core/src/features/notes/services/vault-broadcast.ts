/**
 * Cross-tab coordination for the web app (no-op where BroadcastChannel is
 * unavailable, e.g. some WebViews). Only lifecycle signals are broadcast —
 * never key material or note content.
 *
 * MVP concurrency model is single-writer-ish: a lock in one tab locks every
 * tab, and an unlock elsewhere notifies the user. Full conflict resolution
 * between tabs is out of scope.
 */

const CHANNEL_NAME = "catalyzer-notes-vault";

export type VaultBroadcastMessage =
  | { type: "locked" }
  | { type: "unlocked" }
  | { type: "notes-changed" };

type Listener = (message: VaultBroadcastMessage) => void;

let channel: BroadcastChannel | null = null;
const listeners = new Set<Listener>();

function ensureChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<VaultBroadcastMessage>) => {
      for (const listener of listeners) {
        listener(event.data);
      }
    };
  }
  return channel;
}

export function broadcastVaultMessage(message: VaultBroadcastMessage): void {
  ensureChannel()?.postMessage(message);
}

export function subscribeVaultBroadcast(listener: Listener): () => void {
  ensureChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
