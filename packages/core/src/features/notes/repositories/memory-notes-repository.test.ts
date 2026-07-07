import { createMemoryNotesRepository } from "@workspace/core/features/notes/repositories/memory-notes-repository";
import { describeNotesRepositoryContract } from "@workspace/core/features/notes/repositories/notes-repository-contract";

describeNotesRepositoryContract("memory", () => createMemoryNotesRepository());
