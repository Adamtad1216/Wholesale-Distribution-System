import React from 'react';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Info' },
  { id: 'security', label: 'Security & Password' },
  { id: 'activity', label: 'Activity' },
];

export default function ProfileTabsNav({ activeTab, setActiveTab }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`profile-tab${activeTab === tab.id ? ' active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
