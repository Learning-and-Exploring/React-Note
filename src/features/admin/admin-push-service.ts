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

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
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
};
