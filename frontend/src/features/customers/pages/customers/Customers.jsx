import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../customersApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';

export default function Customers() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers({ limit: 10 }).catch(() => ({ data: [] })),
  });

  const customersList = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">Customers Directory</h2>
        <p className="text-sm text-slate-400">View and manage B2B individual and organizational clients.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / Username</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-slate-400 py-8">
                Loading customers...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-rose-500 py-8">
                Failed to fetch customers from server.
              </TableCell>
            </TableRow>
          ) : customersList.length === 0 ? (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-slate-400 py-8">
                No customers found. (Database empty or offline)
              </TableCell>
            </TableRow>
          ) : (
            customersList.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="font-semibold text-slate-100 light:text-slate-900">
                    {customer.customerType === 'ORGANIZATION' ? customer.organization?.name : `${customer.person?.firstName} ${customer.person?.lastName}`}
                  </div>
                  <div className="text-xs text-slate-400">{customer.user?.username}</div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    customer.customerType === 'ORGANIZATION' ? 'badge-indigo' : 'badge-violet'
                  }`}>
                    {customer.customerType}
                  </span>
                </TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>
                  <span className="w-2.5 h-2.5 inline-block rounded-full bg-emerald-500 mr-2"></span>
                  Active
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
