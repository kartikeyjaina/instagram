function PostSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton w-full h-64" style={{ borderRadius: 0 }} />
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="skeleton h-4 w-12 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

export default PostSkeleton;
