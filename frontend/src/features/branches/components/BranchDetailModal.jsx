import React from 'react';
import {
  Building2,
  Warehouse,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
} from 'lucide-react';
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
      maxWidth="max-w-3xl"
      scope="workspace"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
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

            {branch.isHeadOffice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400" />
                Head Office
              </span>
            )}
          </div>

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
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{branch.name}</h3>
                {branch.isHeadOffice && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-wide flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    HQ Main Office
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Company: <span className="font-semibold text-foreground">{branch.company?.name || 'Main Enterprise'}</span>
                {' • '}
                Region: <span className="font-semibold text-foreground">{branch.region?.name || 'Unassigned'}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-card/80 border border-border text-center">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Facilities</span>
              <span className="font-mono text-sm font-bold text-sky-400">
                {warehouses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Leadership Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Physical Location Card */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Physical Location</h4>
            </div>

            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between items-center py-0.5">
                <span>Region</span>
                <strong className="text-foreground">{branch.region?.name || '—'}</strong>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>City</span>
                <span className="text-foreground font-medium">{branch.city || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Sub-City / Woreda</span>
                <span className="text-foreground">
                  {[branch.subCity, branch.woreda].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              {(branch.kebele || branch.houseNumber) && (
                <div className="flex justify-between items-center py-0.5">
                  <span>Kebele / House</span>
                  <span className="text-foreground">
                    {[branch.kebele, branch.houseNumber].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {branch.landmark && (
                <div className="pt-1.5 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Landmark: </span>
                  <span className="text-foreground italic">{branch.landmark}</span>
                </div>
              )}
            </div>
          </div>

          {/* Management & Contact Card */}
          <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <User className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">Leadership & Contact</h4>
            </div>

            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Branch Manager</span>
                {managerName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] border border-blue-500/30">
                      {managerName[0]}
                    </div>
                    <span className="font-semibold text-foreground">{managerName}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Unassigned</span>
                )}
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  Phone
                </span>
                <span className="font-mono text-foreground font-medium">{branch.phone || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  Email
                </span>
                <span className="text-foreground font-medium">{branch.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Warehouses Section (Elevated Modern View) */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Warehouse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Operating Warehouses & Storage Facilities
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Storage nodes linked to and serviced under this branch
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
              {warehouses.length} {warehouses.length === 1 ? 'warehouse' : 'warehouses'}
            </span>
          </div>

          {warehouses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {warehouses.map((wh) => {
                const whMgr = wh.manager?.person
                  ? `${wh.manager.person.firstName || ''} ${wh.manager.person.lastName || ''}`.trim()
                  : wh.manager?.name || 'Unassigned';

                const locationStr = [wh.city, wh.subCity, wh.location]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <div
                    key={wh.id}
                    className="p-3 rounded-xl border border-border/70 bg-muted800/30 hover:border-sky-500/30 hover:bg-muted800/60 transition flex flex-col justify-between group shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                            <Warehouse className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block text-xs group-hover:text-sky-400 transition-colors">
                              {wh.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {wh.code}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${
                            wh.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full mr-1 ${
                              wh.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
                            }`}
                          />
                          {wh.status || 'ACTIVE'}
                        </span>
                      </div>

                      {locationStr && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-1">
                          <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{locationStr}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 opacity-60" />
                        Manager:
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[140px]" title={whMgr}>
                        {whMgr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground bg-muted900/40 rounded-xl border border-dashed border-border/80 space-y-1.5">
              <div className="w-9 h-9 mx-auto rounded-xl bg-muted800 flex items-center justify-center text-muted-foreground/60">
                <Warehouse className="w-4 h-4" />
              </div>
              <p className="font-medium text-foreground text-xs">No warehouses linked to this branch</p>
              <p className="text-[11px] text-muted-foreground">
                Warehouses assigned to this branch will appear here with facility details and custodian records.
              </p>
            </div>
          )}
        </div>

        {/* Audit Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-3 gap-2">
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
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground/60" />
            <span>Added: {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}</span>
            {branch.updatedAt && (
              <span className="text-muted-foreground/70">
                (Updated: {new Date(branch.updatedAt).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
