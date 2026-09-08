import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  X,
  ShoppingBag,
  FileText,
  Truck,
  Package,
  Clock,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../../features/notifications/notificationsApi';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('SALES_ORDER') || t.includes('ORDER')) {
    return {
      icon: ShoppingBag,
      color: 'text-sky-400 bg-sky-500/20 border-sky-500/30',
    };
  }
  if (t.includes('INVOICE') || t.includes('PAYMENT')) {
    return {
      icon: FileText,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    };
  }
  if (t.includes('DELIVERY') || t.includes('DISPATCH') || t.includes('HANDOVER')) {
    return {
      icon: Truck,
      color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    };
  }
  if (t.includes('PREPARATION') || t.includes('INVENTORY') || t.includes('STOCK')) {
    return {
      icon: Package,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    };
  }
  return {
    icon: Bell,
    color: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
  };
}

function getNotificationRoute(notif) {
  const t = String(notif?.type || '').toUpperCase();
  if (t.includes('INVOICE') || t.includes('PAYMENT')) return '/invoices';
  if (t.includes('DELIVERY') || t.includes('DISPATCH') || t.includes('HANDOVER')) return '/deliveries';
  if (t.includes('PREPARATION')) return '/dashboard';
  if (t.includes('SALES_ORDER') || t.includes('ORDER')) return '/sales-orders';
  if (t.includes('INVENTORY') || t.includes('STOCK')) return '/inventory';
  return null;
}

export default function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Unread Count Query (polls every 15 seconds)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Notifications List Query
  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications', 'list', activeTab],
    queryFn: () =>
      notificationsApi.getNotifications({
        isRead: activeTab === 'UNREAD' ? false : undefined,
        limit: 25,
      }),
    enabled: isOpen,
    refetchInterval: isOpen ? 15000 : false,
  });

  const notifications = listData?.data || [];

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to mark notifications as read');
    },
  });

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification removed');
    },
  });

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    const route = getNotificationRoute(notif);
    setIsOpen(false);
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 rounded-xl border transition-all duration-200 relative flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-card border-violet-500/40 text-violet-400 shadow-md shadow-violet-500/10'
            : 'bg-transparent hover:bg-card border-transparent hover:border-border text-foreground/80 hover:text-foreground'
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5 shrink-0" />

        {/* Dynamic Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-background shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Classic Popover Notification Dropdown - Compact & 100% Solid Opaque Background */}
      {isOpen && (
        <div className="notification-dropdown-menu absolute right-0 mt-2 w-[320px] sm:w-[350px] max-w-[calc(100vw-24px)] rounded-xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="notification-dropdown-header px-3.5 py-2.5 border-b flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notification-dropdown-tabs px-3 py-1.5 border-b flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'UNREAD'
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1 rounded-full text-[9px] ${
                    activeTab === 'UNREAD' ? 'bg-white/30 text-white' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Notifications List */}
          <div className="max-h-[290px] overflow-y-auto divide-y divide-border overscroll-contain">
            {isLoading ? (
              <div className="p-4 space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2.5 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-secondary shrink-0" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <div className="h-3 bg-secondary rounded w-3/4" />
                      <div className="h-2.5 bg-secondary rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground mb-2">
                  <Inbox className="w-4 h-4 opacity-70" />
                </div>
                <h4 className="text-xs font-bold text-foreground">You're all caught up!</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
                  {activeTab === 'UNREAD'
                    ? 'No unread notifications.'
                    : 'No notifications at this time.'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: CategoryIcon, color } = getNotificationIcon(notif.type);
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`notification-item p-2.5 flex items-start gap-2.5 transition-colors cursor-pointer group relative ${
                      isUnread ? 'notification-item-unread border-l-2 border-l-violet-500' : ''
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${color}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-baseline justify-between gap-1.5">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? 'text-foreground font-bold' : 'text-foreground/90 font-medium'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {/* Action buttons (hover) */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(notif.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-emerald-400 hover:bg-secondary transition cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notif.id);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-secondary transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notification-dropdown-footer px-3 py-1.5 border-t text-center">
            <span className="text-[10px] text-muted-foreground">
              Real-time activity alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
