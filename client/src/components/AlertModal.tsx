import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

const typeConfig = {
    success: {
        icon: CheckCircle2,
        iconColor: '#10b981',
        bgGradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '#bbf7d0',
        stripe: 'linear-gradient(90deg, #10b981, #059669, #047857)',
        btnBg: 'linear-gradient(135deg, #10b981, #059669)',
        btnShadow: 'rgba(16,185,129,0.4)',
        btnHoverBg: 'linear-gradient(135deg, #059669, #047857)',
    },
    error: {
        icon: AlertCircle,
        iconColor: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
        border: '#fecaca',
        stripe: 'linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)',
        btnBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        btnShadow: 'rgba(239,68,68,0.4)',
        btnHoverBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    },
    info: {
        icon: Info,
        iconColor: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        border: '#bfdbfe',
        stripe: 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)',
        btnBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        btnShadow: 'rgba(59,130,246,0.4)',
        btnHoverBg: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    },
};

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    const cfg = typeConfig[type];
    const IconComponent = cfg.icon;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                @keyframes alert-overlay-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes alert-card-in {
                    from { opacity: 0; transform: scale(0.88) translateY(24px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes alert-icon-pop {
                    0% { transform: scale(0.5); opacity: 0; }
                    70% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .alert-overlay {
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
                    animation: alert-overlay-in 0.22s ease;
                }
                .alert-card {
                    background: #ffffff;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow:
                        0 32px 64px -12px rgba(0,0,0,0.35),
                        0 0 0 1px rgba(0,0,0,0.04);
                    animation: alert-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    overflow: hidden;
                    position: relative;
                }
                .alert-top-stripe {
                    height: 5px;
                }
                .alert-body {
                    padding: 32px 32px 28px;
                    text-align: center;
                }
                .alert-close-btn {
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
                .alert-close-btn:hover {
                    background: #e2e8f0;
                    color: #475569;
                    transform: rotate(90deg);
                }
                .alert-icon-wrap {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 3px solid;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 22px;
                    animation: alert-icon-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
                }
                .alert-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 10px;
                    letter-spacing: -0.3px;
                }
                .alert-message {
                    font-size: 0.95rem;
                    color: #64748b;
                    line-height: 1.65;
                    margin: 0 0 28px;
                    font-weight: 400;
                }
                .alert-btn-ok {
                    width: 100%;
                    height: 48px;
                    border-radius: 14px;
                    border: none;
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                .alert-btn-ok:hover {
                    transform: translateY(-2px);
                }
                .alert-btn-ok:active {
                    transform: translateY(0);
                }
                .alert-hint {
                    margin-top: 14px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
            `}</style>

            <div className="alert-overlay" onClick={onClose}>
                <div className="alert-card" onClick={(e) => e.stopPropagation()}>
                    <div className="alert-top-stripe" style={{ background: cfg.stripe }} />
                    <button className="alert-close-btn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                    <div className="alert-body">
                        <div
                            className="alert-icon-wrap"
                            style={{
                                background: cfg.bgGradient,
                                borderColor: cfg.border,
                            }}
                        >
                            <IconComponent size={36} color={cfg.iconColor} strokeWidth={2} />
                        </div>
                        <h2 className="alert-title">{title}</h2>
                        <p className="alert-message">{message}</p>
                        <button
                            className="alert-btn-ok"
                            onClick={onClose}
                            style={{
                                background: cfg.btnBg,
                                boxShadow: `0 4px 14px -2px ${cfg.btnShadow}`,
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = cfg.btnHoverBg;
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px -2px ${cfg.btnShadow}`;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = cfg.btnBg;
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px -2px ${cfg.btnShadow}`;
                            }}
                        >
                            Got it
                        </button>
                        <p className="alert-hint">Press <strong>Enter</strong> or <strong>Esc</strong> to dismiss</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AlertModal;
