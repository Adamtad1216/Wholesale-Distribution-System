import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function BranchDetailModal({
  isOpen = false,
  onClose,
  branch = null,
  onEdit,
  canUpdate = false,
}) {
  if (!isOpen || !branch) return null;

  const managerName = branch.manager?.person
    ? `${branch.manager.person.firstName || ''} ${branch.manager.person.lastName || ''}`.trim()
    : branch.manager?.name || null;

  const creatorName = branch.createdBy?.person
    ? `${branch.createdBy.person.firstName || ''} ${branch.createdBy.person.lastName || ''}`.trim()
    : null;

  const updaterName = branch.updatedBy?.person
    ? `${branch.updatedBy.person.firstName || ''} ${branch.updatedBy.person.lastName || ''}`.trim()
    : null;

  const warehouses = Array.isArray(branch.warehouses) ? branch.warehouses : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={branch.name}
      subtitle={`Branch Code: ${branch.branchCode || branch.code || 'N/A'}`}
      icon="🏢"
      maxWidth="max-w-2xl"
      scope="workspace"
      footer={
        <div className="flex items-center justify-between w-full">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              branch.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                branch.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            {branch.status || 'ACTIVE'}
          </span>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {canUpdate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(branch);
                }}
              >
                Edit Branch
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Top Summary Banner */}
        <div className="p-3.5 rounded-xl bg-muted800/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Parent Enterprise / Company
            </span>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {branch.company?.name || 'Main Enterprise'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {branch.isHeadOffice && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <span>★</span> Headquarters / Main Office
              </span>
            )}
          </div>
        </div>

        {/* Location & Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Address Card */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>📍</span> Physical Location
            </h4>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Region:</span>
                <strong className="text-foreground">{branch.region?.name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>City:</span>
                <span className="text-foreground">{branch.city || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Sub-City / Woreda:</span>
                <span className="text-foreground">
                  {[branch.subCity, branch.woreda].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              {branch.kebele && (
                <div className="flex justify-between">
                  <span>Kebele / House:</span>
                  <span className="text-foreground">
                    {[branch.kebele, branch.houseNumber].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {branch.landmark && (
                <div className="pt-1 border-t border-border/50 text-[11px]">
                  <span>Landmark: </span>
                  <span className="text-foreground italic">{branch.landmark}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Leadership */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>👤</span> Management & Contact
            </h4>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Branch Manager:</span>
                <strong className="text-foreground">{managerName || 'Unassigned'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Phone:</span>
                <span className="font-mono text-foreground">{branch.phone || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Email:</span>
                <span className="text-foreground">{branch.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Warehouses Section */}
        <div className="p-3.5 rounded-xl bg-muted800/40 border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>🏬</span> Operating Warehouses Under This Branch
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              {warehouses.length} {warehouses.length === 1 ? 'warehouse' : 'warehouses'}
            </span>
          </div>

          {warehouses.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {warehouses.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="p-2.5 rounded-lg bg-muted900 border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{w.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted800 text-muted-foreground border border-border">
                      {w.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {w.location || w.city || 'Standard facility'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        w.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-700/20 text-slate-400'
                      }`}
                    >
                      {w.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-muted-foreground bg-muted900/60 rounded-lg border border-dashed border-border text-[11px]">
              No storage warehouses assigned to this branch yet.
            </div>
          )}
        </div>

        {/* Audit Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 gap-2">
          <div className="flex items-center gap-3">
            {creatorName && (
              <span>
                Created by: <strong className="text-foreground">{creatorName}</strong>
              </span>
            )}
            {updaterName && (
              <span>
                Updated by: <strong className="text-foreground">{updaterName}</strong>
              </span>
            )}
          </div>
          <div>
            <span>Added: {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}</span>
            {branch.updatedAt && (
              <span className="ml-2">
                (Updated: {new Date(branch.updatedAt).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
