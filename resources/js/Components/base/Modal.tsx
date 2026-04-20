// ============================================================
// FILE: resources/js/Components/base/Modal.tsx
// Preserved exactly from UI design — no changes needed
// ============================================================
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: React.ReactNode;
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
    const { isDark } = useTheme();

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const bg = isDark ? '#1f2937' : '#ffffff';
    const border = isDark ? '#374151' : '#e5e7eb';
    const textPrimary = isDark ? '#f9fafb' : '#111827';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className={`w-full ${sizeMap[size]} rounded-2xl flex flex-col max-h-[90vh] transition-all`}
                style={{ background: bg, border: `1px solid ${border}` }}
            >
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
                    <h2 className="text-base font-semibold" style={{ color: textPrimary }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                        style={{ color: textSecondary }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#374151' : '#f3f4f6'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                        <i className="ri-close-line text-lg"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && (
                    <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
