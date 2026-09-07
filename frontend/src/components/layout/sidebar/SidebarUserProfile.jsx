import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SidebarUserProfile({ onClose }) {
  const { user, role } = useSelector((state) => state.auth);
  const person = user?.person || {};
  const employee = person?.employee || {};
  const warehouse = employee?.managedWarehouses?.[0];

  const displayName = person.firstName
    ? `${person.firstName} ${person.lastName || ''}`.trim()
    : user?.username || 'User';

  const initial = person.firstName
    ? person.firstName[0].toUpperCase()
    : user?.username
    ? user.username[0].toUpperCase()
    : 'U';

  const isSalesRep =
    role === 'SALES_REPRESENTATIVE' ||
    role === 'SALES_REP' ||
    Boolean(employee?.isAvailableForSales);

  const isCustomer = role === 'CUSTOMER';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const roleLabel = isSalesRep
    ? 'Sales Representative'
    : isAdmin
    ? 'Administrator'
    : isCustomer
    ? 'Wholesale Client'
    : 'Staff Member';

  const employeeCode = employee?.employeeCode || null;

  return (
    <div className="p-3 border-t border-sidebar-border/60 bg-black/10">
      <Link
        to="/profile"
        onClick={onClose}
        className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-sidebar-border cursor-pointer"
        title="View Profile & Settings"
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
            {initial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background ring-1 ring-emerald-400/50"></span>
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-sidebar-foreground group-hover:text-primary transition-colors">
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase truncate">
              {roleLabel}
            </span>
            {employeeCode && (
              <span className="text-[10px] font-mono text-muted-foreground truncate">
                • {employeeCode}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    </div>
  );
}
