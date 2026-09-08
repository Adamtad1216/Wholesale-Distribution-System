import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  ShieldAlert,
  Search,
  Users,
  Eye,
} from 'lucide-react';
import { priceTiersApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function PriceTiersTab({ showHeader = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { can: canCreate } = usePermission('PRICE_TIER_CREATE');
  const { can: canUpdate } = usePermission('PRICE_TIER_UPDATE');
  const { can: canDelete } = usePermission('PRICE_TIER_DELETE');

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: tiersData, isLoading, error } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  // Query customers to calculate customer count per tier
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers-list-pricing'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 300 });
      return res.data?.customers || res.data?.data || [];
    },
  });

  const tiers = Array.isArray(tiersData) ? tiersData : [];
  const customers = Array.isArray(customersData) ? customersData : [];

  // Customer count mapping: { [tierId]: count }
  const customerCountsByTier = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      const tid = c.priceTierId || c.priceTier?.id;
      if (tid) {
        map[tid] = (map[tid] || 0) + 1;
      }
    });
    return map;
  }, [customers]);

  const activateMutation = useMutation({
    mutationFn: (id) => priceTiersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success('Price Tier activated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to activate tier'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => priceTiersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success('Price Tier deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate tier'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => priceTiersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success('Price Tier archived successfully');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete price tier'),
  });

  const filteredTiers = useMemo(() => {
    return tiers.filter((t) => {
      const q = search.toLowerCase();
      const name = (t.name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [tiers, search]);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Customer Price Tiers</h2>
            <p className="text-xs text-muted-foreground">
              Configure customer pricing levels, priority order, and default fallback rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tiers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/pricing/tiers/new')}
                icon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                New Price Tier
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-muted-foreground text-sm">
          Loading price tiers...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Failed to load price tiers: {error?.response?.data?.message || error?.message || 'Check your network or permissions.'}
          </span>
        </div>
      ) : filteredTiers.length === 0 ? (
        <Card className="text-center py-12">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Price Tiers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search
              ? `No price tiers match "${search}". Try resetting your search.`
              : 'Price tiers allow assigning discounted or wholesale rates to specific customer accounts.'}
          </p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing/tiers/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create First Price Tier
            </Button>
          )}
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTiers.map((tier) => {
              const count = customerCountsByTier[tier.id] || 0;
              const isActive = tier.status === 'ACTIVE';

              return (
                <TableRow key={tier.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{tier.name}</span>
                          {tier.isDefault && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {tier.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                      {tier.description || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                      {tier.priority ?? 0}
                    </span>
                  </TableCell>

                  <TableCell>
                    {tier.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>DEFAULT</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                        }`}
                      />
                      <span>{tier.status}</span>
                    </span>
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(`/pricing/customer-pricing?tierId=${tier.id}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-card border border-border hover:bg-muted/40 transition-colors text-foreground"
                    >
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{count} accounts</span>
                    </button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={<Edit2 className="w-3 h-3" />}
                            onClick={() => navigate(`/pricing/tiers/${tier.id}/edit`)}
                          >
                            Edit
                          </Button>

                          <button
                            type="button"
                            title={isActive ? 'Deactivate Tier' : 'Activate Tier'}
                            onClick={() =>
                              isActive
                                ? deactivateMutation.mutate(tier.id)
                                : activateMutation.mutate(tier.id)
                            }
                            className={`p-1.5 rounded-lg border transition ${
                              isActive
                                ? 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20'
                                : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                            }`}
                          >
                            {isActive ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}

                      {canDelete && !tier.isDefault && (
                        <button
                          type="button"
                          title="Archive Tier"
                          onClick={() => setDeleteTarget(tier)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Archive Price Tier"
          message={`Are you sure you want to archive price tier "${deleteTarget.name}"? Customers assigned to this tier will fall back to default pricing.`}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
