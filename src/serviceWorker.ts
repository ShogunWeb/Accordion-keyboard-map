import { buildVersion } from "./buildInfo";

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
  const versionUrl = `${scope}version.json`;
  let refreshing = false;
  let checkingForUpdates = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) {
      return;
    }

    refreshing = true;
    window.location.reload();
  });

  const notifyUpdate = (registration: ServiceWorkerRegistration) => {
    if (registration.waiting) {
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

  const readRemoteVersion = () =>
    fetch(`${versionUrl}?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return undefined;
        }

        return response.json() as Promise<{ version?: string }>;
      })
      .then((data) => data?.version)
      .catch(() => undefined);

  const register = () =>
    navigator.serviceWorker
      .register(swUrl, { scope, updateViaCache: "none" })
      .then((registration) => {
        notifyUpdate(registration);

        registration.addEventListener("updatefound", () => {
          trackInstallingWorker(registration);
        });

        const checkForUpdates = async () => {
          if (checkingForUpdates) {
            return;
          }

          checkingForUpdates = true;
          try {
            const remoteVersion = await readRemoteVersion();
            if (remoteVersion && remoteVersion !== buildVersion) {
              await registration.update();
              notifyUpdate(registration);
              window.setTimeout(() => notifyUpdate(registration), 1000);
              window.setTimeout(() => notifyUpdate(registration), 4000);
              return;
            }

            await registration.update();
            notifyUpdate(registration);
          } catch {
            // Update checks are best-effort and should never block the app.
          } finally {
            checkingForUpdates = false;
          }
        };

        checkForUpdates();
        window.setTimeout(checkForUpdates, 3000);
        window.addEventListener("focus", checkForUpdates);
        window.addEventListener("online", checkForUpdates);
        window.addEventListener("pageshow", checkForUpdates);
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
