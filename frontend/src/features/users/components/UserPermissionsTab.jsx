import React from 'react';
import Card from '../../../components/ui/Card';

export default function UserPermissionsTab({ userRoles = [] }) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
        <span>🛡️</span> Security Roles & Access Rights
      </h3>

      {userRoles.length === 0 ? (
        <p className="text-xs text-muted-foreground">No explicit roles assigned to this user.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userRoles.map((ur, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-muted800/40 border border-border space-y-2">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>🛡️</span> {ur.role?.name || 'Security Role'}
              </div>
              {ur.role?.description && (
                <p className="text-xs text-muted-foreground">{ur.role.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
