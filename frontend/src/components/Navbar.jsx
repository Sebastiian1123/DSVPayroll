// ============================================
// COMPONENTE NAVBAR
// Archivo: src/components/Navbar.jsx
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/dsv.png';
import Swal from 'sweetalert2';


const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: 'Tu sesión actual se cerrará.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#111827',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        })

        
    if (result.isConfirmed) {
        logout();
        navigate('/login');
    }

    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo / Título */}
                <Link to="/dashboard" className="navbar-brand">
                    <span className="navbar-icon"><img className='img-logo' src={logo} alt="logo DSV" /></span>
                    <span className="navbar-title">Sistema de Nómina</span>
                </Link>

                {/* Links de navegación */}
                <div className="navbar-menu">
                    <Link to="/dashboard" className="nav-link">
                        <i className="fa-solid fa-house"></i> Dashboard
                    </Link>
                    <Link to="/employees" className="nav-link">
                        <i className="fa-solid fa-users"></i> Empleados
                    </Link>
                    <Link to="/permisos" className="nav-link">
                        <i className="fa-solid fa-clipboard-check"></i> Permisos
                    </Link>
                    {isAdmin() && (
                        <Link to="/users" className="nav-link">
                            <i className="fa-solid fa-user-shield"></i> Usuarios
                        </Link>
                    )}
                </div>

                {/* Info de usuario y logout */}
                <div className="navbar-user">
                    <div className="user-info">
                        <span className="user-name">{user?.username}</span>
                        <span className="user-role">{user?.rol}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="fa-solid fa-right-from-bracket"></i> Salir
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

// ============================================
// NOTAS
// ============================================

/*
FUNCIONALIDADES DEL NAVBAR:

1. LOGO/BRAND:
   - Link al dashboard
   - Nombre del sistema

2. MENÚ DE NAVEGACIÓN:
   - Dashboard: Visible para todos
   - Empleados: Visible para todos
   - Usuarios: Solo Admin y RRHH

3. INFO DE USUARIO:
   - Muestra nombre de usuario
   - Muestra rol
   - Botón de logout

4. LOGOUT:
   - Confirmación antes de cerrar sesión
   - Limpia localStorage
   - Redirige a login

RESPONSIVE:
- En móviles se puede agregar un menú hamburguesa
- Los links se apilan verticalmente
- Se mantiene funcional en todas las pantallas
*/
