import type {
  EncryptedNotePayloadV1,
  EncryptedNoteRecord,
} from "@workspace/core/features/notes/domain/note-types";
import type {
  EncryptedVaultHeader,
  KdfConfig,
} from "@workspace/core/features/notes/domain/vault-types";
import { z } from "zod";

const MIN_PBKDF2_ITERATIONS = 100_000;
const MIN_ARGON2_MEMORY_KIB = 8192;

export const kdfConfigSchema: z.ZodType<KdfConfig> = z.discriminatedUnion(
  "algorithm",
  [
    z.object({
      algorithm: z.literal("argon2id"),
      salt: z.string().min(1),
      memoryKiB: z.number().int().min(MIN_ARGON2_MEMORY_KIB),
      iterations: z.number().int().min(2),
      parallelism: z.number().int().min(1),
    }),
    z.object({
      algorithm: z.literal("pbkdf2-sha256"),
      salt: z.string().min(1),
      iterations: z.number().int().min(MIN_PBKDF2_ITERATIONS),
    }),
  ]
);

export const encryptedVaultHeaderSchema: z.ZodType<EncryptedVaultHeader> =
  z.object({
    vaultVersion: z.literal(1),
    vaultName: z.string().nullable(),
    createdAt: z.string(),
    kdf: kdfConfigSchema,
    wrappedDataKey: z.object({
      algorithm: z.literal("AES-GCM"),
      iv: z.string().min(1),
      ciphertext: z.string().min(1),
    }),
    verificationPayload: z.object({
      iv: z.string().min(1),
      ciphertext: z.string().min(1),
    }),
  });

interface NoteTextShape {
  text: string;
  [key: string]: unknown;
}

interface NoteElementShape {
  children: NoteNodeShape[];
  type?: string;
  [key: string]: unknown;
}

type NoteNodeShape = NoteElementShape | NoteTextShape;

export const noteNodeSchema: z.ZodType<NoteNodeShape> = z.lazy(() =>
  z.union([
    z.object({ text: z.string() }).catchall(z.unknown()),
    z
      .object({
        type: z.string().optional(),
        children: z.array(noteNodeSchema),
      })
      .catchall(z.unknown()),
  ])
);

export const noteElementSchema: z.ZodType<NoteElementShape> = z
  .object({
    type: z.string().optional(),
    children: z.array(noteNodeSchema),
  })
  .catchall(z.unknown());

export const decryptedNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  icon: z.string().optional(),
  cover: z.string().optional(),
  content: z.array(noteElementSchema),
  parentId: z.string().nullable(),
  tags: z.array(z.string()),
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const encryptedNotePayloadSchema: z.ZodType<EncryptedNotePayloadV1> =
  z.object({
    schemaVersion: z.literal(1),
    note: decryptedNoteSchema,
  });

export const encryptedNoteRecordSchema: z.ZodType<EncryptedNoteRecord> =
  z.object({
    id: z.string().min(1),
    encryptionVersion: z.literal(1),
    iv: z.string().min(1),
    ciphertext: z.string().min(1),
  });
