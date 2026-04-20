import { useTheme } from '@/contexts/ThemeContext';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }: ConfirmDialogProps) {
    const { isDark } = useTheme();
    if (!open) return null;

    const bg = isDark ? '#1f2937' : '#ffffff';
    const border = isDark ? '#374151' : '#e5e7eb';
    const textPrimary = isDark ? '#f9fafb' : '#111827';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: danger ? '#fef2f2' : '#f0fdf4' }}>
                        <i className={danger ? 'ri-delete-bin-line text-lg' : 'ri-question-line text-lg'} style={{ color: danger ? '#dc2626' : '#16a34a' }}></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>{title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer font-medium transition-colors" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm rounded-lg cursor-pointer font-medium text-white transition-colors" style={{ background: danger ? '#dc2626' : '#16a34a' }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
