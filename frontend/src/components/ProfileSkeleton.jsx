/**
 * Loading skeleton shown while profile data is being fetched.
 */
function ProfileSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-bio" />
      <div className="skeleton skeleton-bio-2" />
      <div className="skeleton skeleton-stats" />
      <div className="skeleton skeleton-btn" />
    </div>
  );
}

export default ProfileSkeleton;
