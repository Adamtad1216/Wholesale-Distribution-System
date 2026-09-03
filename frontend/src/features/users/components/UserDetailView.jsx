import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import UserAvatar from './UserAvatar';
import UserStatusControl from './UserStatusControl';
import UserOverviewTab from './UserOverviewTab';
import UserPermissionsTab from './UserPermissionsTab';

export default function UserDetailView({
  user,
  handleBackToList,
  handleOpenForm,
  handleDelete,
  handleOpenResetPassword,
  handleStatusChange,
  canUpdate,
  canDelete,
}) {
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  if (!user) return null;

  const person = user.person || {};
  const userRoles = user.userRoles || [];
  const fullName = person.firstName
    ? `${person.firstName} ${person.middleName || ''} ${person.lastName || ''}`.replace(/\s+/g, ' ').trim()
    : user.username;

  const currentStatus = user.status || user.accountStatus || (user.isActive ? 'ACTIVE' : 'INACTIVE');
  const avatarUrl = person.avatarUrl || person.avatar || user.avatarUrl || user.avatar;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Back Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <button
            type="button"
            onClick={handleBackToList}
            className="px-3 py-1.5 rounded-xl bg-muted800 hover:bg-muted text-foreground border border-border transition inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            ← Back to User Directory
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenResetPassword(user)}
            variant="secondary"
            size="md"
            className="rounded-xl text-xs font-bold"
          >
            🔑 Reset Password
          </Button>

          {canUpdate && (
            <Button
              onClick={() => handleOpenForm(user)}
              variant="primary"
              size="md"
              className="rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20"
            >
              ✏️ Edit User Profile
            </Button>
          )}

          {canDelete && (
            <Button
              onClick={() => handleDelete(user.id, user.username)}
              variant="danger"
              size="md"
              className="rounded-xl text-xs font-bold"
            >
              🗑️ Delete Account
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar avatarUrl={avatarUrl} name={fullName} username={user.username} size="lg" />

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{fullName}</h1>
                
                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    currentStatus === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : currentStatus === 'SUSPENDED'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentStatus === 'ACTIVE'
                        ? 'bg-emerald-400'
                        : currentStatus === 'SUSPENDED'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  ></span>
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Username: <span className="text-indigo-400 font-semibold">@{user.username}</span> • ID: {user.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {userRoles.map((ur, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm"
              >
                🛡️ {ur.role?.name || ur.roleName || 'System User'}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Interactive Status Switcher */}
      <UserStatusControl
        user={user}
        handleStatusChange={handleStatusChange}
        canUpdate={canUpdate}
      />

      {/* Details Navigation Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          👤 Account & Personnel Profile
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'PERMISSIONS'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🛡️ Assigned Roles & Security
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === 'OVERVIEW' && (
        <UserOverviewTab
          user={user}
          person={person}
          currentStatus={currentStatus}
          fullName={fullName}
        />
      )}

      {activeTab === 'PERMISSIONS' && (
        <UserPermissionsTab userRoles={userRoles} />
      )}
    </div>
  );
}
