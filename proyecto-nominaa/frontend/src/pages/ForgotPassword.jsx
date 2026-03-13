// ============================================
// PÁGINA DE RECUPERACIÓN DE CONTRASEÑA
// Archivo: src/pages/ForgotPassword.jsx
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Login.css';

const ForgotPassword = () => {
    // Estados para los dos pasos del proceso
    const [step, setStep] = useState(1); // 1: solicitar, 2: restablecer
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ========================================
    // PASO 1: SOLICITAR TOKEN
    // ========================================
    const handleRequestToken = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            const response = await authService.requestPasswordReset(email);
            
            setMessage({
                type: 'success',
                text: response.message || 'Se ha enviado un código a tu email'
            });

            // Si en desarrollo, mostrar el token
            if (response.dev?.token) {
                setMessage({
                    type: 'success',
                    text: `Código de recuperación: ${response.dev.token}`
                });
                setToken(response.dev.token);
            }

            // Pasar al paso 2
            setStep(2);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message || 'Error al solicitar recuperación'
            });
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // PASO 2: RESTABLECER CONTRASEÑA
    // ========================================
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            setMessage({
                type: 'error',
                text: 'Las contraseñas no coinciden'
            });
            return;
        }

        // Validar longitud de contraseña
        if (newPassword.length < 6) {
            setMessage({
                type: 'error',
                text: 'La contraseña debe tener al menos 6 caracteres'
            });
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(email, token, newPassword);
            
            setMessage({
                type: 'success',
                text: '✅ Contraseña actualizada exitosamente. Redirigiendo al login...'
            });

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message || 'Error al restablecer contraseña'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>🔑 Recuperar Contraseña</h1>
                    <p>
                        {step === 1 
                            ? 'Ingresa tu email para recibir el código' 
                            : 'Ingresa el código y tu nueva contraseña'
                        }
                    </p>
                </div>

                {/* Mostrar mensajes */}
                {message.text && (
                    <div className={`${message.type === 'error' ? 'error-message' : 'alert alert-success'}`}>
                        {message.text}
                    </div>
                )}

                {/* PASO 1: Solicitar código */}
                {step === 1 && (
                    <form onSubmit={handleRequestToken} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar Código'}
                        </button>

                        <div className="form-footer" style={{ textAlign: 'center' }}>
                            <Link to="/login" className="forgot-link">
                                ← Volver al login
                            </Link>
                        </div>
                    </form>
                )}

                {/* PASO 2: Restablecer contraseña */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="login-form">
                        <div className="form-group">
                            <label htmlFor="token">Código de recuperación</label>
                            <input
                                type="text"
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="123456"
                                required
                                disabled={loading}
                            />
                            <small style={{ color: '#6b7280', fontSize: '12px' }}>
                                Revisa tu email o la consola del servidor
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">Nueva contraseña</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmar contraseña</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                        </button>

                        <div className="form-footer" style={{ textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="forgot-link"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                ← Solicitar nuevo código
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;

// ============================================
// NOTAS
// ============================================

/*
FLUJO DE RECUPERACIÓN:

PASO 1: SOLICITAR CÓDIGO
1. Usuario ingresa su email
2. Sistema genera código de 6 dígitos
3. Código se guarda en BD con expiración de 30 min
4. En producción: se envía por email
5. En desarrollo: se muestra en respuesta

PASO 2: RESTABLECER
1. Usuario ingresa código recibido
2. Ingresa nueva contraseña (2 veces)
3. Sistema valida el código
4. Actualiza la contraseña
5. Redirige al login

VALIDACIONES:
✅ Email válido
✅ Código de 6 dígitos
✅ Contraseña mínimo 6 caracteres
✅ Contraseñas deben coincidir
✅ Código no expirado
✅ Código no usado previamente

SEGURIDAD:
- Token temporal (30 minutos)
- Un solo uso por token
- Contraseña hasheada en BD
- Mensajes genéricos (no revelar si email existe)
*/