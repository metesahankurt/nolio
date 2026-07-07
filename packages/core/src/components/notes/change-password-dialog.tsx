"use client";

import { PasswordField } from "@workspace/core/components/notes/password-field";
import { PasswordStrength } from "@workspace/core/components/notes/password-strength";
import { WrongPasswordError } from "@workspace/core/features/notes/domain/errors";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MIN_PASSWORD_LENGTH = 8;

interface ChangePasswordDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const t = useTranslations("Notes");
  const changePassword = useVaultStore((s) => s.changePassword);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.length > 0 &&
    next.length >= MIN_PASSWORD_LENGTH &&
    next === confirm &&
    !submitting;

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setSubmitting(false);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    changePassword({ currentPassword: current, newPassword: next })
      .then(() => {
        toast.success(t("changePassword.success"));
        reset();
        onOpenChange(false);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof WrongPasswordError
            ? t("unlock.wrongPassword")
            : t("changePassword.error")
        );
        setSubmitting(false);
      });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset();
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changePassword.title")}</DialogTitle>
          <DialogDescription>
            {t("changePassword.description")}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <PasswordField
            autoComplete="current-password"
            disabled={submitting}
            error={error}
            label={t("changePassword.current")}
            onChange={setCurrent}
            value={current}
          />
          <div className="flex flex-col gap-2">
            <PasswordField
              autoComplete="new-password"
              disabled={submitting}
              label={t("changePassword.new")}
              onChange={setNext}
              value={next}
            />
            <PasswordStrength password={next} />
          </div>
          <PasswordField
            autoComplete="new-password"
            disabled={submitting}
            error={mismatch ? t("setup.passwordMismatch") : null}
            label={t("changePassword.confirm")}
            onChange={setConfirm}
            value={confirm}
          />
          <Button disabled={!canSubmit} type="submit">
            {submitting && <Loader2 className="animate-spin" />}
            {submitting
              ? t("changePassword.changing")
              : t("changePassword.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
