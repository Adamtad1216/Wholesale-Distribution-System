import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { permissionsApi } from '../../permissionsApi';
import Card from '../../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await permissionsApi.getPermissions();
      const data = res?.data || res || [];
      setPermissions(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const modules = ['ALL', ...new Set(permissions.map((p) => p.module || p.key?.split(':')[0]))].filter(Boolean);

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch =
      p.key?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || (p.module || p.key?.split(':')[0]) === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Permissions Matrix</h1>
        <p className="text-sm text-slate-400">View and audit all granular system permission keys</p>
      </div>

      {/* Filter / Search Bar */}
      <Card noPadding className="p-4 flex flex-col sm:flex-row items-center gap-4 rounded-lg">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search permissions by key or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border rounded-lg text-sm focus:outline-none"
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {m === 'ALL' ? 'All Modules' : m.toUpperCase()}
            </option>
          ))}
        </select>
      </Card>

      {/* Permissions Table */}
      {loading ? (
        <Card className="p-12 text-center text-slate-400 text-sm rounded-lg">Loading permissions...</Card>
      ) : filteredPermissions.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-sm rounded-lg">No permissions found.</Card>
      ) : (
        <Table containerClassName="rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead>Permission Key</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((p) => (
              <TableRow key={p.id || p.key}>
                <TableCell className="font-mono font-bold text-violet-400">
                  {p.key || p.name}
                </TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase badge-module">
                    {p.module || p.key?.split(':')[0] || 'System'}
                  </span>
                </TableCell>
                <TableCell className="text-slate-400">
                  {p.description || 'No description provided.'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
