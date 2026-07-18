import React, { useEffect } from 'react';
import { Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'success';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') { onConfirm(); onClose(); }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    const renderIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={34} color="#059669" strokeWidth={2} />;
            case 'warning':
                return <AlertTriangle size={34} color="#d97706" strokeWidth={2} />;
            case 'danger':
            default:
                return <Trash2 size={34} color="#ef4444" strokeWidth={2} />;
        }
    };

    return (
        <>
            <style>{`
                @keyframes confirm-overlay-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes confirm-card-in {
                    from { opacity: 0; transform: scale(0.88) translateY(24px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes confirm-icon-pulse-danger {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); }
                    50% { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
                }
                @keyframes confirm-icon-pulse-warning {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
                    50% { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
                }
                @keyframes confirm-icon-pulse-success {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
                    50% { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
                }
                @keyframes confirm-icon-shake {
                    0%,100% { transform: rotate(0deg); }
                    20% { transform: rotate(-8deg); }
                    40% { transform: rotate(8deg); }
                    60% { transform: rotate(-5deg); }
                    80% { transform: rotate(5deg); }
                }
                .confirm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 10, 20, 0.72);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                    animation: confirm-overlay-in 0.22s ease;
                }
                .confirm-card {
                    background: #ffffff;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 420px;
                    box-shadow:
                        0 32px 64px -12px rgba(0,0,0,0.35),
                        0 0 0 1px rgba(255,255,255,0.08);
                    animation: confirm-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    overflow: hidden;
                    position: relative;
                }
                .confirm-top-stripe {
                    height: 5px;
                }
                .confirm-top-stripe-danger {
                    background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
                }
                .confirm-top-stripe-warning {
                    background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
                }
                .confirm-top-stripe-success {
                    background: linear-gradient(90deg, #10b981, #059669, #047857);
                }
                .confirm-body {
                    padding: 32px 32px 28px;
                    text-align: center;
                }
                .confirm-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: #f1f5f9;
                    border: none;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #94a3b8;
                    transition: all 0.2s;
                    z-index: 1;
                }
                .confirm-close-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    transform: rotate(90deg);
                }
                .confirm-icon-wrap {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 22px;
                    animation: confirm-icon-shake 0.6s ease 0.3s;
                }
                .confirm-icon-wrap-danger {
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    border: 3px solid #fecaca;
                    animation: confirm-icon-pulse-danger 2s ease-in-out infinite, confirm-icon-shake 0.6s ease 0.3s;
                }
                .confirm-icon-wrap-warning {
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border: 3px solid #fde68a;
                    animation: confirm-icon-pulse-warning 2s ease-in-out infinite, confirm-icon-shake 0.6s ease 0.3s;
                }
                .confirm-icon-wrap-success {
                    background: linear-gradient(135deg, #f0fdf4, #d1fae5);
                    border: 3px solid #a7f3d0;
                    animation: confirm-icon-pulse-success 2s ease-in-out infinite, confirm-icon-shake 0.6s ease 0.3s;
                }
                .confirm-title {
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 10px;
                    letter-spacing: -0.3px;
                }
                .confirm-message {
                    font-size: 0.95rem;
                    color: #64748b;
                    line-height: 1.65;
                    margin: 0 0 28px;
                    font-weight: 400;
                }
                .confirm-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .confirm-btn-cancel {
                    height: 48px;
                    border-radius: 14px;
                    border: 1.5px solid #e2e8f0;
                    background: #f8fafc;
                    color: #475569;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.2px;
                }
                .confirm-btn-cancel:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    color: #334155;
                    transform: translateY(-1px);
                }
                .confirm-btn-action {
                    height: 48px;
                    border-radius: 14px;
                    border: none;
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    letter-spacing: 0.2px;
                }
                .confirm-btn-danger {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    box-shadow: 0 4px 14px -2px rgba(239,68,68,0.45);
                }
                .confirm-btn-danger:hover {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    box-shadow: 0 6px 20px -2px rgba(239,68,68,0.55);
                    transform: translateY(-2px);
                }
                .confirm-btn-warning {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    box-shadow: 0 4px 14px -2px rgba(245,158,11,0.45);
                }
                .confirm-btn-warning:hover {
                    background: linear-gradient(135deg, #d97706, #b45309);
                    box-shadow: 0 6px 20px -2px rgba(245,158,11,0.55);
                    transform: translateY(-2px);
                }
                .confirm-btn-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    box-shadow: 0 4px 14px -2px rgba(16,185,129,0.45);
                }
                .confirm-btn-success:hover {
                    background: linear-gradient(135deg, #059669, #047857);
                    box-shadow: 0 6px 20px -2px rgba(16,185,129,0.55);
                    transform: translateY(-2px);
                }
                .confirm-btn-action:active {
                    transform: translateY(0);
                }
                .confirm-hint {
                    margin-top: 16px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
            `}</style>

            <div className="confirm-overlay" onClick={onClose}>
                <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
                    <div className={`confirm-top-stripe confirm-top-stripe-${type}`} />
                    <button className="confirm-close-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                    <div className="confirm-body">
                        <div className={`confirm-icon-wrap confirm-icon-wrap-${type}`}>
                            {renderIcon()}
                        </div>
                        <h2 className="confirm-title">{title}</h2>
                        <p className="confirm-message">{message}</p>
                        <div className="confirm-actions">
                            <button className="confirm-btn-cancel" onClick={onClose}>
                                {cancelText}
                            </button>
                            <button className={`confirm-btn-action confirm-btn-${type}`} onClick={() => { onConfirm(); onClose(); }}>
                                {type === 'danger' && <Trash2 size={16} strokeWidth={2.5} />}
                                {type === 'warning' && <AlertTriangle size={16} strokeWidth={2.5} />}
                                {type === 'success' && <CheckCircle2 size={16} strokeWidth={2.5} />}
                                {confirmText}
                            </button>
                        </div>
                        <p className="confirm-hint">Press <strong>Enter</strong> to confirm · <strong>Esc</strong> to cancel</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmModal;
