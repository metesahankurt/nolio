"use client";

import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

interface PasswordFieldProps {
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string | null;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

/**
 * Password input with visible label, show/hide toggle, Caps Lock warning
 * and aria-linked error message.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  autoFocus = false,
  disabled = false,
  error = null,
}: PasswordFieldProps) {
  const t = useTranslations("Notes");
  const inputId = useId();
  const errorId = useId();
  const capsId = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const describedBy =
    [error ? errorId : null, capsLock ? capsId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="pr-10"
          disabled={disabled}
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          type={visible ? "text" : "password"}
          value={value}
        />
        <Button
          aria-label={visible ? t("password.hide") : t("password.show")}
          className="absolute top-0 right-0 h-9 w-9 text-muted-foreground"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {capsLock && (
        <p
          className="flex items-center gap-1 text-muted-foreground text-xs"
          id={capsId}
        >
          <TriangleAlert aria-hidden="true" className="size-3" />
          {t("password.capsLock")}
        </p>
      )}
      {error && (
        <p className="text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
