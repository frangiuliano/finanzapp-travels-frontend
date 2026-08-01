import { type BeforeInstallPromptEvent, isStandaloneMode } from '@/lib/pwa';

type InstallSnapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
};

let snapshot: InstallSnapshot = {
  deferredPrompt: null,
  isInstalled: isStandaloneMode(),
};

const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((listener) => listener());
}

let listenersInitialized = false;

export function initPwaInstallListeners(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    snapshot = {
      ...snapshot,
      deferredPrompt: event as BeforeInstallPromptEvent,
    };
    notify();
  });

  window.addEventListener('appinstalled', () => {
    snapshot = {
      deferredPrompt: null,
      isInstalled: true,
    };
    notify();
  });
}

export function subscribePwaInstall(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getPwaInstallSnapshot(): InstallSnapshot {
  return snapshot;
}

export function clearDeferredInstallPrompt(): void {
  snapshot = {
    ...snapshot,
    deferredPrompt: null,
  };
  notify();
}

export function markPwaInstalled(): void {
  snapshot = {
    deferredPrompt: null,
    isInstalled: true,
  };
  notify();
}
