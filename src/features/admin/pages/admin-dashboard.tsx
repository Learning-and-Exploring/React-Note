import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  adminService,
  type AdminUser,
  type AdminUsersMeta,
} from "../admin-service";
import { useAdmin } from "../hooks/use-admin";
import { formatDate } from "@features/notes/utils/format-date";

type FilterState = {
  name: string;
  email: string;
  isActive: boolean;
  includeDeleted: boolean;
};

type SummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

const DEFAULT_FILTERS: FilterState = {
  name: "",
  email: "",
  isActive: true,
  includeDeleted: false,
};

const PAGE_SIZE = 10;

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

function SummaryCard({ label, value, helper }: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const { token, admin, logout } = useAdmin();
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

  const currentPage = getCurrentPage(meta);
  const totalPages = getPageCount(meta);
  const selectedStatusTone = getStatusTone(selectedUser);

  const querySummary = useMemo(() => {
    const parts = [
      appliedFilters.name ? `name: ${appliedFilters.name}` : null,
      appliedFilters.email ? `email: ${appliedFilters.email}` : null,
      appliedFilters.isActive ? "active only" : "inactive only",
      appliedFilters.includeDeleted ? "deleted included" : "deleted hidden",
    ].filter(Boolean);

    return parts.join(" • ");
  }, [appliedFilters]);

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
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
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

  return (
    <main className="h-screen overflow-hidden bg-slate-100 dark:bg-zinc-950">
      <div className="grid h-full min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200/80 bg-white px-6 py-7 dark:border-white/10 dark:bg-zinc-900 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white">
              D
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                DataStore
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Admin workspace
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-2">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-slate-950 dark:bg-white/8 dark:text-slate-50">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-600 dark:text-slate-300">
              <Users className="h-4 w-4" />
              <span>User Directory</span>
            </div>
          </div>

          <div className="mt-auto rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Reserved for future real admin modules when new APIs exist.
          </div>
        </aside>

        <section className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <header className="border-b border-slate-200/80 bg-white px-4 py-4 dark:border-white/10 dark:bg-zinc-900 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <form
                className="flex w-full max-w-[720px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5"
                onSubmit={handleSubmitFilters}
              >
                <Search className="h-5 w-5 text-slate-400" />
                <Input
                  className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  placeholder="Search users by name..."
                  value={filters.name}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => void loadUsers()}
                  disabled={loadingUsers}
                >
                  <RefreshCw className={loadingUsers ? "animate-spin" : ""} />
                </Button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                    {getInitials(admin?.name || "Admin")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {admin?.name || "Admin"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {admin?.email || "admin@local"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-0 overflow-y-auto px-4 py-6 sm:px-6">
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

              <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <SummaryCard
                  label="Filtered Users"
                  value={formatCount(meta?.totalCount ?? users.length)}
                  helper="Results returned by the current query"
                />
                <SummaryCard
                  label="Visible Rows"
                  value={formatCount(users.length)}
                  helper={`Page size ${PAGE_SIZE}`}
                />
                <SummaryCard
                  label="Status Filter"
                  value={appliedFilters.isActive ? "Active" : "Inactive"}
                  helper="Driven by the new isActive filter"
                />
                <SummaryCard
                  label="Page"
                  value={`${currentPage}/${totalPages}`}
                  helper="Server-side pagination"
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          Filters
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Only uses fields supported by the current admin API.
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
                      className="mt-5 grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"
                      onSubmit={handleSubmitFilters}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Name
                          </label>
                          <Input
                            className="mt-2 h-11 rounded-2xl"
                            placeholder="Filter by name"
                            value={filters.name}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Email
                          </label>
                          <Input
                            className="mt-2 h-11 rounded-2xl"
                            placeholder="Filter by email"
                            value={filters.email}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" className="rounded-2xl">
                            <Search className="h-4 w-4" />
                            Apply
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={handleResetFilters}
                          >
                            Reset
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
                    </form>
                  </section>

                  <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex flex-col gap-3 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          User Directory
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {querySummary}
                        </p>
                      </div>

                      <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                        `GET /admin/users`
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
                              <th className="px-5 py-4 font-medium">Created</th>
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
                                  className={`border-t border-slate-200/70 transition dark:border-white/10 ${
                                    isSelected
                                      ? "bg-slate-100 dark:bg-white/6"
                                      : "hover:bg-slate-50/80 dark:hover:bg-white/4"
                                  }`}
                                >
                                  <td className="px-5 py-4">
                                    <button
                                      type="button"
                                      className="flex items-center gap-3 text-left"
                                      onClick={() => setSelectedUserId(user.id)}
                                    >
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
                                    </button>
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
                                    {formatDate(user.createdAt)}
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
                                      onClick={() => void handleToggleUserActive(user.id)}
                                    >
                                      {isBusy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : user.isActive === false ? (
                                        <ShieldCheck className="h-4 w-4" />
                                      ) : (
                                        <ShieldAlert className="h-4 w-4" />
                                      )}
                                      Toggle
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
                  <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-3 px-5 py-5">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          User Inspector
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          `GET /admin/users/:id`
                        </p>
                      </div>
                      {loadingSelectedUser ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : null}
                    </div>

                    <Separator />

                    {selectedUser ? (
                      <div className="space-y-5 p-5">
                        <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
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

                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Account ID
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              #{selectedUser.id}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
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

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Created
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {formatDate(selectedUser.createdAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Updated
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {formatDate(selectedUser.updatedAt)}
                            </p>
                          </div>

                          {selectedUser.isDeleted ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                              This user is soft-deleted and is only visible because
                              `includeDeleted` is enabled.
                            </div>
                          ) : null}
                        </div>

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
                          Toggle Access
                        </Button>
                      </div>
                    ) : (
                      <div className="flex min-h-[360px] flex-col items-center justify-center px-5 py-8 text-center">
                        <UserRound className="h-8 w-8 text-slate-400" />
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          Select a user from the table to inspect the record.
                        </p>
                      </div>
                    )}
                  </section>
                </aside>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
