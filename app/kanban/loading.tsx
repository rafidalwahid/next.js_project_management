import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
        <div className="container flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="hidden md:flex gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <div className="grid flex-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-muted/40 md:block">
          <div className="flex flex-col gap-2 p-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
        </aside>
        <main className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-80" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <div className="bg-gray-50 rounded-lg p-4 h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array(3)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton key={j} className="h-32 w-full rounded-lg" />
                        ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </main>
      </div>
    </div>
  )
}
