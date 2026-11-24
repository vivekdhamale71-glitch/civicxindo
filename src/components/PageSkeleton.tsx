import { Skeleton } from "./ui/misc";

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="mb-6 h-9 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4">
            <Skeleton className="mb-4 aspect-[16/10] w-full" />
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
