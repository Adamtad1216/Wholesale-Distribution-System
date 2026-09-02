import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { authApi } from '../../authApi';
import { setProfile } from '../../authSlice';

import ProfileHeader from './components/ProfileHeader';
import ProfileTabsNav from './components/ProfileTabsNav';
import OverviewTab from './components/OverviewTab';
import PersonalInfoTab from './components/PersonalInfoTab';
import SecurityTab from './components/SecurityTab';
import ActivityTab from './components/ActivityTab';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, role, customer } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('overview');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const person = user?.person || {};
  const firstName = person.firstName || '';
  const lastName = person.lastName || '';
  const middleName = person.middleName || '';

  const [personData, setPersonData] = useState({
    firstName,
    middleName,
    lastName,
    email: person.email || user?.email || '',
    phone: person.phone || '',
    address: person.address || '',
    bio: person.bio || '',
    avatarUrl: person.avatarUrl || user?.avatarUrl || '',
  });

  // Load fresh profile from backend on component mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await authApi.getProfile();
        const data = res?.data || res;
        console.log('👤 [PROFILE RESPONSE FROM SERVER]:', data);
        if (data && isMounted) {
          dispatch(setProfile(data));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [dispatch]);

  // Sync state whenever Redux user updates
  useEffect(() => {
    if (user) {
      const p = user.person || {};
      setPersonData({
        firstName: p.firstName || '',
        middleName: p.middleName || '',
        lastName: p.lastName || '',
        email: p.email || user.email || '',
        phone: p.phone || '',
        address: p.address || '',
        bio: p.bio || '',
        avatarUrl: p.avatarUrl || user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (fileOrEmpty) => {
    if (!fileOrEmpty) {
      try {
        setPersonData((prev) => ({ ...prev, avatarUrl: '' }));
        await authApi.updateProfile({
          firstName: personData.firstName,
          middleName: personData.middleName,
          lastName: personData.lastName,
          email: personData.email,
          phone: personData.phone,
          address: personData.address,
          bio: personData.bio,
          avatarUrl: '',
        });
        const res = await authApi.getProfile();
        const data = res?.data || res;
        if (data) dispatch(setProfile(data));
        toast.success('Profile picture removed');
      } catch (err) {
        toast.error('Failed to remove profile picture');
      }
      return;
    }

    const uploadToast = toast.loading('Updating profile picture...');
    try {
      const formData = new FormData();
      formData.append('file', fileOrEmpty);
      formData.append('folder', 'Profile');

      const uploadRes = await authApi.uploadAvatar(formData);
      const cloudinaryUrl = uploadRes?.data?.data?.fileUrl || uploadRes?.data?.fileUrl;

      if (!cloudinaryUrl) {
        throw new Error('Cloudinary upload did not return a valid URL');
      }

      setPersonData((prev) => ({ ...prev, avatarUrl: cloudinaryUrl }));
      await authApi.updateProfile({
        firstName: personData.firstName,
        middleName: personData.middleName,
        lastName: personData.lastName,
        email: personData.email,
        phone: personData.phone,
        address: personData.address,
        bio: personData.bio,
        avatarUrl: cloudinaryUrl,
      });

      const res = await authApi.getProfile();
      const updatedData = res?.data || res;
      if (updatedData) dispatch(setProfile(updatedData));

      toast.success('Profile picture is updated successfully', { id: uploadToast });
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to upload profile picture', { id: uploadToast });
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = () => {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (user?.username) return user.username.slice(0, 2).toUpperCase();
    return 'AT';
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
       await authApi.updateProfile({
          firstName: personData.firstName,
          middleName: personData.middleName,
          lastName: personData.lastName,
          email: personData.email,
          phone: personData.phone,
          address: personData.address,
          bio: personData.bio,
          avatarUrl: personData.avatarUrl,
        });
      const res = await authApi.getProfile();
      const updatedData = res?.data || res;
      if (updatedData) dispatch(setProfile(updatedData));
      toast.success('Profile information updated successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return toast.error('New passwords do not match');
    if (!strongPasswordRegex.test(passwordData.newPassword))
      return toast.error(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
      );
    try {
      setSavingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toISOString().split('T')[0]
    : '2026-09-01';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <ProfileHeader
        user={user}
        role={role}
        personData={personData}
        joinedDate={joinedDate}
        getInitials={getInitials}
        onAvatarUpload={handleAvatarUpload}
      />

      {/* 2. Navigation Tabs */}
      <ProfileTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 3. Tab Contents */}
      {activeTab === 'overview' && (
        <OverviewTab
          personData={personData}
          user={user}
          role={role}
          customer={customer}
          onEditProfile={() => setActiveTab('personal')}
        />
      )}

      {activeTab === 'personal' && (
        <PersonalInfoTab
          personData={personData}
          setPersonData={setPersonData}
          onSubmit={handleUpdateProfile}
          saving={savingProfile}
          onAvatarUpload={handleAvatarUpload}
        />
      )}

      {activeTab === 'security' && (
        <SecurityTab
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          onSubmit={handleChangePassword}
          saving={savingPassword}
        />
      )}

      {activeTab === 'activity' && <ActivityTab user={user} personData={personData} customer={customer} />}
    </div>
  );
}
