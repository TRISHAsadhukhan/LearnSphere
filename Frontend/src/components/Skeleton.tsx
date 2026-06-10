interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'line' | 'circle' | 'table';
}

export default function Skeleton({ className = '', variant = 'card' }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div className={`animate-pulse bg-gray-200/55 rounded-full ${className}`} />
    );
  }

  if (variant === 'line') {
    return (
      <div className={`animate-pulse bg-gray-200/55 rounded-lg h-4 ${className}`} />
    );
  }

  if (variant === 'table') {
    return (
      <div className="w-full space-y-4" id="table-skeleton-group">
        <div className="flex gap-4 p-4 border-b border-gray-100 animate-pulse bg-white rounded-xl">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/12 ml-auto" />
        </div>
        <div className="flex gap-4 p-4 border-b border-gray-100 animate-pulse bg-white/70 rounded-xl">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/12 ml-auto" />
        </div>
        <div className="flex gap-4 p-4 border-b border-gray-100 animate-pulse bg-white/40 rounded-xl">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/12 ml-auto" />
        </div>
      </div>
    );
  }

  // default card skeleton
  return (
    <div className={`glass-card p-6 flex flex-col justify-between animate-pulse bg-white ${className}`} id="card-skeleton">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
      <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded w-12" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded-full w-10" />
      </div>
    </div>
  );
}
