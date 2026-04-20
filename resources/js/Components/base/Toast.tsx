import { useState, useEffect, createContext, useContext, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

const icons: Record<ToastType, string> = {
    success: 'ri-checkbox-circle-line',
    error:   'ri-error-warning-line',
    warning: 'ri-alert-line',
    info:    'ri-information-line',
};

const colors: Record<ToastType, { bg: string; icon: string; border: string }> = {
    success: { bg: '#f0fdf4', icon: '#16a34a', border: '#bbf7d0' },
    error:   { bg: '#fef2f2', icon: '#dc2626', border: '#fecaca' },
    warning: { bg: '#fffbeb', icon: '#d97706', border: '#fde68a' },
    info:    { bg: '#eff6ff', icon: '#2563eb', border: '#bfdbfe' },
};

function ToastItemComponent({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const c = colors[toast.type];

    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), 10);
        const t2 = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 4000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [toast.id, onRemove]);

    return (
        <div
            className="flex items-start gap-3 p-4 rounded-xl shadow-lg min-w-[300px] max-w-[380px] transition-all duration-300"
            style={{ background: c.bg, border: `1px solid ${c.border}`, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
        >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className={`${icons[toast.type]} text-lg`} style={{ color: c.icon }}></i>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{toast.title}</p>
                {toast.message && <p className="text-xs text-gray-500 mt-0.5">{toast.message}</p>}
            </div>
            <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }} className="w-5 h-5 flex items-center justify-center flex-shrink-0 cursor-pointer text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-sm"></i>
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, type, title, message }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map(toast => (
                    <ToastItemComponent key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
