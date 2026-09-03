import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function UserListTable({
  users,
  loading,
  canUpdate,
  canDelete,
  handleOpenForm,
  handleDelete,
  handleViewDetail,
}) {
  if (loading) {
    return (
      <Card className="p-12 text-center border border-border">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-muted-foreground">Loading system user accounts...</p>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-12 text-center border border-border space-y-3">
        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl mx-auto">
          👤
        </div>
        <h3 className="text-base font-bold text-foreground">No Users Found</h3>
        <p className="text-xs text-muted-foreground">No system users match the selected search or role criteria.</p>
      </Card>
    );
  }

  return (
    <Card noPadding className="border border-border rounded-2xl overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted800/50">
            <TableHead className="py-3.5 text-xs font-bold text-foreground">User Identity</TableHead>
            <TableHead className="py-3.5 text-xs font-bold text-foreground">Contact Email</TableHead>
            <TableHead className="py-3.5 text-xs font-bold text-foreground">Assigned Roles</TableHead>
            <TableHead className="py-3.5 text-xs font-bold text-foreground">Account Status</TableHead>
            <TableHead className="py-3.5 text-xs font-bold text-foreground text-left pl-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const personName = u.person
              ? `${u.person.firstName || ''} ${u.person.lastName || ''}`.trim()
              : u.username;

            const userRoles = u.userRoles && u.userRoles.length > 0
              ? u.userRoles.map((ur) => ur.role?.name).filter(Boolean)
              : [u.role?.name || u.roleName || 'System User'];

            const isActive = u.isActive !== false && u.status !== 'INACTIVE' && u.status !== 'SUSPENDED';
            return (
              <TableRow key={u.id} className="hover:bg-muted800/30 transition">
                <TableCell className="py-4">
                  <div>
                    <div className="font-bold text-foreground text-sm">
                      {personName || u.username}
                    </div>
                    {u.person?.phone && (
                      <div className="text-xs text-muted-foreground mt-0.5">📞 {u.person.phone}</div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-4 text-xs font-medium text-foreground">
                  {u.person?.email || u.email || 'No email associated'}
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {userRoles.map((r, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </TableCell>

                <TableCell className="py-4 text-left pl-4">
                  <div className="flex items-center justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewDetail(u)}
                      className="px-3 py-1.5 rounded-xl bg-muted800 hover:bg-muted text-indigo-400 hover:text-indigo-300 border border-border transition text-xs font-bold flex items-center gap-1"
                      title="View Full User Details"
                    >
                      👁️ Details
                    </button>

                    {canUpdate && (
                      <Button
                        onClick={() => handleOpenForm(u)}
                        variant="secondary"
                        size="sm"
                        className="rounded-xl text-xs font-bold"
                      >
                        Edit
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        onClick={() => handleDelete(u.id, u.username)}
                        variant="danger"
                        size="sm"
                        className="rounded-xl text-xs font-bold"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
