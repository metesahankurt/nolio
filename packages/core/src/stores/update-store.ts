import { create } from "zustand";

/**
 * In-app update flow state. `useAppUpdater` populates this when the Tauri
 * updater finds a release; the UpdateDialog renders it with the app's own
 * design system instead of a native OS prompt. Install/relaunch stays in
 * the closure provided by the hook so this store has no Tauri imports.
 */

export interface AvailableUpdateInfo {
  body?: string;
  date?: string;
  version: string;
}

export type UpdatePhase = "idle" | "available" | "downloading" | "installing";

interface UpdateState {
  available: AvailableUpdateInfo | null;
  dismiss(): void;
  install: (() => Promise<void>) | null;
  offerUpdate(info: AvailableUpdateInfo, install: () => Promise<void>): void;
  phase: UpdatePhase;
  /** Fraction 0..1 while downloading; null when the size is unknown. */
  progress: number | null;
  setPhase(phase: UpdatePhase): void;
  setProgress(progress: number | null): void;
}

export const useUpdateStore = create<UpdateState>()((set) => ({
  available: null,
  install: null,
  phase: "idle",
  progress: null,

  offerUpdate(info, install) {
    set({ available: info, install, phase: "available", progress: null });
  },

  setPhase(phase) {
    set({ phase });
  },

  setProgress(progress) {
    set({ progress });
  },

  dismiss() {
    set({ available: null, install: null, phase: "idle", progress: null });
  },
}));
