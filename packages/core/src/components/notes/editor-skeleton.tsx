import { Skeleton } from "@workspace/ui/components/skeleton";

export function EditorSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3 py-4">
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
