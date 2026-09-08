import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Package,
  ArrowLeftRight,
  Sliders,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import notificationsApi from '../notificationsApi';

// Helper to determine notification icon and styling by type
function getNotificationMeta(type) {
  switch (type) {
    case 'INVENTORY_LOW_STOCK_WARNING':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
        badge: 'Low Stock',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        targetTab: 'stocks',
      };
    case 'INVENTORY_STOCK_CREATED':
    case 'INVENTORY_STOCK_UPDATED':
    case 'INVENTORY_STOCK_DELETED':
      return {
        icon: <Package className="w-4 h-4 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
        badge: 'Stock',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        targetTab: 'stocks',
      };
    case 'INVENTORY_ADJUSTMENT_CREATED':
    case 'INVENTORY_ADJUSTMENT_PROCESSED':
    case 'INVENTORY_ADJUSTMENT_DELETED':
      return {
        icon: <Sliders className="w-4 h-4 text-violet-400" />,
        bg: 'bg-violet-500/10 border-violet-500/25 text-violet-400',
        badge: 'Adjustment',
        badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
        targetTab: 'adjustments',
      };
    case 'INVENTORY_TRANSFER_COMPLETED':
    case 'INVENTORY_TRANSFER_RECEIVED':
    case 'INVENTORY_TRANSFER_OUTBOUND':
      return {
        icon: <ArrowLeftRight className="w-4 h-4 text-sky-400" />,
        bg: 'bg-sky-500/10 border-sky-500/25 text-sky-400',
        badge: 'Transfer',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        targetTab: 'transfers',
      };
    case 'INVENTORY_RESERVATION_CREATED':
    case 'INVENTORY_RESERVATION_RELEASED':
    case 'INVENTORY_RESERVATION_DELETED':
      return {
        icon: <BookmarkCheck className="w-4 h-4 text-cyan-400" />,
        bg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400',
        badge: 'Reservation',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        targetTab: 'reservations',
      };
    default:
      return {
        icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
        bg: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
        badge: 'System',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        targetTab: null,
      };
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
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

  // Query: Unread count with polling every 20s
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return res?.data?.count ?? res?.count ?? 0;
    },
    refetchInterval: 20000,
  });

  const unreadCount = typeof unreadData === 'number' ? unreadData : (unreadData?.count || 0);

  // Query: Notifications list
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: async () => {
      const params = {
        limit: 30,
        ...(filter === 'unread' ? { isRead: false } : {}),
      };
      const res = await notificationsApi.getNotifications(params);
      const items = res?.data || res?.notifications || [];
      return Array.isArray(items) ? items : [];
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 15000 : false,
  });

  const notifications = notificationsData || [];

  // Mutation: Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to mark all as read');
    },
  });

  // Mutation: Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation: Delete single notification
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification removed');
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete notification');
    },
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    const meta = getNotificationMeta(item.type);
    if (meta.targetTab) {
      navigate(`/inventory?tab=${meta.targetTab}`);
      setIsOpen(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2.5 rounded-xl border transition-all duration-200 relative flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-card border-violet-500/40 text-violet-400 shadow-lg shadow-violet-500/10'
            : 'bg-transparent hover:bg-card border-transparent hover:border-border text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Open Notifications"
        title="Notifications"
      >
        <Bell className={`w-5 h-5 transition-transform duration-300 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 border-2 border-background text-[10px] font-bold text-white flex items-center justify-center shadow-md shadow-violet-500/30 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Popover */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-84 sm:w-96 max-h-[85vh] flex flex-col rounded-2xl border border-border shadow-2xl bg-card backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          {/* Header Panel */}
          <div className="p-4 border-b border-border/80 flex items-center justify-between gap-3 bg-muted900/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-violet-500/10 transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted900/10">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted800'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-[380px] p-2 space-y-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-muted800/80 border border-border flex items-center justify-center text-muted-foreground">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {filter === 'unread'
                    ? 'No unread notifications right now.'
                    : 'You have no notifications yet.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotificationMeta(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-start gap-3 ${
                      !item.isRead
                        ? 'bg-violet-500/[0.07] hover:bg-violet-500/[0.12] border border-violet-500/20'
                        : 'hover:bg-muted800/60 border border-transparent'
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}
                        >
                          {meta.badge}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(item.createdAt)}</span>
                        </div>
                      </div>

                      <h4
                        className={`text-xs leading-snug line-clamp-1 ${
                          !item.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                        }`}
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {meta.targetTab && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-violet-400 opacity-80 group-hover:opacity-100 transition">
                          <span>View in Inventory</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="flex flex-col items-center gap-1 shrink-0 ml-1">
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 ring-2 ring-violet-500/20" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 border-t border-border/80 bg-muted900/40 flex items-center justify-between text-xs text-muted-foreground px-4">
            <span className="text-[11px]">Wholesale Distribution Alerts</span>
            <button
              type="button"
              onClick={() => {
                navigate('/inventory');
                setIsOpen(false);
              }}
              className="text-violet-400 hover:text-violet-300 font-semibold text-xs flex items-center gap-1"
            >
              <span>Inventory Console</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
