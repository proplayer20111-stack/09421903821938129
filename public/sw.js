self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: "Aba squads discord", body: event.data?.text() || "New call activity" };
  }

  event.waitUntil(self.registration.showNotification(data.title || "Aba squads discord", {
    body: data.body || "New call activity",
    tag: data.tag || "aba-call",
    renotify: true,
    icon: data.icon || "/icon.svg",
    badge: data.icon || "/icon.svg",
    data: { url: data.url || "/" }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        client.navigate?.(targetUrl);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
