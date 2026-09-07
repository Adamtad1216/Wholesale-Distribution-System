import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, FileText, ChevronRight, Plus } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';

export default function CustomerDetailView({
  selectedCustomer,
  handleBackToList,
  handleOpenEdit,
  handleDeleteCustomer,
  canUpdate,
  canDelete,
  getCustomerDisplayName,
  getCustomerEmail,
  getCustomerPhone,
  formatCurrency,
}) {
  const navigate = useNavigate();
  const isOrg = selectedCustomer.customerType === 'ORGANIZATION';
  const displayName = getCustomerDisplayName(selectedCustomer);
  const email = getCustomerEmail(selectedCustomer);
  const phone = getCustomerPhone(selectedCustomer);

  // Fetch this customer's sales orders
  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ['salesOrders', 'customer', selectedCustomer?.id],
    queryFn: () => salesOrdersApi.list({ customerId: selectedCustomer?.id, limit: 10 }),
    enabled: !!selectedCustomer?.id,
    staleTime: 10000,
  });

  const orders = Array.isArray(ordersRes)
    ? ordersRes
    : Array.isArray(ordersRes?.data)
    ? ordersRes.data
    : Array.isArray(ordersRes?.data?.data)
    ? ordersRes.data.data
    : Array.isArray(ordersRes?.items)
    ? ordersRes.items
    : [];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Navigation Topbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Customers Directory
        </button>

        <div className="flex items-center gap-3">
          {canUpdate && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleOpenEdit(selectedCustomer)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Customer
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              size="md"
              onClick={() => handleDeleteCustomer(selectedCustomer.id, displayName)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </Button>
          )}
        </div>
      </div>

      {/* Customer Profile Banner Header */}
      <Card className="p-6 border border-border bg-card shadow-sm rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 ${
              isOrg
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
            }`}>
              {isOrg ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold badge-slate">
                  {selectedCustomer.customerCode || 'NO-CODE'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isOrg ? 'badge-indigo' : 'badge-violet'
                }`}>
                  {isOrg ? 'Organization Entity' : 'Individual Person'}
                </span>
                <span>•</span>
                <span>Registered: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${
              selectedCustomer.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : selectedCustomer.status === 'SUSPENDED'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                selectedCustomer.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              {selectedCustomer.status || 'ACTIVE'} ACCOUNT
            </span>
          </div>
        </div>
      </Card>

      {/* Commercial Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border border-border bg-card shadow-sm rounded-2xl">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credit Limit Allocation</p>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(selectedCustomer.creditLimit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Maximum authorized credit ceiling</p>
        </Card>

        <Card className="p-5 border border-border bg-card shadow-sm rounded-2xl">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</p>
          <div className="text-2xl font-bold text-indigo-400 mt-2">
            {selectedCustomer.paymentTerms?.name || 'COD (0 Days)'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCustomer.paymentTerms?.days
              ? `${selectedCustomer.paymentTerms.days} Days settlement window`
              : 'Immediate Cash on Delivery'}
          </p>
        </Card>

        <Card className="p-5 border border-border bg-card shadow-sm rounded-2xl">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Sales Representative</p>
          <div className="text-2xl font-bold text-violet-400 mt-2">
            {selectedCustomer.salesRepresentative
              ? `${selectedCustomer.salesRepresentative.firstName} ${selectedCustomer.salesRepresentative.lastName}`
              : 'Unassigned'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Key account representative</p>
        </Card>
      </div>

      {/* Detailed Profile Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Physical Address Card */}
        <Card className="p-6 border border-border bg-card shadow-sm rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact & Address Details
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Email Address</span>
              <span className="font-semibold text-foreground">{email}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Phone Number</span>
              <span className="font-semibold text-foreground">{phone}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Physical Address</span>
              <span className="font-semibold text-foreground text-right">
                {isOrg
                  ? selectedCustomer.organization?.address || '-'
                  : selectedCustomer.person?.address || '-'}
              </span>
            </div>
          </div>
        </Card>

        {/* Business & Legal Registration Card */}
        <Card className="p-6 border border-border bg-card shadow-sm rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Business & Legal Registration
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Tax Identification (TIN)</span>
              <span className="font-mono font-semibold text-foreground">
                {isOrg ? selectedCustomer.organization?.taxNumber || '-' : '-'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Business Registration No.</span>
              <span className="font-mono font-semibold text-foreground">
                {isOrg ? selectedCustomer.organization?.registrationNumber || '-' : '-'}
              </span>
            </div>

            {isOrg && selectedCustomer.organization?.contacts?.length > 0 && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Primary Contact Person</span>
                <span className="font-semibold text-foreground text-right">
                  {selectedCustomer.organization.contacts[0].firstName} {selectedCustomer.organization.contacts[0].lastName} (
                  {selectedCustomer.organization.contacts[0].position || 'Manager'})
                </span>
              </div>
            )}

            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Last Profile Update</span>
              <span className="text-foreground">
                {new Date(selectedCustomer.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Customer Purchase Orders & Commercial History */}
      <Card noPadding className="p-6 border border-border bg-card shadow-sm rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              Customer Sales Orders & Purchase History
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live orders placed by {displayName}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/sales-orders/new')}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Order</span>
          </Button>
        </div>

        {ordersLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading customer orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="text-foreground font-semibold">No sales orders found for this customer</p>
            <p className="text-[11px] text-muted-foreground">
              This client hasn't placed any wholesale orders yet.
            </p>
          </div>
        ) : (
          <Table containerClassName="rounded-xl border border-border bg-card">
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const dateVal = order.orderDate || order.createdAt;
                const orderDate = dateVal ? format(new Date(dateVal), 'MMM dd, yyyy') : '-';
                const orderTotal = Number(order.total || order.grandTotal || order.totalAmount || 0);
                const itemCount = order.items?.length || order.orderItems?.length || '-';

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono font-bold text-xs text-foreground">
                        {order.orderNumber || order.orderCode || `SO-${order.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">{orderDate}</span>
                    </TableCell>

                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                        order.status === 'APPROVED' || order.status === 'SALES_REP_APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status?.replace(/_/g, ' ') || 'Pending'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-foreground font-medium">
                        {itemCount} {typeof itemCount === 'number' ? (itemCount === 1 ? 'item' : 'items') : ''}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm font-bold text-emerald-400">
                        {orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <button
                        onClick={() => navigate(`/sales-orders/${order.id}`)}
                        className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-foreground font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
