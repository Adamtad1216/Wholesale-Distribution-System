import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../../components/ui/Table';

export default function ProviderCard({
  provider,
  onToggleActive,
  onEdit,
  onDelete,
  onAddMethod,
  onToggleMethodActive,
  onEditMethod,
  onDeleteMethod,
}) {
  const methods = provider.methods || [];

  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-5">
      {/* Provider Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
            {provider.type === 'ONLINE' ? '💳' : '🏦'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{provider.name}</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                  provider.type === 'ONLINE'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {provider.type}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  provider.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted800 text-muted-foreground border border-border'
                }`}
              >
                {provider.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Code: <span className="text-indigo-400 font-bold">{provider.code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onToggleActive(provider)}
          >
            {provider.isActive ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(provider)}
          >
            ✏️ Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDelete(provider)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            🗑️ Delete
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAddMethod(provider)}
            className="ml-2 font-bold"
          >
            + Add Method Option
          </Button>
        </div>
      </div>

      {/* Sub-Methods Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <span>⚙️</span> Sub-Method Options ({methods.length})
          </h4>
        </div>

        {methods.length === 0 ? (
          <div className="p-4 bg-muted800/40 rounded-xl border border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              No specific method options added under <span className="font-bold text-foreground">{provider.name}</span> yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted800/60 border-b border-border">
                  <TableHead className="py-2.5 text-xs font-bold text-foreground">Option Name</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground">Code</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground text-center">Requires Proof</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground text-center">Status</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {methods.map((method) => (
                  <TableRow key={method.id} className="hover:bg-muted800/30 transition">
                    <TableCell className="py-3 font-bold text-foreground text-xs">
                      {method.name}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-indigo-400 text-xs font-bold">
                      {method.code}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          method.requiresProof
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-muted800 text-muted-foreground'
                        }`}
                      >
                        {method.requiresProof ? 'Required' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          method.isActive !== false
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-muted800 text-muted-foreground'
                        }`}
                      >
                        {method.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onToggleMethodActive(method)}
                          className="text-[10px] font-bold px-2 py-1 bg-muted800 hover:bg-muted font-mono rounded text-foreground transition"
                        >
                          {method.isActive !== false ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => onEditMethod(provider, method)}
                          className="text-[10px] font-bold px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 rounded text-indigo-400 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteMethod(method)}
                          className="text-[10px] font-bold px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded text-rose-400 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
}
