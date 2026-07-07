import "fake-indexeddb/auto";
import { describeNotesRepositoryContract } from "@workspace/core/features/notes/repositories/notes-repository-contract";
import { IDBFactory } from "fake-indexeddb";
import { createIndexedDbNotesRepository } from "./indexeddb-notes-repository";

describeNotesRepositoryContract("indexeddb", () => {
  // Fresh database per test so cases stay independent.
  globalThis.indexedDB = new IDBFactory();
  return createIndexedDbNotesRepository();
});
