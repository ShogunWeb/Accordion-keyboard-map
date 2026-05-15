export type ServiceWorkerUpdateCallback = (registration: ServiceWorkerRegistration) => void;

interface RegisterServiceWorkerOptions {
  onUpdate?: ServiceWorkerUpdateCallback;
}

/**
 * Register the service worker to enable offline support, installability, and
 * user-controlled app updates.
 */
export function registerServiceWorker(options: RegisterServiceWorkerOptions = {}) {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  const scope = import.meta.env.BASE_URL;
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) {
      return;
    }

    refreshing = true;
    window.location.reload();
  });

  const notifyUpdate = (registration: ServiceWorkerRegistration) => {
    if (registration.waiting && navigator.serviceWorker.controller) {
      options.onUpdate?.(registration);
    }
  };

  const trackInstallingWorker = (registration: ServiceWorkerRegistration) => {
    const worker = registration.installing;
    if (!worker) {
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") {
        notifyUpdate(registration);
      }
    });
  };

  const register = () =>
    navigator.serviceWorker
      .register(swUrl, { scope })
      .then((registration) => {
        notifyUpdate(registration);

        registration.addEventListener("updatefound", () => {
          trackInstallingWorker(registration);
        });

        const checkForUpdates = () => registration.update().catch(() => {});

        checkForUpdates();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdates();
          }
        });
      })
      .catch((error) =>
        console.error("Service worker registration failed:", error)
      );

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

/**
 * Ask the waiting service worker to activate immediately.
 */
export function activateServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}
