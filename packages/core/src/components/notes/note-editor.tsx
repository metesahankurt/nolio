"use client";

import { EditorSkeleton } from "@workspace/core/components/notes/editor-skeleton";
import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import { useMounted } from "@workspace/core/hooks/use-mounted";
import { lazy, Suspense } from "react";

/**
 * BlockNote is client-only and heavy, so it is loaded lazily and only
 * after mount: decrypted note content must never appear in server-rendered
 * HTML, and the editor bundle must not leak into unrelated routes. (This
 * component is only ever mounted while the vault is unlocked, which cannot
 * happen during SSR — the mounted guard is defense in depth.)
 */
const LazyNoteEditor = lazy(() =>
  import("@workspace/core/components/notes/note-editor-client").then((mod) => ({
    default: mod.NoteEditorClient,
  }))
);

export function NoteEditor({ note }: { note: DecryptedNote }) {
  const mounted = useMounted();
  if (!mounted) {
    return <EditorSkeleton />;
  }
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <LazyNoteEditor note={note} />
    </Suspense>
  );
}
