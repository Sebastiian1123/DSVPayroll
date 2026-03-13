// ============================================
// PÁGINA DE GESTIÓN DE EMPLEADOS
// Archivo: src/pages/Employees.jsx
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import '../styles/Employees.css';

const Employees = () => {
    const { isAdminOrRRHH } = useAuth();

    // Estados
    const [employees, setEmployees] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Formulario
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        tipo_identificacion: 'CC',
        numero_identificacion: '',
        sueldo: '',
        fecha_nacimiento: '',
        fecha_ingreso: '',
        nombre_cargo: '',
        id_departamento: ''
    });

    // ========================================
    // CARGAR EMPLEADOS Y CATÁLOGOS AL INICIAR
    // ========================================
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get('/employees');
            setEmployees(response.data.data);
            setError('');
        } catch (err) {
            setError('Error al cargar empleados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // CARGAR CATÁLOGOS (SOLO DEPARTAMENTOS)
    // ========================================
    const fetchDepartments = async () => {
        try {
            const deptosRes = await api.get('/catalogs/departamentos');
            setDepartamentos(deptosRes.data.data || []);
        } catch (err) {
            console.error('Error al cargar departamentos:', err);
        }
    };

    // ========================================
    // BUSCAR EMPLEADOS
    // ========================================
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchEmployees();
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/employees/search?q=${searchTerm}`);
            setEmployees(response.data.data);
            setError('');
        } catch (err) {
            setError('Error al buscar empleados', err);
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // ABRIR MODAL PARA CREAR/EDITAR
    // ========================================
    const openModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                nombres: employee.nombres || '',
                apellidos: employee.apellidos || '',
                tipo_identificacion: employee.tipo_identificacion || 'CC',
                numero_identificacion: employee.numero_identificacion || '',
                sueldo: employee.sueldo || '',
                fecha_nacimiento: employee.fecha_nacimiento?.split('T')[0] || '',
                fecha_ingreso: employee.fecha_ingreso?.split('T')[0] || '',
                nombre_cargo: employee.nombre_cargo || '',
                id_departamento: employee.id_departamento || ''
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                nombres: '',
                apellidos: '',
                tipo_identificacion: 'CC',
                numero_identificacion: '',
                sueldo: '',
                fecha_nacimiento: '',
                fecha_ingreso: '',
                nombre_cargo: '',
                id_departamento: ''
            });
        }
        setShowModal(true);
    };

    // ========================================
    // CERRAR MODAL
    // ========================================
    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
            nombres: '',
            apellidos: '',
            tipo_identificacion: 'CC',
            numero_identificacion: '',
            sueldo: '',
            fecha_nacimiento: '',
            fecha_ingreso: '',
            nombre_cargo: '',
            id_departamento: ''
        });
    };

    // ========================================
    // MANEJAR CAMBIOS EN EL FORMULARIO
    // ========================================
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ========================================
    // GUARDAR EMPLEADO (CREAR O ACTUALIZAR)
    // ========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingEmployee) {
                // Actualizar
                await api.put(`/employees/${editingEmployee.id_empleado}`, formData);
                alert('Empleado actualizado exitosamente');
            } else {
                // Crear
                await api.post('/employees', formData);
                alert('Empleado creado exitosamente');
            }

            closeModal();
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar empleado');
        }
    };

    // ========================================
    // ELIMINAR EMPLEADO
    // ========================================
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este empleado?')) {
            return;
        }

        try {
            await api.delete(`/employees/${id}`);
            alert('Empleado eliminado exitosamente');
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar empleado');
        }
    };
    // Función para validar fecha de nacimiento (mayor de 18 años)
    const getMaxBirthDate = () => {
        const today = new Date();
        const eighteenYearsAgo = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
        );
        return eighteenYearsAgo.toISOString().split('T')[0];
    };
    // Función para validar fecha de ingreso (no permitir fechas futuras)
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <>
            <Navbar />
            <div className="employees-container">
                <div className="employees-header">
                    <h1> <i className="fa-solid fa-person"></i><i className="fa-solid fa-person-dress"></i> Gestión de Empleados</h1>
                    {isAdminOrRRHH() && (
                        <button onClick={() => openModal()} className="btn btn-dark">
                            <i className="fa-solid fa-user-plus"></i> Nuevo Empleado
                        </button>
                    )}
                </div>

                {/* Buscador */}
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o identificación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="btn btn-gray-light">
                        <i className="fa-solid fa-magnifying-glass"></i> Buscar
                    </button>
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); fetchEmployees(); }} className="btn btn-secondary">
                            <i className="fa-solid fa-trash"></i> Limpiar
                        </button>
                    )}
                </div>

                {/* Mensajes */}
                {error && <div className="alert alert-error">{error}</div>}

                {/* Loading */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    /* Tabla de empleados */
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre Completo</th>
                                    <th>Identificación</th>
                                    <th>Sueldo</th>
                                    <th>Cargo</th>
                                    <th>Departamento</th>
                                    {isAdminOrRRHH() && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdminOrRRHH() ? 7 : 6} style={{ textAlign: 'center' }}>
                                            No hay empleados registrados
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((employee) => (
                                        <tr key={employee.id_empleado}>
                                            <td>{employee.id_empleado}</td>
                                            <td>{employee.nombres} {employee.apellidos}</td>
                                            <td>{employee.tipo_identificacion} {employee.numero_identificacion}</td>
                                            <td>${Number(employee.sueldo || 0).toLocaleString('es-CO')}</td>
                                            <td>{employee.nombre_cargo || 'Sin cargo'}</td>
                                            <td>{employee.nombre_departamento || 'Sin departamento'}</td>
                                            {isAdminOrRRHH() && (
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => openModal(employee)}
                                                            className="btn-action btn-edit"
                                                            title="Editar"
                                                        >
                                                            <i className="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(employee.id_empleado)}
                                                            className="btn-action btn-delete"
                                                            title="Eliminar"
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal para crear/editar */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingEmployee ? <><i className="fa-solid fa-pen-to-square"></i> Editar Empleado</> : <><i className="fa-solid fa-user-plus"></i> Nuevo Empleado</>}</h2>
                                <button onClick={closeModal} className="close-btn"><i className="fa-solid fa-xmark"></i></button>
                            </div>

                            <form onSubmit={handleSubmit} className="employee-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombres *</label>
                                        <input
                                            type="text"
                                            name="nombres"
                                            value={formData.nombres}
                                            onChange={handleChange}
                                            required
                                            maxLength={40}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellidos *</label>
                                        <input
                                            type="text"
                                            name="apellidos"
                                            value={formData.apellidos}
                                            onChange={handleChange}
                                            required
                                            maxLength={40}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de Identificación *</label>
                                        <select
                                            name="tipo_identificacion"
                                            value={formData.tipo_identificacion}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="CC">Cédula de Ciudadanía</option>
                                            <option value="TI">Tarjeta de Identidad</option>
                                            <option value="CE">Cédula de Extranjería</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Número de Identificación *</label>
                                        <input
                                            type="number"
                                            name="numero_identificacion"
                                            value={formData.numero_identificacion}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            name="fecha_nacimiento"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleChange}
                                            max={getMaxBirthDate()}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Ingreso</label>
                                        <input
                                            type="date"
                                            name="fecha_ingreso"
                                            value={formData.fecha_ingreso}
                                            onChange={handleChange}
                                            max={getTodayDate()}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sueldo *</label>
                                        <input
                                            type="number"
                                            name="sueldo"
                                            value={formData.sueldo}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* 👇 CARGO MANUAL Y DEPARTAMENTO */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cargo *</label>
                                        <input
                                            type="text"
                                            name="nombre_cargo"
                                            value={formData.nombre_cargo}
                                            onChange={handleChange}
                                            required
                                            maxLength={100}
                                            placeholder="Escribe el cargo"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Departamento *</label>
                                        <select
                                            name="id_departamento"
                                            value={formData.id_departamento}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Selecciona un departamento</option>
                                            {departamentos.map((depto) => (
                                                <option key={depto.id_departamento} value={depto.id_departamento}>
                                                    {depto.nombre_departamento}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={closeModal} className="btn btn-cancel-red">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-gray-light">
                                        {editingEmployee ? 'Actualizar' : 'Crear'} Empleado
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

export default Employees;
