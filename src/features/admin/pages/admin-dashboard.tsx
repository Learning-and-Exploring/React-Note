import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Smartphone,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  adminService,
  type AdminUserDevice,
  type AdminUser,
  type AdminUsersMeta,
} from "../admin-service";
import {
  type AdminNotification,
  type AdminNotificationsMeta,
  adminPushService,
  extractAdminIdFromToken,
  type PushCapability,
} from "../admin-push-service";
import { AdminSidebar, type AdminSection } from "../components/admin-sidebar";
import { AdminSummaryCard } from "../components/admin-summary-card";
import { useAdmin } from "../hooks/use-admin";
import { formatDate } from "@features/notes/utils/format-date";

type FilterState = {
  name: string;
  email: string;
  isActive: boolean;
  includeDeleted: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  name: "",
  email: "",
  isActive: true,
  includeDeleted: false,
};

const PAGE_SIZE = 10;
const NOTIFICATION_PAGE_SIZE = 5;
const DEVICE_PAGE_SIZE = 10;
const ADMIN_LOGIN_SUCCESS_STORAGE_KEY = "admin-login-success-message";
const DEFAULT_PUSH_CAPABILITY: PushCapability = {
  supported: false,
  permission: "unsupported",
  subscribed: false,
  endpoint: null,
};

function getCurrentPage(meta: AdminUsersMeta | null) {
  return meta?.currentPage ?? meta?.page ?? 1;
}

function getPageCount(meta: AdminUsersMeta | null) {
  return meta?.pageCount ?? meta?.totalPages ?? 1;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

function getStatusTone(user: AdminUser | null) {
  if (user?.isActive === true) return "emerald";
  if (user?.isActive === false) return "rose";
  return "slate";
}

function getStatusLabel(user: AdminUser | null) {
  if (user?.isActive === true) return "Active";
  if (user?.isActive === false) return "Inactive";
  return "Unavailable";
}

function getNotificationTone(notification: AdminNotification | null) {
  if (!notification) return "slate";
  return notification.isRead ? "slate" : "emerald";
}

function getNotificationLabel(notification: AdminNotification | null) {
  if (!notification) return "Unavailable";
  return notification.isRead ? "Read" : "Unread";
}

function statusClasses(tone: "emerald" | "rose" | "slate") {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (tone === "rose") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200";
}

function formatCount(value?: number) {
  if (typeof value !== "number") return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

export function AdminDashboardPage() {
  const { token, admin, logout } = useAdmin();
  const adminId = useMemo(
    () => (token ? extractAdminIdFromToken(token) : null),
    [token],
  );
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<AdminUsersMeta | null>(null);
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSelectedUser, setLoadingSelectedUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [pushCapability, setPushCapability] = useState<PushCapability>(
    DEFAULT_PUSH_CAPABILITY,
  );
  const [pushLoading, setPushLoading] = useState(false);
  const [sendingPushTest, setSendingPushTest] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsMeta, setNotificationsMeta] =
    useState<AdminNotificationsMeta | null>(null);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(
    null,
  );
  const [devices, setDevices] = useState<AdminUserDevice[]>([]);
  const [devicesMeta, setDevicesMeta] = useState<AdminUsersMeta | null>(null);
  const [devicesPage, setDevicesPage] = useState(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState<number | null>(
    null,
  );
  const [markingAllNotificationsRead, setMarkingAllNotificationsRead] =
    useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeSection, setActiveSection] =
    useState<AdminSection>("overview");

  const currentPage = getCurrentPage(meta);
  const totalPages = getPageCount(meta);
  const selectedStatusTone = getStatusTone(selectedUser);
  const notificationsCurrentPage = notificationsMeta?.currentPage ?? 1;
  const notificationsPageCount = notificationsMeta?.pageCount ?? 1;
  const selectedNotification = useMemo(
    () =>
      notifications.find((notification) => notification.id === selectedNotificationId) ??
      null,
    [notifications, selectedNotificationId],
  );
  const devicesCurrentPage = getCurrentPage(devicesMeta);
  const devicesPageCount = getPageCount(devicesMeta);
  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );
  const pushStatusLabel = useMemo(() => {
    if (!pushCapability.supported) return "Unsupported";
    if (pushCapability.permission === "denied") return "Blocked";
    if (pushCapability.subscribed) return "Connected";
    if (pushCapability.permission === "granted") return "Ready";
    return "Not enabled";
  }, [pushCapability]);
  const sectionMeta: Record<
    AdminSection,
    { title: string; subtitle: string }
  > = {
    overview: {
      title: "Overview",
      subtitle: "System health, alerts, and admin quick actions.",
    },
    users: {
      title: "Users",
      subtitle: "Search accounts, inspect records, and manage access.",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Review alerts, unread items, and push-related activity.",
    },
    devices: {
      title: "User Devices",
      subtitle: "Monitor user device coverage and security visibility.",
    },
    settings: {
      title: "Settings",
      subtitle: "Admin access, browser push, and configuration controls.",
    },
  };

  const querySummary = useMemo(() => {
    const parts = [
      appliedFilters.name ? `name: ${appliedFilters.name}` : null,
      appliedFilters.email ? `email: ${appliedFilters.email}` : null,
      appliedFilters.isActive ? "active only" : "inactive only",
      appliedFilters.includeDeleted ? "deleted included" : "deleted hidden",
    ].filter(Boolean);

    return parts.join(" • ");
  }, [appliedFilters]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    setLoadingNotifications(true);

    try {
      const response = await adminPushService.listNotifications(token, {
        page: notificationsPage,
        limit: NOTIFICATION_PAGE_SIZE,
      });

      setNotifications(response.data);
      setNotificationsMeta(response.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications.",
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, [notificationsPage, token]);

  const loadDevices = useCallback(async () => {
    if (!token) return;

    setLoadingDevices(true);

    try {
      const response = await adminService.listUserDevices(
        {
          page: devicesPage,
          limit: DEVICE_PAGE_SIZE,
          includeDeleted: appliedFilters.includeDeleted,
        },
        token,
      );

      setDevices(response.data);
      setDevicesMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices.");
    } finally {
      setLoadingDevices(false);
    }
  }, [appliedFilters.includeDeleted, devicesPage, token]);

  const loadUnreadNotificationCount = useCallback(async () => {
    if (!token) return;

    try {
      const nextCount = await adminPushService.getUnreadCount(token);
      setUnreadNotificationCount(nextCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load unread notifications.",
      );
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoadingUsers(true);
    setError(null);

    try {
      const response = await adminService.listUsers(
        {
          page,
          limit: PAGE_SIZE,
          name: appliedFilters.name || undefined,
          email: appliedFilters.email || undefined,
          isActive: appliedFilters.isActive,
          includeDeleted: appliedFilters.includeDeleted,
        },
        token,
      );

      setUsers(response.data);
      setMeta(response.meta);

      if (response.data.length === 0) {
        setSelectedUserId(null);
        setSelectedUser(null);
        return;
      }

      const hasSelectedUser = response.data.some(
        (user) => user.id === selectedUserId,
      );

      if (!selectedUserId || !hasSelectedUser) {
        setSelectedUserId(response.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }, [appliedFilters, page, selectedUserId, token]);

  const loadSelectedUser = useCallback(async () => {
    if (!token || selectedUserId === null) return;

    setLoadingSelectedUser(true);

    try {
      const user = await adminService.getUserById(
        selectedUserId,
        token,
        appliedFilters.includeDeleted,
      );

      setSelectedUser((current) => ({
        ...current,
        ...user,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user details.",
      );
    } finally {
      setLoadingSelectedUser(false);
    }
  }, [appliedFilters.includeDeleted, selectedUserId, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadSelectedUser();
  }, [loadSelectedUser]);

  useEffect(() => {
    if (!token) {
      setDevices([]);
      setDevicesMeta(null);
      setSelectedDeviceId(null);
      setNotifications([]);
      setNotificationsMeta(null);
      setSelectedNotificationId(null);
      setUnreadNotificationCount(0);
      return;
    }

    void loadDevices();
    void loadNotifications();
  }, [loadDevices, loadNotifications, token]);

  useEffect(() => {
    if (notifications.length === 0) {
      setSelectedNotificationId(null);
      return;
    }

    const hasSelectedNotification = notifications.some(
      (notification) => notification.id === selectedNotificationId,
    );
    if (!selectedNotificationId || !hasSelectedNotification) {
      setSelectedNotificationId(notifications[0].id);
    }
  }, [notifications, selectedNotificationId]);

  useEffect(() => {
    if (devices.length === 0) {
      setSelectedDeviceId(null);
      return;
    }

    const hasSelectedDevice = devices.some((device) => device.id === selectedDeviceId);
    if (!selectedDeviceId || !hasSelectedDevice) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!token) return;
    void loadUnreadNotificationCount();
  }, [loadUnreadNotificationCount, token]);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loginMessage = window.sessionStorage.getItem(
      ADMIN_LOGIN_SUCCESS_STORAGE_KEY,
    );

    if (!loginMessage) return;

    window.sessionStorage.removeItem(ADMIN_LOGIN_SUCCESS_STORAGE_KEY);
    setError(null);
    setSuccessMessage(loginMessage);
  }, []);

  useEffect(() => {
    if (!token) {
      setPushCapability(DEFAULT_PUSH_CAPABILITY);
      return;
    }

    let active = true;

    const syncPushCapability = async () => {
      try {
        const capability = await adminPushService.getCapability();
        if (active) {
          setPushCapability(capability);
        }
      } catch {
        if (active) {
          setPushCapability(DEFAULT_PUSH_CAPABILITY);
        }
      }
    };

    void syncPushCapability();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setDevicesPage(1);
    setAppliedFilters({
      name: filters.name.trim(),
      email: filters.email.trim(),
      isActive: filters.isActive,
      includeDeleted: filters.includeDeleted,
    });
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setDevicesPage(1);
  };

  const handleToggleUserActive = async (id: number) => {
    if (!token) return;

    setActionLoadingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await adminService.toggleUserActive(id, token);

      setUsers((current) =>
        current.map((user) =>
          user.id === id ? { ...user, ...result.user } : user,
        ),
      );

      setSelectedUser((current) =>
        current && current.id === id ? { ...current, ...result.user } : current,
      );

      setSuccessMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnablePush = async () => {
    if (!token) return;

    setPushLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const capability = await adminPushService.subscribe(token);
      setPushCapability(capability);
      setSuccessMessage("Push notifications enabled for this browser.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to enable push notifications.",
      );
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    if (!token) return;

    setPushLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const capability = await adminPushService.unsubscribe(token);
      setPushCapability(capability);
      setSuccessMessage("Push notifications disabled for this browser.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disable push notifications.",
      );
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendPushTest = async () => {
    if (!token || !adminId) return;

    setSendingPushTest(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await adminPushService.sendTestNotification(token, adminId);
      setSuccessMessage("Test notification sent.");
      await Promise.all([loadNotifications(), loadUnreadNotificationCount()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send test notification.",
      );
    } finally {
      setSendingPushTest(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    if (!token) return;

    setNotificationActionId(notificationId);
    setError(null);

    try {
      await adminPushService.markNotificationAsRead(token, notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: notification.readAt ?? new Date().toISOString(),
              }
            : notification,
        ),
      );
      setUnreadNotificationCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark notification as read.",
      );
    } finally {
      setNotificationActionId(null);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!token) return;

    setMarkingAllNotificationsRead(true);
    setError(null);

    try {
      const updatedCount = await adminPushService.markAllNotificationsAsRead(token);
      if (updatedCount > 0) {
        setSuccessMessage("All notifications marked as read.");
      }
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadNotificationCount(0);
      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read.",
      );
    } finally {
      setMarkingAllNotificationsRead(false);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!token) return;

    const target = notifications.find(
      (notification) => notification.id === notificationId,
    );

    setNotificationActionId(notificationId);
    setError(null);

    try {
      await adminPushService.deleteNotification(token, notificationId);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId),
      );
      if (target && !target.isRead) {
        setUnreadNotificationCount((current) => Math.max(0, current - 1));
      }
      setSuccessMessage("Notification deleted.");
      await loadNotifications();
      await loadUnreadNotificationCount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete notification.",
      );
    } finally {
      setNotificationActionId(null);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen w-full flex-col">
        <section className="grid h-screen overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AdminSidebar
            activeSection={activeSection}
            adminName={admin?.name || "Admin"}
            adminEmail={admin?.email || "admin@local"}
            getInitials={getInitials}
            onSelectSection={setActiveSection}
            pushStatusLabel={pushStatusLabel}
            selectedUserId={selectedUser?.id ?? null}
            unreadNotificationCount={unreadNotificationCount}
          />

          <div className="min-w-0 h-screen overflow-hidden">
          <header className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(18,18,20,1)_100%)] sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Admin Console
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                    {sectionMeta[activeSection].title}
                  </h1>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {sectionMeta[activeSection].subtitle}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {admin?.name || "Admin"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {admin?.email || "admin@local"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 ${statusClasses(
                      unreadNotificationCount > 0 ? "emerald" : "slate",
                    )}`}
                  >
                    {unreadNotificationCount} unread notifications
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    void Promise.all([
                      loadUsers(),
                      loadNotifications(),
                      loadUnreadNotificationCount(),
                    ]);
                  }}
                  disabled={loadingUsers || loadingNotifications}
                >
                  <RefreshCw
                    className={
                      loadingUsers || loadingNotifications ? "animate-spin" : ""
                    }
                  />
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-149px)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-6">
              {(error || successMessage) ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    error
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  }`}
                >
                  {error || successMessage}
                </div>
              ) : null}

              {activeSection === "overview" ? (
                <>
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-sm dark:border-white/10 dark:bg-slate-100 dark:text-slate-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 dark:text-slate-600">
                        User Directory
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">
                        Search, filter, and act on user accounts faster
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 dark:text-slate-700">
                        Focus on the user list first, then inspect details in the
                        side panel. Filters stay visible and actions stay close to
                        the selected record.
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-2 rounded-3xl border border-white/10 bg-white/8 p-3 text-sm dark:border-slate-300 dark:bg-slate-950/5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 dark:text-slate-600">
                          Active filter
                        </span>
                        <span className="font-semibold">
                          {appliedFilters.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 dark:text-slate-600">
                          Selected user
                        </span>
                        <span className="font-semibold">
                          {selectedUser ? `#${selectedUser.id}` : "None"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 dark:text-slate-600">
                          Push status
                        </span>
                        <span className="font-semibold">{pushStatusLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminSummaryCard
                    label="Filtered Users"
                    value={formatCount(meta?.totalCount ?? users.length)}
                    helper="Results returned by the current query"
                  />
                  <AdminSummaryCard
                    label="Unread Alerts"
                    value={formatCount(unreadNotificationCount)}
                    helper="Stored notifications waiting for review"
                  />
                  <AdminSummaryCard
                    label="Visible Rows"
                    value={formatCount(users.length)}
                    helper={`Current page size ${PAGE_SIZE}`}
                  />
                  <AdminSummaryCard
                    label="Page"
                    value={`${currentPage}/${totalPages}`}
                    helper="Server-side pagination"
                  />
                </div>
              </section>
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                        Recent Admin Alerts
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Latest stored notifications and operational follow-ups.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => setActiveSection("notifications")}
                    >
                      Open center
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {notifications.slice(0, 4).map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                            {notification.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={statusClasses(
                              notification.isRead ? "slate" : "emerald",
                            )}
                          >
                            {notification.isRead ? "Read" : "Unread"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {notification.body}
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(notification.createdAt ?? undefined)}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        No admin alerts yet.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    Quick Actions
                  </h2>
                  <div className="mt-5 grid gap-3">
                    <Button
                      className="justify-start rounded-2xl"
                      onClick={() => setActiveSection("users")}
                    >
                      <Users className="h-4 w-4" />
                      Open user management
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start rounded-2xl"
                      onClick={() => setActiveSection("notifications")}
                    >
                      <Bell className="h-4 w-4" />
                      Review notifications
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start rounded-2xl"
                      onClick={() => setActiveSection("devices")}
                    >
                      <Smartphone className="h-4 w-4" />
                      Review user devices
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start rounded-2xl"
                      onClick={() => setActiveSection("settings")}
                    >
                      <Settings className="h-4 w-4" />
                      Open settings
                    </Button>
                  </div>
                </div>
              </section>
                </>
              ) : null}

              {activeSection === "users" ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Find Users
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Narrow the list by name or email, then inspect the
                          selected account on the right.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={filters.isActive ? "default" : "outline"}
                          className="rounded-2xl"
                          onClick={() =>
                            setFilters((current) => ({ ...current, isActive: true }))
                          }
                        >
                          Active
                        </Button>
                        <Button
                          type="button"
                          variant={!filters.isActive ? "default" : "outline"}
                          className="rounded-2xl"
                          onClick={() =>
                            setFilters((current) => ({ ...current, isActive: false }))
                          }
                        >
                          Inactive
                        </Button>
                      </div>
                    </div>

                    <form
                      className="mt-4 grid gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/5"
                      onSubmit={handleSubmitFilters}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Name
                          </label>
                          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-zinc-900">
                            <Search className="h-4 w-4 text-slate-400" />
                            <Input
                              className="h-11 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                              placeholder="Search by name"
                              value={filters.name}
                              onChange={(event) =>
                                setFilters((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Email
                          </label>
                          <Input
                            className="mt-2 h-11 rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900"
                            placeholder="Search by email"
                            value={filters.email}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <Button type="submit" className="h-11 rounded-2xl">
                            Apply
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl"
                            onClick={handleResetFilters}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          checked={filters.includeDeleted}
                          className="h-4 w-4 accent-slate-900 dark:accent-slate-100"
                          type="checkbox"
                          onChange={(event) =>
                            setFilters((current) => ({
                              ...current,
                              includeDeleted: event.target.checked,
                            }))
                          }
                        />
                        Include soft-deleted users
                      </label>
                    </form>
                  </section>

                  <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Users
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {querySummary}
                        </p>
                      </div>

                      <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                        {formatCount(meta?.totalCount ?? users.length)} total
                      </Badge>
                    </div>

                    <Separator />

                    <div className="overflow-x-auto">
                      {loadingUsers ? (
                        <div className="flex min-h-72 items-center justify-center text-slate-500 dark:text-slate-400">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading users...
                        </div>
                      ) : users.length === 0 ? (
                        <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
                          <Users className="h-8 w-8 text-slate-400" />
                          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            No users matched the current filters.
                          </p>
                        </div>
                      ) : (
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <tr>
                              <th className="px-5 py-4 font-medium">User</th>
                              <th className="px-5 py-4 font-medium">Email</th>
                              <th className="px-5 py-4 font-medium">Status</th>
                              <th className="px-5 py-4 font-medium">Updated</th>
                              <th className="px-5 py-4 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => {
                              const isSelected = user.id === selectedUserId;
                              const isBusy = actionLoadingId === user.id;
                              const tone = getStatusTone(user);

                              return (
                                <tr
                                  key={user.id}
                                  className={`cursor-pointer border-t border-slate-200/70 transition dark:border-white/10 ${
                                    isSelected
                                      ? "bg-sky-50 dark:bg-white/6"
                                      : "hover:bg-slate-50/80 dark:hover:bg-white/4"
                                  }`}
                                  onClick={() => setSelectedUserId(user.id)}
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3 text-left">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
                                        {getInitials(user.name)}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-950 dark:text-slate-50">
                                          {user.name || "Unnamed user"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          #{user.id}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {user.email}
                                  </td>
                                  <td className="px-5 py-4">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full px-2.5 py-0.5 ${statusClasses(
                                        tone,
                                      )}`}
                                    >
                                      {getStatusLabel(user)}
                                    </Badge>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(user.updatedAt)}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-2xl"
                                      disabled={isBusy}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void handleToggleUserActive(user.id);
                                      }}
                                    >
                                      {isBusy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : user.isActive === false ? (
                                        <ShieldCheck className="h-4 w-4" />
                                      ) : (
                                        <ShieldAlert className="h-4 w-4" />
                                      )}
                                      {user.isActive === false ? "Activate" : "Deactivate"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page {currentPage} of {totalPages}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={currentPage <= 1 || loadingUsers}
                          onClick={() =>
                            setPage((current) => Math.max(1, current - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          disabled={currentPage >= totalPages || loadingUsers}
                          onClick={() =>
                            setPage((current) =>
                              current >= totalPages ? current : current + 1,
                            )
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Selected User
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          The side panel keeps the current record visible while you
                          move through the table.
                        </p>
                      </div>
                      {loadingSelectedUser ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : null}
                    </div>

                    {selectedUser ? (
                      <div className="mt-5 space-y-4">
                        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-base font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                              {getInitials(selectedUser.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-lg font-semibold text-slate-950 dark:text-slate-50">
                                {selectedUser.name || "Unnamed user"}
                              </p>
                              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Status
                            </p>
                            <div className="mt-2">
                              <Badge
                                variant="outline"
                                className={`rounded-full px-2.5 py-0.5 ${statusClasses(
                                  selectedStatusTone,
                                )}`}
                              >
                                {getStatusLabel(selectedUser)}
                              </Badge>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Account ID
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              #{selectedUser.id}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Created
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {formatDate(selectedUser.createdAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Updated
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {formatDate(selectedUser.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {selectedUser.isDeleted ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                            This user is soft-deleted and is only visible because
                            deleted records are included in the current filter.
                          </div>
                        ) : null}

                        <Button
                          className="w-full rounded-2xl"
                          disabled={actionLoadingId === selectedUser.id}
                          onClick={() => void handleToggleUserActive(selectedUser.id)}
                        >
                          {actionLoadingId === selectedUser.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          {selectedUser.isActive === false
                            ? "Activate account"
                            : "Deactivate account"}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/80 px-5 py-8 text-center dark:border-white/10 dark:bg-white/5">
                        <UserRound className="h-8 w-8 text-slate-400" />
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          Select a user from the table to inspect the record.
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Browser Notifications
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Connect this browser and send a quick test when needed.
                        </p>
                      </div>

                      <Badge
                        className={statusClasses(
                          pushCapability.subscribed
                            ? "emerald"
                            : pushCapability.permission === "denied"
                              ? "rose"
                              : "slate",
                        )}
                        variant="outline"
                      >
                        {pushStatusLabel}
                      </Badge>
                    </div>

                    <div className="mt-5 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        Permission:{" "}
                        <span className="font-semibold capitalize">
                          {pushCapability.permission}
                        </span>
                      </p>
                      <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">
                        {pushCapability.endpoint
                          ? `Endpoint: ${pushCapability.endpoint}`
                          : "No push subscription is saved for this browser yet."}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        className="rounded-2xl"
                        disabled={pushLoading || !pushCapability.supported}
                        onClick={() => void handleEnablePush()}
                      >
                        {pushLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                        Enable
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        disabled={pushLoading || !pushCapability.supported}
                        onClick={() => void handleDisablePush()}
                      >
                        <BellOff className="h-4 w-4" />
                        Disable
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-2xl"
                        disabled={
                          sendingPushTest ||
                          !pushCapability.subscribed ||
                          !token ||
                          !adminId
                        }
                        onClick={() => void handleSendPushTest()}
                      >
                        {sendingPushTest ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send test
                      </Button>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Notification History
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Review recent admin notifications without leaving the
                          dashboard.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={statusClasses(
                            unreadNotificationCount > 0 ? "emerald" : "slate",
                          )}
                          variant="outline"
                        >
                          {unreadNotificationCount} unread
                        </Badge>
                        <Button
                          variant="secondary"
                          className="rounded-2xl"
                          disabled={
                            markingAllNotificationsRead ||
                            unreadNotificationCount === 0
                          }
                          onClick={() => void handleMarkAllNotificationsAsRead()}
                        >
                          {markingAllNotificationsRead ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                          Mark all read
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {loadingNotifications ? (
                        <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/80 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          No admin notifications have been stored yet.
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const isBusy = notificationActionId === notification.id;

                          return (
                            <div
                              key={notification.id}
                              className={`rounded-3xl border p-4 ${
                                notification.isRead
                                  ? "border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/5"
                                  : "border-sky-200 bg-sky-50/80 dark:border-cyan-500/20 dark:bg-cyan-500/10"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                                    {notification.title || "Untitled notification"}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={statusClasses(
                                      notification.isRead ? "slate" : "emerald",
                                    )}
                                  >
                                    {notification.isRead ? "Read" : "Unread"}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                  {notification.body}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span>{formatDate(notification.createdAt ?? undefined)}</span>
                                  {notification.type ? <span>{notification.type}</span> : null}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {notification.url ? (
                                  <a
                                    className="inline-flex h-9 items-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                                    href={notification.url}
                                  >
                                    Open target
                                  </a>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-2xl"
                                  disabled={isBusy || notification.isRead}
                                  onClick={() =>
                                    void handleMarkNotificationAsRead(notification.id)
                                  }
                                >
                                  {isBusy && !notification.isRead ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                  Mark read
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-2xl"
                                  disabled={isBusy}
                                  onClick={() =>
                                    void handleDeleteNotification(notification.id)
                                  }
                                >
                                  {isBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page {notificationsCurrentPage} of {notificationsPageCount}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={notificationsCurrentPage <= 1 || loadingNotifications}
                          onClick={() =>
                            setNotificationsPage((current) => Math.max(1, current - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            notificationsCurrentPage >= notificationsPageCount ||
                            loadingNotifications
                          }
                          onClick={() =>
                            setNotificationsPage((current) =>
                              current >= notificationsPageCount ? current : current + 1,
                            )
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </section>
                </aside>
              </section>
              ) : null}

              {activeSection === "notifications" ? (
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Notification Center
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Review unread alerts, system reminders, and push activity.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={statusClasses(
                            unreadNotificationCount > 0 ? "emerald" : "slate",
                          )}
                          variant="outline"
                        >
                          {unreadNotificationCount} unread
                        </Badge>
                        <Button
                          variant="secondary"
                          className="rounded-2xl"
                          disabled={
                            markingAllNotificationsRead || unreadNotificationCount === 0
                          }
                          onClick={() => void handleMarkAllNotificationsAsRead()}
                        >
                          {markingAllNotificationsRead ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                          Mark all read
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10">
                      {loadingNotifications ? (
                        <div className="flex min-h-40 items-center justify-center bg-slate-50/80 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                          No admin notifications have been stored yet.
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-slate-200/80 dark:divide-white/10">
                          <thead className="bg-slate-50/80 dark:bg-white/5">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Notification
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Type
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Status
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Created
                              </th>
                              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                            {notifications.map((notification) => {
                              const isBusy = notificationActionId === notification.id;
                              const isSelected = notification.id === selectedNotificationId;

                              return (
                                <tr
                                  key={notification.id}
                                  className={
                                    isSelected
                                      ? "bg-slate-50/80 dark:bg-white/5"
                                      : "bg-white dark:bg-zinc-900"
                                  }
                                >
                                  <td className="px-5 py-4">
                                    <button
                                      type="button"
                                      className="min-w-0 text-left"
                                      onClick={() => setSelectedNotificationId(notification.id)}
                                    >
                                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                                        {notification.title || "Untitled notification"}
                                      </p>
                                      <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                                        {notification.body}
                                      </p>
                                    </button>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {notification.type || "General"}
                                  </td>
                                  <td className="px-5 py-4">
                                    <Badge
                                      variant="outline"
                                      className={statusClasses(getNotificationTone(notification))}
                                    >
                                      {getNotificationLabel(notification)}
                                    </Badge>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(notification.createdAt ?? undefined)}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-2xl"
                                        disabled={isBusy || notification.isRead}
                                        onClick={() =>
                                          void handleMarkNotificationAsRead(notification.id)
                                        }
                                      >
                                        {isBusy && !notification.isRead ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Bell className="h-4 w-4" />
                                        )}
                                        Read
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-2xl"
                                        disabled={isBusy}
                                        onClick={() =>
                                          void handleDeleteNotification(notification.id)
                                        }
                                      >
                                        {isBusy ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page {notificationsCurrentPage} of {notificationsPageCount}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={notificationsCurrentPage <= 1 || loadingNotifications}
                          onClick={() =>
                            setNotificationsPage((current) => Math.max(1, current - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            notificationsCurrentPage >= notificationsPageCount ||
                            loadingNotifications
                          }
                          onClick={() =>
                            setNotificationsPage((current) =>
                              current >= notificationsPageCount ? current : current + 1,
                            )
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            Selected Notification
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Keep the current alert visible while triaging the queue.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <AdminSummaryCard
                          label="Unread"
                          value={formatCount(unreadNotificationCount)}
                          helper="Notifications still needing admin review"
                        />
                        <AdminSummaryCard
                          label="Stored"
                          value={formatCount(notificationsMeta?.totalCount ?? notifications.length)}
                          helper="Notification records currently available"
                        />
                      </div>

                      {selectedNotification ? (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-slate-950 dark:text-slate-50">
                                  {selectedNotification.title || "Untitled notification"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  {selectedNotification.type || "General notification"}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={statusClasses(getNotificationTone(selectedNotification))}
                              >
                                {getNotificationLabel(selectedNotification)}
                              </Badge>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {selectedNotification.body}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Status
                              </p>
                              <div className="mt-2">
                                <Badge
                                  variant="outline"
                                  className={statusClasses(getNotificationTone(selectedNotification))}
                                >
                                  {getNotificationLabel(selectedNotification)}
                                </Badge>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Notification ID
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                #{selectedNotification.id}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Created
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {formatDate(selectedNotification.createdAt ?? undefined)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Read At
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {formatDate(selectedNotification.readAt ?? undefined)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {selectedNotification.url ? (
                              <a
                                className="inline-flex h-10 items-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                                href={selectedNotification.url}
                              >
                                Open target
                              </a>
                            ) : null}
                            <Button
                              className="rounded-2xl"
                              disabled={
                                notificationActionId === selectedNotification.id ||
                                selectedNotification.isRead
                              }
                              onClick={() =>
                                void handleMarkNotificationAsRead(selectedNotification.id)
                              }
                            >
                              <Bell className="h-4 w-4" />
                              Mark read
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              disabled={notificationActionId === selectedNotification.id}
                              onClick={() =>
                                void handleDeleteNotification(selectedNotification.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/80 px-5 py-8 text-center dark:border-white/10 dark:bg-white/5">
                          <Bell className="h-8 w-8 text-slate-400" />
                          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Select a notification from the table to inspect it.
                          </p>
                        </div>
                      )}
                    </section>
                  </aside>
                </section>
              ) : null}

              {activeSection === "devices" ? (
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-slate-500" />
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            User Device Monitoring
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Review stored device sessions reported by the backend for admin visibility.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <AdminSummaryCard
                          label="Tracked Entity"
                          value="UserDevice"
                          helper="Backend model already exists for device records"
                        />
                        <AdminSummaryCard
                          label="Selected User"
                          value={selectedDevice?.user ? `#${selectedDevice.user.id}` : "None"}
                          helper="User attached to the selected device record"
                        />
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            Registered Devices
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Browser, OS, IP address, and created time from `/admin/users/devices`.
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {formatCount(devicesMeta?.totalCount ?? devices.length)} devices
                        </Badge>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10">
                        {loadingDevices ? (
                          <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading devices...
                          </div>
                        ) : devices.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                            No device records returned.
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-slate-200/80 dark:divide-white/10">
                            <thead className="bg-slate-50/80 dark:bg-white/5">
                              <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                  User
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                  Browser
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                  OS
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                  Created
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                              {devices.map((device) => {
                                const isSelected = device.id === selectedDeviceId;
                                return (
                                  <tr
                                    key={device.id}
                                    className={
                                      isSelected
                                        ? "bg-slate-50/80 dark:bg-white/5"
                                        : "bg-white dark:bg-zinc-900"
                                    }
                                  >
                                    <td className="px-5 py-4">
                                      <button
                                        type="button"
                                        className="flex items-center gap-3 text-left"
                                        onClick={() => setSelectedDeviceId(device.id)}
                                      >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                          {getInitials(device.user?.name || `User ${device.userId}`)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                                            {device.user?.name || `User #${device.userId}`}
                                          </p>
                                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                            {device.user?.email || `User ID ${device.userId}`}
                                          </p>
                                        </div>
                                      </button>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                      {device.browser || "Unknown"}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                      {device.os || "Unknown"}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                                      {formatDate(device.createdAt)}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <Button
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-2xl"
                                        onClick={() => setSelectedDeviceId(device.id)}
                                      >
                                        {isSelected ? "Selected" : "View details"}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Page {devicesCurrentPage} of {devicesPageCount}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={devicesCurrentPage <= 1 || loadingDevices}
                            onClick={() =>
                              setDevicesPage((current) => Math.max(1, current - 1))
                            }
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={
                              devicesCurrentPage >= devicesPageCount || loadingDevices
                            }
                            onClick={() =>
                              setDevicesPage((current) =>
                                current >= devicesPageCount ? current : current + 1,
                              )
                            }
                          >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                        Device Summary
                      </h2>
                      <div className="mt-4 grid gap-3">
                        <AdminSummaryCard
                          label="Records"
                          value={formatCount(devicesMeta?.totalCount ?? devices.length)}
                          helper="Device rows available in the current backend dataset"
                        />
                        <AdminSummaryCard
                          label="Deleted"
                          value={formatCount(devices.filter((device) => device.isDeleted).length)}
                          helper="Rows flagged as deleted on the current page"
                        />
                      </div>
                      {selectedDevice ? (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-4">
                              {selectedDevice.user?.avatarUrl ? (
                                <img
                                  src={selectedDevice.user.avatarUrl}
                                  alt={`${selectedDevice.user.name || "User"} avatar`}
                                  className="h-14 w-14 rounded-2xl border border-slate-200/80 object-cover dark:border-white/10"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-base font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                                  {getInitials(selectedDevice.user?.name || `User ${selectedDevice.userId}`)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-slate-950 dark:text-slate-50">
                                  {selectedDevice.user?.name || "Unknown user"}
                                </p>
                                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                  {selectedDevice.user?.email || `User ID ${selectedDevice.userId}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                User Status
                              </p>
                              <div className="mt-2">
                                <Badge
                                  variant="outline"
                                  className={`rounded-full px-2.5 py-0.5 ${statusClasses(
                                    getStatusTone(selectedDevice.user ?? null),
                                  )}`}
                                >
                                  {getStatusLabel(selectedDevice.user ?? null)}
                                </Badge>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Device ID
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                #{selectedDevice.id}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                User ID
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                #{selectedDevice.user?.id ?? selectedDevice.userId}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Browser
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {selectedDevice.browser || "Unknown"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                OS
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {selectedDevice.os || "Unknown"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                IP Address
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {selectedDevice.ip || "Unknown"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Device Created
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {formatDate(selectedDevice.createdAt)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                User Created
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {formatDate(selectedDevice.user?.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <p>Select a device row to inspect the populated user fields.</p>
                          <p>`browser` / `broswer` is normalized to a single browser field.</p>
                        </div>
                      )}
                    </section>
                  </aside>
                </section>
              ) : null}

              {activeSection === "settings" ? (
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            Browser Push Settings
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Control browser permission state and test the admin notification pipeline.
                          </p>
                        </div>
                        <Badge
                          className={statusClasses(
                            pushCapability.subscribed
                              ? "emerald"
                              : pushCapability.permission === "denied"
                                ? "rose"
                                : "slate",
                          )}
                          variant="outline"
                        >
                          {pushStatusLabel}
                        </Badge>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          Permission:{" "}
                          <span className="font-semibold capitalize">
                            {pushCapability.permission}
                          </span>
                        </p>
                        <p className="mt-1.5 break-all text-xs text-slate-500 dark:text-slate-400">
                          {pushCapability.endpoint
                            ? `Endpoint: ${pushCapability.endpoint}`
                            : "No push subscription is saved for this browser yet."}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          className="rounded-2xl"
                          disabled={pushLoading || !pushCapability.supported}
                          onClick={() => void handleEnablePush()}
                        >
                          {pushLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                          Enable
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          disabled={pushLoading || !pushCapability.supported}
                          onClick={() => void handleDisablePush()}
                        >
                          <BellOff className="h-4 w-4" />
                          Disable
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-2xl"
                          disabled={
                            sendingPushTest ||
                            !pushCapability.subscribed ||
                            !token ||
                            !adminId
                          }
                          onClick={() => void handleSendPushTest()}
                        >
                          {sendingPushTest ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send test
                        </Button>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                        Admin Access
                      </h2>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <AdminSummaryCard
                          label="Auth Route"
                          value="/admin/login"
                          helper="Dedicated admin auth flow with isolated session"
                        />
                        <AdminSummaryCard
                          label="Admin Role"
                          value={admin?.role || "admin"}
                          helper="Role used for admin-only access middleware"
                        />
                      </div>
                    </section>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                        Security Notes
                      </h2>
                      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>Admin login uses email, password, and private key.</p>
                        <p>Admin sessions are isolated from regular user sessions.</p>
                        <p>Push settings are browser-specific, not account-global.</p>
                      </div>
                    </section>
                  </aside>
                </section>
              ) : null}
            </div>
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}
