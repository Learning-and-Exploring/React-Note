self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload?.title || "Notification";
  const options = {
    body: payload?.body || "",
    data: {
      url: payload?.url || "/admin",
      type: payload?.type || "general",
      meta: payload?.meta || {},
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => {
        return "focus" in client && client.url.includes(targetUrl);
      });

      if (matchingClient) {
        return matchingClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
