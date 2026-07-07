"use client";

import { PasswordField } from "@workspace/core/components/notes/password-field";
import { PasswordStrength } from "@workspace/core/components/notes/password-strength";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2, NotebookPen, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

export function CreateVaultScreen() {
  const t = useTranslations("Notes");
  const createVault = useVaultStore((s) => s.createVault);
  const nameId = useId();
  const consentId = useId();

  const [vaultName, setVaultName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm &&
    consent &&
    !submitting;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    createVault(
      {
        vaultName: vaultName.trim() === "" ? null : vaultName.trim(),
        password,
      },
      {
        title: t("welcome.title"),
        paragraphs: [
          t("welcome.paragraph1"),
          t("welcome.paragraph2"),
          t("welcome.paragraph3"),
        ],
      }
    ).catch(() => {
      setFormError(t("setup.error"));
      setSubmitting(false);
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="!flex !flex-col !items-center !justify-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NotebookPen aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{t("setup.title")}</CardTitle>
          <CardDescription>{t("setup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={nameId}>{t("setup.vaultName")}</Label>
              <Input
                autoComplete="off"
                disabled={submitting}
                id={nameId}
                maxLength={64}
                onChange={(event) => setVaultName(event.target.value)}
                placeholder={t("setup.vaultNamePlaceholder")}
                value={vaultName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <PasswordField
                autoComplete="new-password"
                disabled={submitting}
                label={t("setup.password")}
                onChange={setPassword}
                value={password}
              />
              <PasswordStrength password={password} />
            </div>
            <PasswordField
              autoComplete="new-password"
              disabled={submitting}
              error={passwordsMismatch ? t("setup.passwordMismatch") : null}
              label={t("setup.passwordConfirm")}
              onChange={setConfirm}
              value={confirm}
            />
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("setup.recoveryWarning")}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                checked={consent}
                disabled={submitting}
                id={consentId}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <Label
                className="font-normal text-muted-foreground text-xs leading-relaxed"
                htmlFor={consentId}
              >
                {t("setup.consent")}
              </Label>
            </div>
            {formError && (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            )}
            <Button disabled={!canSubmit} type="submit">
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? t("setup.creating") : t("setup.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
