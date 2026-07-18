import React, { createContext, useContext, useState } from 'react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

interface NotificationContextType {
    showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
    showConfirm: (
        title: string, 
        message: string, 
        onConfirm: () => void,
        confirmText?: string,
        cancelText?: string,
        type?: 'danger' | 'warning' | 'success'
    ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });
    const [confirmConfig, setConfirmConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: () => {},
        confirmText: undefined as string | undefined,
        cancelText: undefined as string | undefined,
        type: 'danger' as 'danger' | 'warning' | 'success'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const showConfirm = (
        title: string, 
        message: string, 
        onConfirm: () => void,
        confirmText?: string,
        cancelText?: string,
        type?: 'danger' | 'warning' | 'success'
    ) => {
        setConfirmConfig({ 
            isOpen: true, 
            title, 
            message, 
            onConfirm,
            confirmText,
            cancelText,
            type: type || 'danger'
        });
    };

    return (
        <NotificationContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                type={confirmConfig.type}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};
