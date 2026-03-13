// ============================================
// PÁGINA DE GESTIÓN DE USUARIOS
// Archivo: src/pages/Users.jsx
// ============================================

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import authService from '../services/authService';
import api from '../services/api';
import '../styles/Employees.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Formulario para crear usuario
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        rol: 'EMPLEADO',
        id_empleado: ''
    });

    // Formulario para editar usuario
    const [editFormData, setEditFormData] = useState({
        email: '',
        rol: '',
        id_empleado: ''
    });

    // ========================================
    // CARGAR USUARIOS Y EMPLEADOS
    // ========================================
    useEffect(() => {
        fetchUsers();
        fetchEmployees();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data.data || []);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            // Filtrar solo empleados sin usuario
            const employeesWithoutUser = response.data.data.filter(emp => !emp.username);
            setEmployees(employeesWithoutUser);
        } catch (err) {
            console.error('Error al cargar empleados:', err);
        }
    };

    // ========================================
    // MANEJAR FORMULARIO DE CREAR
    // ========================================
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await authService.register(formData);
            alert('Usuario registrado exitosamente');
            closeModal();
            fetchUsers();
            fetchEmployees();
        } catch (err) {
            alert(err.message || 'Error al registrar usuario');
        }
    };

    // ========================================
    // MANEJAR FORMULARIO DE EDITAR
    // ========================================
    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditFormData({
            email: user.email || '',
            rol: user.rol || '',
            id_empleado: user.id_empleado || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.put(`/users/${editingUser.id_usuario}`, editFormData);
            alert('Usuario actualizado exitosamente');
            closeEditModal();
            fetchUsers();
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al actualizar usuario');
        }
    };

    // ========================================
    // ELIMINAR USUARIO
    // ========================================
    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            alert('Usuario eliminado exitosamente');
            fetchUsers();
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    // ========================================
    // ACTIVAR/DESACTIVAR USUARIO
    // ========================================
    const handleToggleStatus = async (userId) => {
        try {
            const response = await api.patch(`/users/${userId}/toggle-status`);
            alert(response.data.message);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cambiar estado del usuario');
        }
    };

    // ========================================
    // MODAL - CREAR
    // ========================================
    const openModal = () => {
        setFormData({
            username: '',
            password: '',
            email: '',
            rol: 'EMPLEADO',
            id_empleado: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    // ========================================
    // MODAL - EDITAR
    // ========================================
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingUser(null);
    };

    return (
        <>
            <Navbar />
            <div className="employees-container">
                <div className="employees-header">
                    <h1><i className="fa-solid fa-user-shield"></i> Gestión de Usuarios</h1>
                    <button onClick={openModal} className="btn btn-gray-light">
                        <i className="fa-solid fa-user-plus"></i> Nuevo Usuario
                    </button>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Empleado Asociado</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center' }}>
                                            No hay usuarios registrados
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id_usuario}>
                                            <td>{user.id_usuario}</td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge badge-${getRoleBadge(user.rol)}`}>
                                                    {user.rol}
                                                </span>
                                            </td>
                                            <td>{user.empleado_nombre || 'Sin asociar'}</td>
                                            <td>
                                                <span
                                                    className={`badge badge-${user.activo ? 'success' : 'danger'}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleToggleStatus(user.id_usuario)}
                                                    title="Click para cambiar estado"
                                                >
                                                    {user.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="btn-action btn-edit"
                                                        title="Editar"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id_usuario)}
                                                        className="btn-action btn-delete"
                                                        title="Eliminar"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal para crear usuario */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2><i className="fa-solid fa-user-plus"></i> Nuevo Usuario</h2>
                                <button onClick={closeModal} className="close-btn"><i className="fa-solid fa-xmark"></i></button>
                            </div>

                            <form onSubmit={handleSubmit} className="employee-form">
                                <div className="form-group">
                                    <label>Nombre de Usuario *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="usuario123"
                                        required
                                        maxLength={30}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Contraseña *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        maxLength={30}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="usuario@empresa.com"
                                        required
                                        maxLength={60}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rol *</label>
                                    <select
                                        name="rol"
                                        value={formData.rol}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="EMPLEADO">Empleado</option>
                                        <option value="RRHH">RRHH</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Asociar con Empleado (Opcional)</label>
                                    <select
                                        name="id_empleado"
                                        value={formData.id_empleado}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sin asociar</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id_empleado} value={emp.id_empleado}>
                                                {emp.nombres} {emp.apellidos} - {emp.numero_identificacion}
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                                        Solo empleados sin usuario asignado
                                    </small>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={closeModal} className="btn btn-cancel-red">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-gray-light">
                                        Crear Usuario
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal para editar usuario */}
                {showEditModal && (
                    <div className="modal-overlay" onClick={closeEditModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2><i className="fa-solid fa-pen-to-square"></i> Editar Usuario</h2>
                                <button onClick={closeEditModal} className="close-btn"><i className="fa-solid fa-xmark"></i></button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="employee-form">
                                <div className="form-group">
                                    <label>Usuario</label>
                                    <input
                                        type="text"
                                        value={editingUser.username}
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                                        El nombre de usuario no se puede modificar
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editFormData.email}
                                        onChange={handleEditChange}
                                        required
                                        maxLength={60}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rol *</label>
                                    <select
                                        name="rol"
                                        value={editFormData.rol}
                                        onChange={handleEditChange}
                                        required
                                    >
                                        <option value="EMPLEADO">Empleado</option>
                                        <option value="RRHH">RRHH</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Asociar con Empleado</label>
                                    <select
                                        name="id_empleado"
                                        value={editFormData.id_empleado}
                                        onChange={handleEditChange}
                                    >
                                        <option value="">Sin asociar</option>
                                        {editingUser.id_empleado && (
                                            <option value={editingUser.id_empleado}>
                                                {editingUser.empleado_nombre} (Actual)
                                            </option>
                                        )}
                                        {employees.map((emp) => (
                                            <option key={emp.id_empleado} value={emp.id_empleado}>
                                                {emp.nombres} {emp.apellidos} - {emp.numero_identificacion}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={closeEditModal} className="btn btn-cancel-red">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-gray-light">
                                        Actualizar Usuario
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// Función auxiliar para badge de roles
const getRoleBadge = (rol) => {
    switch (rol) {
        case 'ADMINISTRADOR':
            return 'danger';
        case 'RRHH':
            return 'warning';
        case 'EMPLEADO':
            return 'info';
        default:
            return 'info';
    }
};

export default Users;