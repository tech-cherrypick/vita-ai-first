import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useKeyboardHeight = () => {
    const [height, setHeight] = useState<string>('100%');

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !window.visualViewport) return;

        const vv = window.visualViewport;

        const onResize = () => {
            setHeight(`${vv.height}px`);
        };

        onResize();
        vv.addEventListener('resize', onResize);
        return () => vv.removeEventListener('resize', onResize);
    }, []);

    return height;
};

