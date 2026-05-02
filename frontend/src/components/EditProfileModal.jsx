import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { profileService } from "../api/profileService";

const MAX_BIO = 200;

/**
 * Modal for editing username, bio, and profile picture.
 *
 * Props:
 *  - profile   : current user profile object
 *  - onClose   : () => void
 *  - onSaved   : (updatedUser) => void
 */
function EditProfileModal({ profile, onClose, onSaved }) {
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [profilePic, setProfilePic] = useState(profile.profilePic || "");
  const [previewUrl, setPreviewUrl] = useState(profile.profilePic || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // ── Image selection & upload ─────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);
    try {
      const { url } = await profileService.uploadProfileImage(file);
      setProfilePic(url);
      setPreviewUrl(url);
      toast.success("Image uploaded!");
    } catch (err) {
      const msg = err.response?.data?.message || "Image upload failed";
      toast.error(msg);
      // Revert preview on failure
      setPreviewUrl(profile.profilePic || "");
      setProfilePic(profile.profilePic || "");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!username.trim()) {
      errs.username = "Username is required";
    } else if (username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (username.trim().length > 30) {
      errs.username = "Username cannot exceed 30 characters";
    }
    if (bio.length > MAX_BIO) {
      errs.bio = `Bio cannot exceed ${MAX_BIO} characters`;
    }
    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await profileService.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        profilePic,
      });

      // Persist updated user in localStorage so auth state stays fresh
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...parsed, username: updatedUser.username })
        );
      }

      toast.success("Profile updated!");
      onSaved(updatedUser);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || uploading;
  const bioNearLimit = bio.length > MAX_BIO * 0.85;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">Edit Profile</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isDisabled}
          >
            ✕
          </button>
        </div>

        {/* Avatar upload */}
        <div className="image-upload-area">
          <div
            className="image-preview-wrapper"
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Change profile picture"
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="image-preview"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div className="image-preview-fallback">
                {username.charAt(0) || "?"}
              </div>
            )}
            <div className="image-upload-overlay" aria-hidden="true">
              {/* Camera icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {uploading ? (
            <div className="uploading-indicator">
              <div className="spinner-small" />
              Uploading…
            </div>
          ) : (
            <p className="upload-hint">
              <span onClick={() => fileInputRef.current?.click()}>Click the photo</span> to change it
              <br />JPG, PNG, WebP or GIF · max 5 MB
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="edit-username">Username</label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((p) => ({ ...p, username: "" }));
              }}
              className={`form-input ${errors.username ? "error" : ""}`}
              placeholder="Your username"
              maxLength={30}
              disabled={isDisabled}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (errors.bio) setErrors((p) => ({ ...p, bio: "" }));
              }}
              className={`form-input ${errors.bio ? "error" : ""}`}
              placeholder="Tell the world about yourself…"
              rows={3}
              maxLength={MAX_BIO}
              disabled={isDisabled}
              style={{ resize: "vertical", minHeight: "80px" }}
            />
            <div className={`char-count ${bioNearLimit ? "near-limit" : ""}`}>
              {bio.length} / {MAX_BIO}
            </div>
            {errors.bio && <span className="error-text">{errors.bio}</span>}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isDisabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isDisabled}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
