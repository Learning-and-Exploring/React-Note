import {
  Bell,
  LayoutDashboard,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";

export type AdminSection =
  | "overview"
  | "users"
  | "notifications"
  | "devices"
  | "settings";

type AdminSidebarProps = {
  activeSection: AdminSection;
  adminName: string;
  adminEmail: string;
  getInitials: (name: string) => string;
  onSelectSection: (section: AdminSection) => void;
  pushStatusLabel: string;
  selectedUserId: number | null;
  unreadNotificationCount: number;
};

export function AdminSidebar({
  activeSection,
  adminName,
  adminEmail,
  getInitials,
  onSelectSection,
  pushStatusLabel,
  selectedUserId,
  unreadNotificationCount,
}: AdminSidebarProps) {
  return (
    <aside className="h-screen overflow-hidden border-b border-slate-200/80 bg-slate-950 px-5 py-6 text-white dark:border-white/10 lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
            {getInitials(adminName)}
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Note Admin</p>
            <p className="text-sm text-white/65">Operations console</p>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {[
            { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
            { id: "users" as const, label: "Users", icon: Users },
            { id: "notifications" as const, label: "Notifications", icon: Bell },
            { id: "devices" as const, label: "User Devices", icon: Smartphone },
            { id: "settings" as const, label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-white/72 hover:bg-white/8 hover:text-white"
                }`}
                onClick={() => onSelectSection(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
                {item.id === "notifications" && unreadNotificationCount > 0 ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                      active ? "bg-slate-950 text-white" : "bg-white/12 text-white"
                    }`}
                  >
                    {unreadNotificationCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-white/72">
          <p className="font-semibold text-white">Current admin</p>
          <p className="mt-2 truncate">{adminName}</p>
          <p className="truncate text-white/55">{adminEmail}</p>
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-white/72">
          <p className="font-semibold text-white">Quick status</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span>Push</span>
              <span className="font-medium text-white">{pushStatusLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Unread alerts</span>
              <span className="font-medium text-white">{unreadNotificationCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Selected user</span>
              <span className="font-medium text-white">
                {selectedUserId ? `#${selectedUserId}` : "None"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
