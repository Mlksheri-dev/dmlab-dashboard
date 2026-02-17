import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GLOBAL FAILSAFE COMPONENT
 * Recovers the UI from library-level locks (Radix/Dialogs) on every navigation.
 */
export function GlobalFailsafe() {
    const location = useLocation();

    useEffect(() => {
        const forceRecovery = () => {
            try {
                // 1. CLEAR BODY LOCKS
                const rootElements = [document.body, document.documentElement];
                rootElements.forEach(el => {
                    if (!el) return;
                    el.style.pointerEvents = 'auto';
                    el.style.overflow = 'auto';
                    el.style.removeProperty('pointer-events');
                    el.style.removeProperty('overflow');

                    // Clear any library attributes that force hiding
                    el.removeAttribute('data-state');
                    el.removeAttribute('data-radix-scroll-lock');

                    // Overwrite any !important styles
                    el.setAttribute('style', (el.getAttribute('style') || '')
                        .replace(/pointer-events:\s*none/gi, 'pointer-events: auto')
                        .replace(/overflow:\s*hidden/gi, 'overflow: auto'));
                });

                // 2. HIDE STUCK OVERLAYS (Wait-mode)
                // We look for common Radix/Portal patterns that cover the screen
                const stuckOverlays = document.querySelectorAll('[data-radix-portal], .radix-overlay, [role="presentation"]');
                stuckOverlays.forEach(overlay => {
                    if (overlay && overlay.parentNode) {
                        (overlay as HTMLElement).style.opacity = '0';
                        (overlay as HTMLElement).style.pointerEvents = 'none';
                        (overlay as HTMLElement).style.visibility = 'hidden';
                    }
                });
            } catch (err) {
                console.error("Failsafe recovery error:", err);
            }
        };

        // Immediate execution
        forceRecovery();

        // Delayed execution to catch transitions
        const timers = [100, 300, 800].map(ms => setTimeout(forceRecovery, ms));

        return () => timers.forEach(t => clearTimeout(t));
    }, [location.pathname]);

    return null;
}
