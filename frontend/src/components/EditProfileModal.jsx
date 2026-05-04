import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { profileService } from "../api/profileService";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

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
          JSON.stringify({ ...parsed, username: updatedUser.username }),
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
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header row-between">
          <h2 className="modal-title" id="modal-title">
            Edit Profile
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isDisabled}
          >
            Close
          </Button>
        </div>

        <div className="modal-body stack-md">
          <div
            className="dropzone"
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Change profile picture"
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="cover-preview"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="avatar-fallback avatar-fallback-lg">
                {username.charAt(0) || "?"}
              </div>
            )}
          </div>

          {uploading ? (
            <div className="row-between">
              <div className="spinner" /> Uploading
            </div>
          ) : (
            <p className="field-note">
              Click the photo to change it. JPG, PNG, WebP or GIF, max 5 MB.
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            hidden
            onChange={handleFileChange}
          />

          <form onSubmit={handleSubmit} className="form-stack" noValidate>
            <div className="field">
              <label htmlFor="edit-username" className="field-label">
                Username
              </label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username)
                    setErrors((p) => ({ ...p, username: "" }));
                }}
                placeholder="Your username"
                maxLength={30}
                disabled={isDisabled}
              />
              {errors.username && (
                <span className="field-error">{errors.username}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="edit-bio" className="field-label">
                Bio
              </label>
              <Input
                multiline
                id="edit-bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors((p) => ({ ...p, bio: "" }));
                }}
                placeholder="Tell the world about yourself…"
                rows={3}
                maxLength={MAX_BIO}
                disabled={isDisabled}
              />
              <div className="field-note">
                {bio.length} / {MAX_BIO}
              </div>
              {errors.bio && <span className="field-error">{errors.bio}</span>}
            </div>

            <div className="modal-footer">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isDisabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isDisabled}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default EditProfileModal;
