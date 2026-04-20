/// <reference types="vite/client" />
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import "../css/app.css";
import './bootstrap';
import AppErrorBoundary from "./Components/AppErrorBoundary";


createInertiaApp({
    title: (title) => `${title} — IT Asset Management`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx"),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <AppErrorBoundary>
                <App {...props} />
            </AppErrorBoundary>,
        );
    },
    progress: { color: "#F59E0B" },
});
