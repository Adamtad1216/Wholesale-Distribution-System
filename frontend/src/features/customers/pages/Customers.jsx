import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../customersApi';

export default function Customers() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers({ limit: 10 }).catch(() => ({ data: [] })),
  });

  const customersList = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Customers Directory</h2>
        <p className="text-sm text-slate-400">View and manage B2B individual and organizational clients.</p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/20">
                <th className="px-6 py-4">Name / Username</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-rose-500">
                    Failed to fetch customers from server.
                  </td>
                </tr>
              ) : customersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No customers found. (Database empty or offline)
                  </td>
                </tr>
              ) : (
                customersList.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {customer.customerType === 'ORGANIZATION' ? customer.organization?.name : `${customer.person?.firstName} ${customer.person?.lastName}`}
                      </div>
                      <div className="text-xs text-slate-500">{customer.user?.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        customer.customerType === 'ORGANIZATION' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      }`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">{customer.email || '-'}</td>
                    <td className="px-6 py-4">{customer.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="w-2.5 h-2.5 inline-block rounded-full bg-emerald-500 mr-2"></span>
                      Active
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
