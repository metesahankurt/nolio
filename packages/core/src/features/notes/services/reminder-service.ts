import type {
  DecryptedNote,
  NoteDocument,
  NoteElementNode,
  NoteNode,
  NoteReminder,
} from "@workspace/core/features/notes/domain/note-types";

const DEFAULT_RESET_TIME = "00:00";
const RESET_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function isElementNode(node: NoteNode): node is NoteElementNode {
  return "children" in node && Array.isArray(node.children);
}

function cloneNodeWithResetTodos(node: NoteNode): {
  changed: boolean;
  node: NoteNode;
} {
  if (!isElementNode(node)) {
    return { changed: false, node };
  }

  let changed = node.listStyleType === "todo" && node.checked === true;
  const children = node.children.map((child) => {
    const result = cloneNodeWithResetTodos(child);
    changed = changed || result.changed;
    return result.node;
  });

  if (!changed) {
    return { changed: false, node };
  }

  return {
    changed: true,
    node: {
      ...node,
      ...(node.listStyleType === "todo" ? { checked: false } : {}),
      children,
    },
  };
}

export function resetTodoChecks(content: NoteDocument): {
  changed: boolean;
  content: NoteDocument;
} {
  let changed = false;
  const next = content.map((node) => {
    const result = cloneNodeWithResetTodos(node);
    changed = changed || result.changed;
    return result.node as NoteDocument[number];
  });
  return { changed, content: changed ? next : content };
}

export function defaultReminder(now = new Date()): NoteReminder {
  return {
    enabled: true,
    frequency: "daily",
    daysOfWeek: [now.getDay()],
    resetTime: DEFAULT_RESET_TIME,
    lastResetAt: null,
  };
}

function parseResetTime(resetTime: string): { hours: number; minutes: number } {
  const match = RESET_TIME_PATTERN.exec(resetTime);
  const hours = match ? Number(match[1]) : Number.NaN;
  const minutes = match ? Number(match[2]) : Number.NaN;
  if (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  ) {
    return { hours, minutes };
  }
  return { hours: 0, minutes: 0 };
}

function occurrenceForDate(date: Date, resetTime: string): Date {
  const { hours, minutes } = parseResetTime(resetTime);
  const occurrence = new Date(date);
  occurrence.setHours(hours, minutes, 0, 0);
  return occurrence;
}

function isDueOccurrence(
  reminder: NoteReminder,
  occurrence: Date,
  now: Date
): boolean {
  if (occurrence.getTime() > now.getTime()) {
    return false;
  }
  if (!reminder.lastResetAt) {
    return true;
  }
  return new Date(reminder.lastResetAt).getTime() < occurrence.getTime();
}

export function getDueReminderOccurrence(
  reminder: NoteReminder | null | undefined,
  now = new Date()
): string | null {
  if (!reminder?.enabled) {
    return null;
  }

  if (reminder.frequency === "daily") {
    const occurrence = occurrenceForDate(now, reminder.resetTime);
    return isDueOccurrence(reminder, occurrence, now)
      ? occurrence.toISOString()
      : null;
  }

  const days = reminder.daysOfWeek.filter((day) => day >= 0 && day <= 6);
  if (days.length === 0 || !days.includes(now.getDay())) {
    return null;
  }

  const occurrence = occurrenceForDate(now, reminder.resetTime);
  return isDueOccurrence(reminder, occurrence, now)
    ? occurrence.toISOString()
    : null;
}

export function applyReminderReset(
  note: DecryptedNote,
  now = new Date()
): DecryptedNote | null {
  const dueAt = getDueReminderOccurrence(note.reminder, now);
  if (!(dueAt && note.reminder)) {
    return null;
  }

  const reset = resetTodoChecks(note.content);
  return {
    ...note,
    content: reset.content,
    reminder: {
      ...note.reminder,
      lastResetAt: dueAt,
    },
    updatedAt: reset.changed ? new Date().toISOString() : note.updatedAt,
  };
}
