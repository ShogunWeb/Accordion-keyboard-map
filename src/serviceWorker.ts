/**
 * Register the service worker to enable offline support and installability.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  const scope = import.meta.env.BASE_URL;

  const register = () =>
    navigator.serviceWorker
      .register(swUrl, { scope })
      .catch((error) =>
        console.error("Service worker registration failed:", error)
      );

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
