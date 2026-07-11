import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import {
  applyReminderReset,
  getDueReminderOccurrence,
} from "@workspace/core/features/notes/services/reminder-service";
import { describe, expect, it } from "vitest";

function sampleNote(patch: Partial<DecryptedNote> = {}): DecryptedNote {
  return {
    id: "note-1",
    title: "Tasks",
    content: [
      {
        type: "p",
        listStyleType: "todo",
        checked: true,
        children: [{ text: "Done task" }],
      },
      {
        type: "p",
        listStyleType: "todo",
        checked: false,
        children: [{ text: "Open task" }],
      },
    ],
    parentId: null,
    tags: [],
    isFavorite: false,
    isArchived: false,
    reminder: null,
    deletedAt: null,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...patch,
  };
}

describe("reminder-service", () => {
  it("resets checked to-dos once the daily reset time has passed", () => {
    const resetAt = new Date(2026, 6, 11, 0, 0, 0, 0).toISOString();
    const note = sampleNote({
      reminder: {
        enabled: true,
        frequency: "daily",
        daysOfWeek: [],
        resetTime: "00:00",
        lastResetAt: null,
      },
    });

    const updated = applyReminderReset(note, new Date(2026, 6, 11, 0, 1, 0, 0));

    expect(updated?.content[0]?.checked).toBe(false);
    expect(updated?.reminder?.lastResetAt).toBe(resetAt);
  });

  it("does not reset twice for the same occurrence", () => {
    const resetAt = new Date(2026, 6, 11, 0, 0, 0, 0).toISOString();
    const reminder = {
      enabled: true,
      frequency: "daily" as const,
      daysOfWeek: [],
      resetTime: "00:00",
      lastResetAt: resetAt,
    };

    expect(
      getDueReminderOccurrence(reminder, new Date(2026, 6, 11, 12, 0, 0, 0))
    ).toBeNull();
  });

  it("only resets weekly reminders on selected weekdays", () => {
    const mondayResetAt = new Date(2026, 6, 13, 0, 0, 0, 0).toISOString();
    const reminder = {
      enabled: true,
      frequency: "weekly" as const,
      daysOfWeek: [1],
      resetTime: "00:00",
      lastResetAt: null,
    };

    expect(
      getDueReminderOccurrence(reminder, new Date(2026, 6, 13, 0, 1, 0, 0))
    ).toBe(mondayResetAt);
    expect(
      getDueReminderOccurrence(reminder, new Date(2026, 6, 14, 0, 1, 0, 0))
    ).toBeNull();
  });
});
