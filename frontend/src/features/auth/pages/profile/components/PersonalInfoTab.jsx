import React, { useRef } from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function PersonalInfoTab({ personData, setPersonData, onSubmit, saving, onAvatarUpload }) {
  const fileInputRef = useRef(null);

  const inputCls =
    'w-full px-4 py-2.5 rounded-lg border font-medium text-sm outline-none ' +
    'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (onAvatarUpload) {
        onAvatarUpload(file);
      }
    }
  };

  return (
    <Card className="space-y-6 max-w-3xl border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <p className="text-sm font-medium text-muted">Update your profile details and personal information</p>
      </div>

      {/* Profile Picture Upload Block */}
      <div className="profile-card-bg flex items-center gap-4 p-4 rounded-xl border shadow-sm">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-2 ring-emerald-500">
          {personData.avatarUrl ? (
            <img src={personData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
          ) : (
            (personData.firstName?.[0] || 'U') + (personData.lastName?.[0] || '')
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-white">Profile Picture</label>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm"
            >
              Upload New Photo
            </button>
            {personData.avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setPersonData({ ...personData, avatarUrl: '' });
                  if (onAvatarUpload) onAvatarUpload('');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-white bg-rose-50 dark:bg-rose-600/80 border border-rose-200 dark:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-600 transition-all cursor-pointer shadow-xs"
              >
                Remove
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1">First Name</label>
            <input
              type="text"
              value={personData.firstName}
              onChange={(e) => setPersonData({ ...personData, firstName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1">Last Name</label>
            <input
              type="text"
              value={personData.lastName}
              onChange={(e) => setPersonData({ ...personData, lastName: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1">Email Address</label>
            <input
              type="email"
              value={personData.email}
              onChange={(e) => setPersonData({ ...personData, email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1">Phone Number</label>
            <input
              type="text"
              value={personData.phone}
              onChange={(e) => setPersonData({ ...personData, phone: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1">Address / Location</label>
          <input
            type="text"
            value={personData.address}
            onChange={(e) => setPersonData({ ...personData, address: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1">Bio</label>
          <textarea
            rows="3"
            value={personData.bio}
            onChange={(e) => setPersonData({ ...personData, bio: e.target.value })}
            placeholder="Add a brief bio..."
            className={inputCls}
          />
        </div>
        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
