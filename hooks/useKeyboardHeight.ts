import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const useKeyboardHeight = () => {
    const [height, setHeight] = useState<string>('100dvh');
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const update = useCallback(() => {
        if (!Capacitor.isNativePlatform()) return;

        const viewportHeight = window.innerHeight;
        const fullHeight = window.screen.height;
        const keyboardVisible = fullHeight - viewportHeight > 150;

        setIsKeyboardOpen(keyboardVisible);
        setHeight(`${viewportHeight}px`);
    }, []);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        update();

        window.addEventListener('resize', update);

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', update);
        }

        return () => {
            window.removeEventListener('resize', update);
            if (vv) {
                vv.removeEventListener('resize', update);
            }
        };
    }, [update]);

    return { height, isKeyboardOpen };
};

