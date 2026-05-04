function PostSkeleton() {
  return (
    <div className="post-card">
      <div className="post-header row-start">
        <div className="skeleton avatar" />
        <div className="stack-xs flex-1">
          <div className="skeleton skeleton-h-14 skeleton-w-112" />
          <div className="skeleton skeleton-h-10 skeleton-w-72" />
        </div>
      </div>
      <div className="skeleton post-media radius-0" />
      <div className="post-body stack-sm">
        <div className="row-start">
          <div className="skeleton skeleton-h-16 skeleton-w-52" />
          <div className="skeleton skeleton-h-16 skeleton-w-64" />
        </div>
        <div className="skeleton skeleton-h-14 skeleton-w-76" />
      </div>
    </div>
  );
}

export default PostSkeleton;
