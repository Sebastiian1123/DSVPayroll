import React, { useMemo, useState } from 'react';

const payrollRows = [
    {
        id: 1,
        nombre: 'Carlos Andrés Mendoza',
        cargo: 'Líder Técnico',
        departamento: 'Tecnología',
        avatar: '👷',
        salario: 5200000,
        heo: 4,
        hef: 2,
        hen: 0,
        hefn: 0,
        salud: 208000,
        arl: 27144,
        pension: 208000,
        neto: 4856856
    },
    {
        id: 2,
        nombre: 'Valentina Rojas Ortiz',
        cargo: 'Analista Senior',
        departamento: 'Finanzas',
        avatar: '🧑‍💼',
        salario: 3850000,
        heo: 0,
        hef: 0,
        hen: 8,
        hefn: 2,
        salud: 154000,
        arl: 20097,
        pension: 154000,
        neto: 3641903
    },
    {
        id: 3,
        nombre: 'Mauricio Gómez Duarte',
        cargo: 'Gerente Operativo',
        departamento: 'Operaciones',
        avatar: '🧑‍💼',
        salario: 7400000,
        heo: 0,
        hef: 0,
        hen: 0,
        hefn: 0,
        salud: 296000,
        arl: 38628,
        pension: 296000,
        neto: 6769372
    },
    {
        id: 4,
        nombre: 'Elena Martínez Ruiz',
        cargo: 'Coordinadora RRHH',
        departamento: 'Operaciones',
        avatar: '👷',
        salario: 4100000,
        heo: 6,
        hef: 4,
        hen: 2,
        hefn: 0,
        salud: 164000,
        arl: 21402,
        pension: 164000,
        neto: 3925598
    },
    {
        id: 5,
        nombre: 'Ricardo Silva Peña',
        cargo: 'Desarrollador Backend',
        departamento: 'Tecnología',
        avatar: '👨‍💻',
        salario: 4800000,
        heo: 2,
        hef: 0,
        hen: 0,
        hefn: 5,
        salud: 192000,
        arl: 25056,
        pension: 192000,
        neto: 4510944
    },
    {
        id: 6,
        nombre: 'Sofía Castro Vaca',
        cargo: 'UX Designer',
        departamento: 'Tecnología',
        avatar: '🧑',
        salario: 4300000,
        heo: 0,
        hef: 0,
        hen: 0,
        hefn: 0,
        salud: 172000,
        arl: 22446,
        pension: 172000,
        neto: 3933554
    }
];

const departmentOptions = ['Todos', 'Tecnología', 'Operaciones', 'Finanzas'];

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

const AdminDetailPayroll = ({ period, onBack }) => {
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('Todos');

    const filteredRows = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return payrollRows.filter((employee) => {
            const matchesSearch =
                !normalizedSearch ||
                employee.nombre.toLowerCase().includes(normalizedSearch) ||
                employee.cargo.toLowerCase().includes(normalizedSearch);

            const matchesDepartment =
                department === 'Todos' || employee.departamento === department;

            return matchesSearch && matchesDepartment;
        });
    }, [search, department]);

    const totals = useMemo(() => {
        return filteredRows.reduce(
            (acc, row) => {
                acc.salario += row.salario;
                acc.heo += row.heo;
                acc.hef += row.hef;
                acc.hen += row.hen;
                acc.hefn += row.hefn;
                acc.salud += row.salud;
                acc.arl += row.arl;
                acc.pension += row.pension;
                acc.neto += row.neto;
                return acc;
            },
            {
                salario: 0,
                heo: 0,
                hef: 0,
                hen: 0,
                hefn: 0,
                salud: 0,
                arl: 0,
                pension: 0,
                neto: 0
            }
        );
    }, [filteredRows]);

    return (
        <div className="admin-payroll-report">
            <div className="back-link" onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i> Volver a periodos
            </div>

            <div className="reports-header admin-payroll-report__header">
                <div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <span>Reportes</span>
                        <span>/</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                            {period?.month || 'Mes'} {period?.year || ''}
                        </span>
                    </div>
                    <h1>Reporte Detallado de Nómina</h1>
                    <p>
                        Lista consolidada de empleados, horas extras y deducciones del periodo seleccionado.
                    </p>
                </div>

                <div className="admin-payroll-report__actions">
                    <button className="admin-report-btn admin-report-btn--primary" type="button">
                        <i className="fa-solid fa-download"></i>
                        Exportar Excel
                    </button>
                    <button className="admin-report-btn admin-report-btn--secondary" type="button">
                        <i className="fa-regular fa-file-pdf"></i>
                        PDF
                    </button>
                </div>
            </div>

            <div className="admin-payroll-filters">
                <div className="admin-payroll-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Buscar empleado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="admin-payroll-select">
                    <label>Mes:</label>
                    <select value={period?.month || ''} disabled>
                        <option>{period?.month || 'No seleccionado'}</option>
                    </select>
                </div>

                <div className="admin-payroll-select">
                    <label>Año:</label>
                    <select value={period?.year || ''} disabled>
                        <option>{period?.year || 'No seleccionado'}</option>
                    </select>
                </div>

                <div className="admin-payroll-departments">
                    <span>Departamento:</span>
                    {departmentOptions.map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`admin-department-pill ${department === item ? 'active' : ''}`}
                            onClick={() => setDepartment(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-payroll-table-card">
                <div className="admin-payroll-table-wrapper">
                    <table className="admin-payroll-table">
                        <thead>
                            <tr>
                                <th className="admin-payroll-table__employee-col">Empleado</th>
                                <th>Salario básico</th>
                                <th>HEO</th>
                                <th>HEF</th>
                                <th>HEN</th>
                                <th>HEFN</th>
                                <th className="is-danger">Deduc. salud</th>
                                <th className="is-danger">Deduc. ARL</th>
                                <th className="is-danger">Deduc. pensión</th>
                                <th className="is-primary">Neto a pagar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: 'center', padding: '28px 24px', color: 'var(--text-light)' }}>
                                        No hay empleados para el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="admin-payroll-table__employee-cell">
                                            <div className="admin-payroll-employee">
                                                <div className="admin-payroll-employee__avatar">{row.avatar}</div>
                                                <div>
                                                    <div className="admin-payroll-employee__name">{row.nombre}</div>
                                                    <div className="admin-payroll-employee__role">{row.cargo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatCurrency(row.salario)}</td>
                                        <td>{row.heo}</td>
                                        <td>{row.hef}</td>
                                        <td>{row.hen}</td>
                                        <td>{row.hefn}</td>
                                        <td className="is-danger">{formatCurrency(row.salud)}</td>
                                        <td className="is-danger">{formatCurrency(row.arl)}</td>
                                        <td className="is-danger">{formatCurrency(row.pension)}</td>
                                        <td className="is-primary is-strong">{formatCurrency(row.neto)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="admin-payroll-table__totals-title">Totales del periodo</td>
                                <td>{formatCurrency(totals.salario)}</td>
                                <td>{totals.heo}</td>
                                <td>{totals.hef}</td>
                                <td>{totals.hen}</td>
                                <td>{totals.hefn}</td>
                                <td className="is-danger">{formatCurrency(totals.salud)}</td>
                                <td className="is-danger">{formatCurrency(totals.arl)}</td>
                                <td className="is-danger">{formatCurrency(totals.pension)}</td>
                                <td className="is-primary is-strong">{formatCurrency(totals.neto)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailPayroll;
