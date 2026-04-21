import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import '../css/app.css';
import './bootstrap';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './Components/base/Toast';

// Resolve page components with graceful Error page fallback.
const pages = import.meta.glob('./Pages/**/*.tsx');

async function resolveWithErrorFallback(name: string) {
    try {
        return await resolvePageComponent(`./Pages/${name}.tsx`, pages);
    } catch {
        // Push the broken URL out of the navigation stack so back-button works
        if (typeof window !== 'undefined') {
            window.history.replaceState(window.history.state, '', window.location.href);
        }
        // Load our Error page (now guaranteed to exist at Pages/Error.tsx)
        try {
            return await resolvePageComponent('./Pages/Error.tsx', pages);
        } catch {
            // Ultimate fallback — should never reach here
            return {
                default: () => (
                    <div style={{ padding: 32, color: '#dc2626', fontFamily: 'sans-serif', textAlign: 'center' }}>
                        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Page Not Found</h1>
                        <p>The page <b>{name}</b> could not be loaded.</p>
                        <button
                            onClick={() => window.history.back()}
                            style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                            Go Back
                        </button>
                    </div>
                )
            };
        }
    }
}

createInertiaApp({
    title: (title) => `${title} — EatNGo Biometrics`,
    resolve: resolveWithErrorFallback,
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </ThemeProvider>
        );
    },
    progress: { color: '#16a34a' },
});