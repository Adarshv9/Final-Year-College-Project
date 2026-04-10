// Skeleton placeholder components used while data-heavy screens are loading.
export function Skeleton({ className = '', height, width, rounded = 'lg' }) {
  const radiusMap = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };
  return (
    <div
      className={[
        'animate-shimmer',
        radiusMap[rounded] || 'rounded-lg',
        className,
      ].join(' ')}
      style={{ height, width }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 flex-shrink-0" rounded="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-5 w-16" rounded="full" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#1e2a3d]">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-6 w-16" rounded="full" />
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-6 space-y-3">
          <Skeleton className="h-9 w-9" rounded="md" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
