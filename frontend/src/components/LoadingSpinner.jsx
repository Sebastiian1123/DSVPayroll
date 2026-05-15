import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px'
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: '3px solid #e2e8f0',
      borderTopColor: '#2563eb',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ color: '#64748b', fontSize: 14 }}>{message}</span>
  </div>
);

export default LoadingSpinner;
