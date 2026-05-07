"use client";
import { useState } from 'react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler' }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          border: '1px solid #222'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: 'white', marginBottom: '12px' }}>{title}</h3>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#333',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
