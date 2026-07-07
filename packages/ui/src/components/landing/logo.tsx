import { cn } from "@workspace/ui/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <span
    aria-label="Nolio logo"
    className={cn(
      "inline-flex size-6 shrink-0 items-center justify-center",
      className
    )}
    role="img"
  >
    <span
      aria-hidden="true"
      className="block size-full bg-center bg-contain bg-no-repeat [background-image:url('/nolio-logo-black.png')] dark:hidden"
    />
    <span
      aria-hidden="true"
      className="hidden size-full bg-center bg-contain bg-no-repeat [background-image:url('/nolio-logo-white.png')] dark:block"
    />
  </span>
);
