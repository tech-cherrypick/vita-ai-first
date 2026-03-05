import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export const useAndroidBackButton = (onBack: () => boolean) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      const handled = onBack();
      if (!handled) {
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [onBack]);
};

