import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import '../styles/Employees.css';
import { showSuccess, showError, showConfirmDelete } from '../utils/alerts.js';
import {
    buildEmployeeFormData,
    getDefaultEmployeeFormData,
    getMaxBirthDate,
    getTodayDate
} from '../utils/employees/employeeFormUtils';


const Employees = () => {
    const { isAdminOrRRHH, isAdmin } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState(getDefaultEmployeeFormData());
    const [currentPage, setCurrentPage] = useState(1);
    const [showInactive, setShowInactive] = useState(false);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, [showInactive]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params = showInactive ? { includeInactive: 'true' } : {};
            const response = await api.get('/employees', { params });
            setEmployees(response.data.data);
            setError('');
        } catch (err) {
            setError('Error al cargar empleados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const deptosRes = await api.get('/catalogs/departamentos');
            setDepartamentos(deptosRes.data.data || []);
        } catch (err) {
            console.error('Error al cargar departamentos:', err);
        }
    };

    const handleSearch = async () => {
        setCurrentPage(1);
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
            setError('Error al buscar empleados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const openModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData(buildEmployeeFormData(employee));
        } else {
            setEditingEmployee(null);
            setFormData(getDefaultEmployeeFormData());
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData(getDefaultEmployeeFormData());
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingEmployee) {
                await api.put(`/employees/${editingEmployee.id_empleado}`, formData);
                showSuccess('Empleado actualizado', 'El empleado fue actualizado exitosamente');
            } else {
                await api.post('/employees', formData);
                showSuccess('Empleado creado', 'El empleado fue creado exitosamente');
            }

            closeModal();
            fetchEmployees();
        } catch (err) {
            showError('Error', err.response?.data?.message || 'Error al guardar empleado');
        }
    };

    const handleReactivate = async (id) => {
        const result = await showConfirmDelete('¿Estás seguro de que deseas reactivar este empleado?');

        if (!result.isConfirmed) {
            return;
        }

        try {
            await api.put(`/employees/${id}/reactivate`);
            showSuccess('Empleado reactivado', 'El empleado ha sido reactivado exitosamente');
            fetchEmployees();
        } catch (err) {
            showError('Error', err.response?.data?.message || 'Error al reactivar empleado');
        }
    };

    const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = employees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
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
                        <button onClick={() => { setSearchTerm(''); setCurrentPage(1); fetchEmployees(); }} className="btn btn-secondary">
                            <i className="fa-solid fa-trash"></i> Limpiar
                        </button>
                    )}
                </div>

                {isAdminOrRRHH() && (
                    <div className="toggle-inactive">
                        <label>
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => { setShowInactive(e.target.checked); setCurrentPage(1); }}
                            />
                            Mostrar empleados inactivos
                        </label>
                    </div>
                )}

                {error && <div className="alert alert-error">{error}</div>}

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
                                    <th>Nombre Completo</th>
                                    <th>Identificación</th>
                                    <th>Sueldo</th>
                                    <th>Cargo</th>
                                    <th>Departamento</th>
                                    {isAdminOrRRHH() && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdminOrRRHH() ? 7 : 6} style={{ textAlign: 'center' }}>
                                            No hay empleados registrados
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((employee) => (
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
                                                        {employee.activo ? (
                                                            isAdmin() ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleDelete(employee.id_empleado, false)}
                                                                        className="btn-action btn-deactivate"
                                                                        title="Desactivar"
                                                                    >
                                                                        <i className="fa-solid fa-user-slash"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(employee.id_empleado, true)}
                                                                        className="btn-action btn-delete"
                                                                        title="Eliminar Permanentemente"
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleDelete(employee.id_empleado, false)}
                                                                    className="btn-action btn-deactivate"
                                                                    title="Desactivar"
                                                                >
                                                                    <i className="fa-solid fa-user-slash"></i>
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReactivate(employee.id_empleado)}
                                                                className="btn-action btn-reactivate"
                                                                title="Reactivar"
                                                            >
                                                                <i className="fa-solid fa-user-check"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={currentPage === 1}
                                    className="btn btn-gray-light"
                                >
                                    <i className="fa-solid fa-chevron-left"></i> Anterior
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page =>
                                        page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1
                                    )
                                    .reduce((acc, page, idx, arr) => {
                                        if (idx > 0 && page - arr[idx - 1] > 1) {
                                            acc.push('...');
                                        }
                                        acc.push(page);
                                        return acc;
                                    }, [])
                                    .map((item, idx) =>
                                        item === '...' ? (
                                            <span key={`dots-${idx}`} className="pagination-dots">...</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => setCurrentPage(item)}
                                                className={`btn ${currentPage === item ? 'btn-dark' : 'btn-gray-light'}`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )
                                }

                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage === totalPages}
                                    className="btn btn-gray-light"
                                >
                                    Siguiente <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
