export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="py-16 px-6 max-w-7xl mx-auto animate-pulse" aria-hidden>
      <div className="h-8 w-48 bg-surface rounded-lg mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-40 bg-surface rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
