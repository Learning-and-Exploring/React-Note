import axios from "axios";
import { BASE_URL } from "@features/notes/services/notes-service";
import { extractMessage } from "@features/notes/utils/notes-utils";

const pushApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushCapability = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  endpoint: string | null;
};

export type AdminNotification = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  type: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
};

export type AdminNotificationsMeta = {
  currentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  pageCount: number;
  totalCount: number;
};

export type AdminNotificationsResponse = {
  data: AdminNotification[];
  meta: AdminNotificationsMeta | null;
};

export type AdminNotificationsParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizeNotification(raw: unknown): AdminNotification {
  const record = (raw ?? {}) as Record<string, unknown>;

  return {
    id: Number(record.id ?? 0),
    title: String(record.title ?? ""),
    body: String(record.body ?? ""),
    url: typeof record.url === "string" ? record.url : null,
    type: typeof record.type === "string" ? record.type : null,
    isRead: Boolean(record.isRead),
    readAt: typeof record.readAt === "string" ? record.readAt : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : null,
  };
}

function normalizeNotifications(raw: unknown): AdminNotification[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeNotification);
}

function getVapidPublicKey() {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (typeof key !== "string" || key.trim().length === 0) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY in the frontend environment.");
  }

  return key.trim();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function normalizeSubscription(
  subscription: PushSubscription,
): PushSubscriptionPayload {
  const json = subscription.toJSON();
  const keys = json.keys;

  if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Browser returned an invalid push subscription.");
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };
}

async function getServiceWorkerRegistration() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready.then(() => registration);
}

export function extractAdminIdFromToken(token: string): number | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    const rawUserId = decoded?.userId;
    const adminId = Number(rawUserId);

    if (!Number.isInteger(adminId) || adminId <= 0) return null;
    return adminId;
  } catch {
    return null;
  }
}

export const adminPushService = {
  async getCapability(): Promise<PushCapability> {
    if (!isPushSupported()) {
      return {
        supported: false,
        permission: "unsupported",
        subscribed: false,
        endpoint: null,
      };
    }

    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    return {
      supported: true,
      permission: Notification.permission,
      subscribed: Boolean(subscription),
      endpoint: subscription?.endpoint ?? null,
    };
  },

  async subscribe(token: string): Promise<PushCapability> {
    if (!isPushSupported()) {
      throw new Error("This browser does not support web push notifications.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was not granted.");
    }

    const registration = await getServiceWorkerRegistration();
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
      }));

    await pushApi.post(
      "/push/admin/subscribe",
      normalizeSubscription(subscription),
      { headers: authHeaders(token) },
    );

    return {
      supported: true,
      permission,
      subscribed: true,
      endpoint: subscription.endpoint,
    };
  },

  async unsubscribe(token: string): Promise<PushCapability> {
    if (!isPushSupported()) {
      return {
        supported: false,
        permission: "unsupported",
        subscribed: false,
        endpoint: null,
      };
    }

    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await pushApi.post(
        "/push/admin/unsubscribe",
        { endpoint: subscription.endpoint },
        { headers: authHeaders(token) },
      );
      await subscription.unsubscribe();
    }

    return {
      supported: true,
      permission: Notification.permission,
      subscribed: false,
      endpoint: null,
    };
  },

  async sendTestNotification(token: string, adminId: number): Promise<void> {
    try {
      await pushApi.post(
        `/push/admin/${adminId}/send`,
        {
          payload: {
            title: "Admin push is active",
            body: "The browser subscription is connected to the Note admin console.",
            url: `${window.location.origin}/admin`,
            type: "admin_push_test",
            meta: {
              source: "admin_dashboard",
              sentAt: new Date().toISOString(),
            },
          },
        },
        { headers: authHeaders(token) },
      );
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async listNotifications(
    token: string,
    params: AdminNotificationsParams = {},
  ): Promise<AdminNotificationsResponse> {
    try {
      const response = await pushApi.get("/push/admin/notifications/me", {
        headers: authHeaders(token),
        params,
      });
      const raw = response.data ?? {};

      return {
        data: normalizeNotifications((raw as Record<string, unknown>).data),
        meta:
          ((raw as Record<string, unknown>).meta as AdminNotificationsMeta) ??
          null,
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async getUnreadCount(token: string): Promise<number> {
    try {
      const response = await pushApi.get("/push/admin/notifications/me/unread-count", {
        headers: authHeaders(token),
      });
      const data = response.data?.data ?? response.data;
      const unreadCount = Number(
        (data as Record<string, unknown> | undefined)?.unreadCount ?? 0,
      );

      return Number.isFinite(unreadCount) ? unreadCount : 0;
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async markNotificationAsRead(token: string, notificationId: number): Promise<void> {
    try {
      await pushApi.patch(
        `/push/admin/notifications/me/${notificationId}/read`,
        {},
        {
          headers: authHeaders(token),
        },
      );
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async markAllNotificationsAsRead(token: string): Promise<number> {
    try {
      const response = await pushApi.patch(
        "/push/admin/notifications/me/read-all",
        {},
        {
          headers: authHeaders(token),
        },
      );
      const data = response.data?.data ?? response.data;
      const count = Number((data as Record<string, unknown> | undefined)?.count ?? 0);

      return Number.isFinite(count) ? count : 0;
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async deleteNotification(token: string, notificationId: number): Promise<void> {
    try {
      await pushApi.delete(`/push/admin/notifications/me/${notificationId}`, {
        headers: authHeaders(token),
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};
