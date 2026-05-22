
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/dsv.png';
import Swal from 'sweetalert2';
import api from '../services/api';


const Navbar = () => {
    const { user, logout, isAdmin, isAdminOrRRHH } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
    const [profileName, setProfileName] = React.useState('');
    const userMenuRef = React.useRef(null);

    React.useEffect(() => {
        const closeUserMenu = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', closeUserMenu);
        return () => document.removeEventListener('mousedown', closeUserMenu);
    }, []);

    React.useEffect(() => {
        if (!user?.id_empleado) {
            setProfileName(user?.username || '');
            return;
        }

        let isMounted = true;

        api.get(`/employees/${user.id_empleado}`)
            .then((res) => {
                if (!isMounted) return;
                const employee = res.data?.data;
                const fullName = `${employee?.nombres || ''} ${employee?.apellidos || ''}`.trim();
                setProfileName(fullName || user?.username || '');
            })
            .catch(() => {
                if (isMounted) setProfileName(user?.username || '');
            });

        return () => {
            isMounted = false;
        };
    }, [user?.id_empleado, user?.username]);

    const getInitials = () => {
        const parts = String(profileName || user?.username || 'U')
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }

        return (parts[0] || 'U').slice(0, 2).toUpperCase();
    };

    const closeMenus = () => {
        setMenuOpen(false);
        setUserMenuOpen(false);
    };

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

                {/* Hamburger toggle */}
                <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                </button>

                {/* Links de navegación */}
                <div className={`navbar-menu${menuOpen ? ' navbar-menu--open' : ''}`}>
                    <Link to="/dashboard" className="nav-link ">
                        <i className="fa-solid fa-house"></i> Dashboard
                    </Link>
                    <Link to="/mi-perfil" className="nav-link perfil-link">
                        <i className="fa-solid fa-user"></i> <p>Mi Perfil</p>
                    </Link>
                    
                    
                    {isAdminOrRRHH() && (
                        <Link to="/employees" className="nav-link">
                            <i className="fa-solid fa-users"></i> Empleados
                        </Link>
                    )}
                    <Link to="/permisos" className="nav-link">
                        <i className="fa-solid fa-clipboard-check"></i> Permisos
                    </Link>
                    {isAdmin() && (
                        <>
                        <Link to="/users" className="nav-link">
                            <i className="fa-solid fa-user-shield"></i> Usuarios
                        </Link>
                        <Link to="/prestaciones" className="nav-link">
                            <i className="fa-solid fa-chart-line"></i> Prestaciones
                        </Link>
                        <Link to="/liquidacion" className="nav-link">
                            <i className="fa-solid fa-file-contract"></i> Liquidación
                        </Link>
                        </>
                    )}
                </div>

                {/* Info de usuario y logout */}
                <div className="navbar-user" ref={userMenuRef}>
                    <div className="user-info">
                        <span className="user-name">{user?.username}</span>
                        <span className="user-role">{user?.rol}</span>
                    </div>
                    <button
                        type="button"
                        className={`user-avatar-btn${userMenuOpen ? ' user-avatar-btn--open' : ''}`}
                        onClick={() => setUserMenuOpen((open) => !open)}
                        aria-label="Abrir menu de usuario"
                        aria-expanded={userMenuOpen}
                    >
                        {getInitials()}
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-header">
                                <div className="user-dropdown-avatar">{getInitials()}</div>
                                <div>
                                    <strong>{profileName || user?.username}</strong>
                                    <span>{user?.email}</span>
                                </div>
                            </div>

                            <Link to="/mi-perfil" className="user-dropdown-item" onClick={closeMenus}>
                                <i className="fa-solid fa-user"></i> Mi Perfil
                            </Link>
                            <Link to="/dashboard" className="user-dropdown-item" onClick={closeMenus}>
                                <i className="fa-solid fa-house"></i> Dashboard
                            </Link>
                            <Link to="/reports" className="user-dropdown-item" onClick={closeMenus}>
                                <i className="fa-solid fa-chart-bar"></i> Reportes
                            </Link>
                            <Link to="/permisos" className="user-dropdown-item" onClick={closeMenus}>
                                <i className="fa-solid fa-clipboard-check"></i> Permisos
                            </Link>

                            <button type="button" className="user-dropdown-item user-dropdown-item--danger" onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                            </button>
                        </div>
                    )}
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
