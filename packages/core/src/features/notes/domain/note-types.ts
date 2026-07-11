export interface NoteTextNode {
  text: string;
  [key: string]: unknown;
}

export interface NoteElementNode {
  children: NoteNode[];
  type?: string;
  [key: string]: unknown;
}

export type NoteNode = NoteElementNode | NoteTextNode;
export type NoteDocument = NoteElementNode[];

export type NoteReminderFrequency = "daily" | "weekly";

export interface NoteReminder {
  daysOfWeek: number[];
  enabled: boolean;
  frequency: NoteReminderFrequency;
  lastResetAt: string | null;
  resetTime: string;
}

export interface DecryptedNote {
  content: NoteDocument;
  cover?: string;
  createdAt: string;
  deletedAt: string | null;
  icon?: string;
  id: string;
  isArchived: boolean;
  isFavorite: boolean;
  parentId: string | null;
  reminder?: NoteReminder | null;
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
