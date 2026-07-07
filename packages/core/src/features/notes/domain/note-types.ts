/**
 * The persisted note content is the BlockNote block tree, stored as JSON.
 * This structural type mirrors the serialized shape of BlockNote's `Block`
 * so the domain layer stays decoupled from the editor schema module, while
 * remaining assignable from the editor's typed document.
 */
export interface NoteContentBlock {
  children: NoteContentBlock[];
  content?: unknown;
  id: string;
  props: Record<string, boolean | number | string>;
  type: string;
}

export type BlockNoteDocument = NoteContentBlock[];

export interface DecryptedNote {
  content: BlockNoteDocument;
  cover?: string;
  createdAt: string;
  deletedAt: string | null;
  icon?: string;
  id: string;
  isArchived: boolean;
  isFavorite: boolean;
  parentId: string | null;
  tags: string[];
  title: string;
  updatedAt: string;
}

export interface EncryptedNotePayloadV1 {
  note: DecryptedNote;
  schemaVersion: 1;
}

export interface EncryptedNoteRecord {
  ciphertext: string;
  encryptionVersion: 1;
  id: string;
  iv: string;
}
