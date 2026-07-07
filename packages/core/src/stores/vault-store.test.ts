import { createMemoryNotesRepository } from "@workspace/core/features/notes/repositories/memory-notes-repository";
import { setNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { searchNotes } from "@workspace/core/features/notes/services/search-service";
import { hasActiveSession } from "@workspace/core/features/notes/services/session-key-service";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { beforeEach, describe, expect, it } from "vitest";

const PASSWORD = "test-master-password";

describe("vault store", () => {
  beforeEach(() => {
    setNotesRepository(createMemoryNotesRepository());
    useNotesStore.getState().reset();
    useVaultStore.setState({
      status: "initializing",
      vaultName: null,
      error: null,
      failedAttempts: 0,
      sessionStartedAt: null,
      lastActivityAt: null,
    });
  });

  it("is uninitialized when no header exists", async () => {
    await useVaultStore.getState().initialize();
    expect(useVaultStore.getState().status).toBe("uninitialized");
  });

  it("creates a vault, bootstraps a welcome note and unlocks", async () => {
    await useVaultStore.getState().initialize();
    await useVaultStore
      .getState()
      .createVault({ vaultName: "Kasa", password: PASSWORD });
    expect(useVaultStore.getState().status).toBe("unlocked");
    expect(useVaultStore.getState().vaultName).toBe("Kasa");
    expect(hasActiveSession()).toBe(true);
    expect(Object.keys(useNotesStore.getState().notes).length).toBe(1);
  });

  it("is locked after re-initialize and unlocks with the right password", async () => {
    await useVaultStore.getState().initialize();
    await useVaultStore
      .getState()
      .createVault({ vaultName: null, password: PASSWORD });
    useVaultStore.getState().lock();
    await new Promise((resolve) => setTimeout(resolve, 20));

    await useVaultStore.getState().initialize();
    expect(useVaultStore.getState().status).toBe("locked");
    expect(hasActiveSession()).toBe(false);

    await useVaultStore.getState().unlock(PASSWORD);
    expect(useVaultStore.getState().status).toBe("unlocked");
    expect(Object.keys(useNotesStore.getState().notes).length).toBe(1);
  });

  it("stays locked on a wrong password and does not corrupt state", async () => {
    await useVaultStore.getState().initialize();
    await useVaultStore
      .getState()
      .createVault({ vaultName: null, password: PASSWORD });
    useVaultStore.getState().lock();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await useVaultStore.getState().initialize();

    await useVaultStore.getState().unlock("wrong-password");
    const state = useVaultStore.getState();
    expect(state.status).toBe("locked");
    expect(state.error).toBe("wrongPassword");
    expect(state.failedAttempts).toBe(1);
    expect(hasActiveSession()).toBe(false);
    expect(Object.keys(useNotesStore.getState().notes).length).toBe(0);
  });

  it("clears decrypted notes, session key and search index on lock", async () => {
    await useVaultStore.getState().initialize();
    await useVaultStore
      .getState()
      .createVault({ vaultName: null, password: PASSWORD });
    useNotesStore
      .getState()
      .updateNoteTitle(
        Object.keys(useNotesStore.getState().notes)[0] ?? "",
        "Çok gizli başlık"
      );
    await useNotesStore.getState().flushPendingSaves();
    expect(searchNotes("gizli").length).toBe(1);

    useVaultStore.getState().lock();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(useVaultStore.getState().status).toBe("locked");
    expect(hasActiveSession()).toBe(false);
    expect(Object.keys(useNotesStore.getState().notes).length).toBe(0);
    expect(searchNotes("gizli").length).toBe(0);
  });

  it("changes the password: new unlocks, old is rejected", async () => {
    await useVaultStore.getState().initialize();
    await useVaultStore
      .getState()
      .createVault({ vaultName: null, password: PASSWORD });
    await useVaultStore.getState().changePassword({
      currentPassword: PASSWORD,
      newPassword: "brand-new-password",
    });
    useVaultStore.getState().lock();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await useVaultStore.getState().initialize();

    await useVaultStore.getState().unlock(PASSWORD);
    expect(useVaultStore.getState().status).toBe("locked");

    await useVaultStore.getState().unlock("brand-new-password");
    expect(useVaultStore.getState().status).toBe("unlocked");
    // Existing notes decrypt without re-encryption.
    expect(Object.keys(useNotesStore.getState().notes).length).toBe(1);
  });
});
