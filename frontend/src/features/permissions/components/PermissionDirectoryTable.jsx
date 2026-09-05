import React from 'react';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Card from '../../../components/ui/Card';

export default function PermissionDirectoryTable({
  permissions,
  roles,
  search,
  selectedModule,
  isPermissionAssigned,
  isWildcardRole,
}) {
  // Filter permissions directory
  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.module && p.module.toLowerCase().includes(search.toLowerCase()));

    const mod = (p.module || (p.name || '').split(':')[0] || 'system').toLowerCase();
    const matchesModule = selectedModule === 'ALL' || mod === selectedModule;

    return matchesSearch && matchesModule;
  });

  if (filteredPermissions.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl border border-border bg-card">
        No permissions found matching the criteria.
      </Card>
    );
  }

  return (
    <Card noPadding className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
      <Table containerClassName="rounded-xl">
        <TableHeader>
          <TableRow className="border-b border-border/80 bg-muted800/40">
            <TableHead className="font-bold text-foreground">Permission Key</TableHead>
            <TableHead className="font-bold text-foreground">Module</TableHead>
            <TableHead className="font-bold text-foreground">Description</TableHead>
            <TableHead className="font-bold text-foreground">Assigned Roles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPermissions.map((perm) => {
            // Find roles that have this permission
            const assignedRoles = roles.filter(
              (r) => isWildcardRole(r) || isPermissionAssigned(r, perm.id)
            );

            const mod = (perm.module || (perm.name || '').split(':')[0] || 'system').toUpperCase();

            return (
              <TableRow key={perm.id || perm.name} className="hover:bg-muted800/20 transition-colors">
                <TableCell className="font-mono font-bold text-emerald-400">
                  {perm.name || perm.key}
                </TableCell>

                <TableCell>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {mod}
                  </span>
                </TableCell>

                <TableCell className="text-muted-foreground text-xs">
                  {perm.description || 'No description provided.'}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1.5 max-w-md">
                    {assignedRoles.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    ) : (
                      assignedRoles.map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-card border border-border text-foreground"
                        >
                          {role.name}
                        </span>
                      ))
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
