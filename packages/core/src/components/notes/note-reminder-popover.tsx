"use client";

import type {
  DecryptedNote,
  NoteReminder,
} from "@workspace/core/features/notes/domain/note-types";
import { defaultReminder } from "@workspace/core/features/notes/services/reminder-service";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { Bell, BellOff } from "lucide-react";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

function dayLabel(locale: string, day: number): string {
  const date = new Date(2024, 0, day === 0 ? 7 : day);
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

function withReminderPatch(
  reminder: NoteReminder | null | undefined,
  patch: Partial<NoteReminder>
): NoteReminder {
  return {
    ...defaultReminder(),
    ...reminder,
    ...patch,
  };
}

export function NoteReminderPopover({ note }: { note: DecryptedNote }) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const updateNoteReminder = useNotesStore((s) => s.updateNoteReminder);
  const reminder = note.reminder?.enabled ? note.reminder : null;
  const activeReminder = withReminderPatch(reminder, {});
  const isWeekly = activeReminder.frequency === "weekly";

  const setReminder = (patch: Partial<NoteReminder>) => {
    updateNoteReminder(note.id, withReminderPatch(activeReminder, patch));
  };

  const toggleDay = (day: number) => {
    const current = new Set(activeReminder.daysOfWeek);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    const next = [...current].sort((a, b) => a - b);
    setReminder({ daysOfWeek: next.length > 0 ? next : [new Date().getDay()] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <Button
          aria-label={t("reminders.configure")}
          size="icon"
          type="button"
          variant={reminder ? "secondary" : "ghost"}
        >
          {reminder ? <Bell /> : <BellOff />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-sm">{t("reminders.title")}</h2>
            <p className="mt-1 text-muted-foreground text-xs">
              {t("reminders.description")}
            </p>
          </div>

          <Label className="justify-between rounded-md border p-3">
            <span>{t("reminders.enabled")}</span>
            <Checkbox
              checked={Boolean(reminder)}
              onCheckedChange={(checked) => {
                updateNoteReminder(
                  note.id,
                  checked === true ? defaultReminder() : null
                );
              }}
            />
          </Label>

          <div className="grid gap-2">
            <Label>{t("reminders.frequency")}</Label>
            <Select
              disabled={!reminder}
              onValueChange={(value) => {
                setReminder({
                  frequency: value === "weekly" ? "weekly" : "daily",
                  daysOfWeek:
                    value === "weekly" ? activeReminder.daysOfWeek : [],
                });
              }}
              value={activeReminder.frequency}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("reminders.daily")}</SelectItem>
                <SelectItem value="weekly">{t("reminders.weekly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note-reminder-time">
              {t("reminders.resetTime")}
            </Label>
            <Input
              disabled={!reminder}
              id="note-reminder-time"
              onChange={(event) =>
                setReminder({ resetTime: event.target.value })
              }
              type="time"
              value={activeReminder.resetTime}
            />
          </div>

          {isWeekly && (
            <div className="grid gap-2">
              <Label>{t("reminders.days")}</Label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => {
                  const selected = activeReminder.daysOfWeek.includes(day);
                  return (
                    <Button
                      className={cn("h-8 px-0", selected && "font-semibold")}
                      disabled={!reminder}
                      key={day}
                      onClick={() => toggleDay(day)}
                      size="sm"
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                    >
                      {dayLabel(locale, day)}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {reminder?.lastResetAt && (
            <p className="text-muted-foreground text-xs">
              {t("reminders.lastReset", {
                date: new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(reminder.lastResetAt)),
              })}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
