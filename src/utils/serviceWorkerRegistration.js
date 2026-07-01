// Service worker registration utility
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker?.register('/service-worker.js')?.then((registration) => {
          console.log('Service Worker registered successfully:', registration?.scope);

          // Check for updates periodically
          setInterval(() => {
            registration?.update();
          }, 60000); // Check every minute

          // Handle service worker updates
          registration?.addEventListener('updatefound', () => {
            const newWorker = registration?.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker?.state === 'installed' && navigator.serviceWorker?.controller) {
                // New service worker available, prompt user to refresh
                if (confirm('New version available! Reload to update?')) {
                  newWorker?.postMessage({ type: 'SKIP_WAITING' });
                  window.location?.reload();
                }
              }
            });
          });
        })?.catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker?.addEventListener('controllerchange', () => {
        window.location?.reload();
      });
    });
  }
}

// Unregister service worker (for development/testing)
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker?.ready?.then((registration) => {
        registration?.unregister();
      })?.catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
}