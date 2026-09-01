import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera } from 'lucide-react';
import { useUpdateMyProfilePhotoMutation, useUploadFileMutation } from '../app/api/apiSlice';
import { updateUser } from '../app/authSlice';
import type { RootState } from '../app/store';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import { useTopbar } from '../layouts/topbar';

/**
 * Profile — no Figma frame exists for this screen; it follows the system set by
 * the other frames. Lets the signed-in admin swap their own profile photo.
 */
export default function Profile() {
  useTopbar({ title: 'Profile' });

  const dispatch = useDispatch();
  const admin = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [updateMyProfilePhoto, { isLoading: isSaving }] = useUpdateMyProfilePhotoMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!admin) return null;
  const name = `${admin.firstName} ${admin.lastName}`.trim();
  const isBusy = isUploading || isSaving;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadFile(formData).unwrap();
      const photoUrl = uploadRes.data.url;
      await updateMyProfilePhoto({ profilePhoto: photoUrl }).unwrap();
      dispatch(updateUser({ profilePhoto: photoUrl }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? 'Failed to update profile picture');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.08em] text-label uppercase">Account</p>
        <h2 className="mt-1 text-[35px] leading-tight font-bold text-ink">My Profile</h2>
      </div>

      <Card className="max-w-2xl">
        {error && (
          <div className="mb-4 rounded-lg bg-warn-bg px-3.5 py-2.5 text-sm font-medium text-warn-fg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok-fg">
            Profile picture updated successfully.
          </div>
        )}

        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={admin.profilePhoto}
              firstName={admin.firstName}
              lastName={admin.lastName}
              size={96}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              title="Change photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-action text-white ring-4 ring-card hover:bg-action-hover disabled:opacity-60"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{name}</h2>
            <p className="text-sm text-muted">{admin.email}</p>
            <p className="mt-1 text-xs font-medium tracking-[0.06em] text-label uppercase">{admin.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="mt-6 h-11 rounded-field border border-line px-5 text-sm font-medium text-body hover:bg-head-bg disabled:opacity-60"
        >
          {isBusy ? 'Uploading…' : 'Change Profile Picture'}
        </button>
      </Card>
    </div>
  );
}
