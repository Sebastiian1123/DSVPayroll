import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
import logo from '../assets/dsv.png';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    // Gestiona el acceso y redirige al panel principal cuando el login es exitoso.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.username, formData.password);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Error al iniciar sesion');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img className="login-logo" src={logo} alt="Logo DSV" />
                    <h1>Iniciar sesion</h1>
                    <p>Ingresa con tus credenciales para continuar.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Ingresa tu usuario"
                            required
                            disabled={loading}
                            maxLength={30}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contrasena</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Ingresa tu contrasena"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-footer">
                        <Link to="/forgot-password" className="forgot-link">
                            Recuperar contrasena
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesion...' : 'Entrar'}
                    </button>
                </form>

                <p className="login-help-text">
                    Plataforma interna para nomina, reportes y solicitudes.
                </p>
            </div>
        </div>
    );
};

export default Login;
