"use client";

import { useTranslations } from "@workspace/i18n";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Lightweight strength estimate (length + character variety). Purely
 * informative UI feedback — it is not a security gate and never leaves
 * the component. Strength is shown with both bars AND a text label, so
 * color is never the only indicator.
 */
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const DIGIT_REGEX = /\d/;
const SYMBOL_REGEX = /[^a-zA-Z\d]/;

export function estimatePasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) {
    return 0;
  }
  let variety = 0;
  if (LOWERCASE_REGEX.test(password)) {
    variety += 1;
  }
  if (UPPERCASE_REGEX.test(password)) {
    variety += 1;
  }
  if (DIGIT_REGEX.test(password)) {
    variety += 1;
  }
  if (SYMBOL_REGEX.test(password)) {
    variety += 1;
  }
  const score = password.length >= 12 ? variety : Math.min(variety, 2);
  if (password.length < 8 || score <= 1) {
    return 1;
  }
  if (score === 2 || password.length < 12) {
    return 2;
  }
  return 3;
}

const SEGMENTS = [1, 2, 3] as const;

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations("Notes");
  const strength = estimatePasswordStrength(password);
  if (strength === 0) {
    return null;
  }
  const labels = {
    1: t("password.strengthWeak"),
    2: t("password.strengthMedium"),
    3: t("password.strengthStrong"),
  } as const;

  return (
    <div className="flex items-center gap-2">
      <div aria-hidden="true" className="flex flex-1 gap-1">
        {SEGMENTS.map((segment) => (
          <div
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted",
              segment <= strength &&
                (strength === 1 ? "bg-destructive" : "bg-primary")
            )}
            key={segment}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-xs">{labels[strength]}</span>
    </div>
  );
}
