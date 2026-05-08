import React from 'react';
import Modal from './Modal';
import { HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <HelpCircle size={48} color="#3b82f6" />
                </div>
                <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>
                    {message}
                </p>
                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button 
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className="btn btn-danger"
                        style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600 }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
