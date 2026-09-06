import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function WarehouseDetailModal({
  isOpen = false,
  onClose,
  warehouse = null,
  onEdit,
  canUpdate = false,
}) {
  if (!isOpen || !warehouse) return null;

  const managerName = warehouse.manager?.person
    ? `${warehouse.manager.person.firstName || ''} ${warehouse.manager.person.lastName || ''}`.trim()
    : warehouse.manager?.name || null;

  const creatorName = warehouse.createdBy?.person
    ? `${warehouse.createdBy.person.firstName || ''} ${warehouse.createdBy.person.lastName || ''}`.trim()
    : null;

  const updaterName = warehouse.updatedBy?.person
    ? `${warehouse.updatedBy.person.firstName || ''} ${warehouse.updatedBy.person.lastName || ''}`.trim()
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse.name}
      subtitle={`Warehouse Code: ${warehouse.code || 'N/A'}`}
      icon="🏬"
      maxWidth="max-w-2xl"
      scope="workspace"
      footer={
        <div className="flex items-center justify-between w-full">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              warehouse.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                warehouse.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            {warehouse.status || 'ACTIVE'}
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
                  if (onEdit) onEdit(warehouse);
                }}
              >
                Edit Warehouse
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Parent Branch Card */}
        <div className="p-3.5 rounded-xl bg-muted800/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Assigned Parent Branch
            </span>
            <p className="text-sm font-bold text-foreground mt-0.5">
              {warehouse.branch?.name || 'Unassigned Branch'}
            </p>
            {warehouse.branch?.company?.name && (
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Enterprise: {warehouse.branch.company.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Facility: {warehouse.code}
            </span>
          </div>
        </div>

        {/* Location & Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Address Card */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>📍</span> Physical Facility Location
            </h4>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Region:</span>
                <strong className="text-foreground">{warehouse.region?.name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Location Note:</span>
                <span className="text-foreground">{warehouse.location || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>City / Sub-City:</span>
                <span className="text-foreground">
                  {[warehouse.city, warehouse.subCity].filter(Boolean).join(' • ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Woreda / Kebele:</span>
                <span className="text-foreground">
                  {[warehouse.woreda, warehouse.kebele].filter(Boolean).join(' • ') || '—'}
                </span>
              </div>
              {warehouse.houseNumber && (
                <div className="flex justify-between">
                  <span>House Number:</span>
                  <span className="text-foreground">{warehouse.houseNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Management */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>👤</span> Facility Custodian & Management
            </h4>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Warehouse Manager:</span>
                <strong className="text-foreground">{managerName || 'Unassigned'}</strong>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                The designated warehouse manager oversees receiving goods, staging preparation tasks, stock counts, and storage bin assignments.
              </p>
            </div>
          </div>
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
            <span>Added: {warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : 'N/A'}</span>
            {warehouse.updatedAt && (
              <span className="ml-2">
                (Updated: {new Date(warehouse.updatedAt).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
