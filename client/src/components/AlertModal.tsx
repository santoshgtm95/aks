import React from 'react';
import Modal from './Modal';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={48} color="#10b981" />;
            case 'error': return <AlertCircle size={48} color="#ef4444" />;
            default: return <Info size={48} color="#3b82f6" />;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    {getIcon()}
                </div>
                <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>
                    {message}
                </p>
                <div style={{ marginTop: '30px' }}>
                    <button 
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{ width: '100%', height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600 }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertModal;
