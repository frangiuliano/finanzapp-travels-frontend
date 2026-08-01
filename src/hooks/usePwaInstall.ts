import { useCallback, useState, useSyncExternalStore } from 'react';
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isIosDevice,
} from '@/lib/pwa';
import {
  clearDeferredInstallPrompt,
  getPwaInstallSnapshot,
  markPwaInstalled,
  subscribePwaInstall,
} from '@/lib/pwa-install-store';

export function usePwaInstall() {
  const { deferredPrompt, isInstalled } = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  );
  const [dismissed, setDismissed] = useState(isInstallPromptDismissed);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    clearDeferredInstallPrompt();

    if (outcome === 'accepted') {
      markPwaInstalled();
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setDismissed(true);
  }, []);

  const showIosHint = isIosDevice() && !isInstalled && !dismissed;
  const showAndroidPrompt = !!deferredPrompt && !isInstalled && !dismissed;
  const showPrompt = showIosHint || showAndroidPrompt;

  return {
    canInstall: !!deferredPrompt,
    dismiss,
    install,
    isInstalled,
    showIosHint,
    showPrompt,
  };
}
