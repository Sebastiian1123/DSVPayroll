import React, { useMemo, useState } from 'react';

const departmentOptionsBase = ['Todos'];

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

const AdminDetailPayroll = ({ period, reportRows = [], loading = false, error = '', onBack }) => {
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('Todos');

    const monthRows = useMemo(() => {
        if (!period?.monthNumber || !period?.year) return [];

        return reportRows.filter((row) => {
            const date = new Date(row.fecha_corte);
            return date.getUTCFullYear() === period.year && (date.getUTCMonth() + 1) === period.monthNumber;
        });
    }, [period?.monthNumber, period?.year, reportRows]);

    const departmentOptions = useMemo(() => {
        const dynamic = monthRows
            .map((row) => row.nombre_departamento)
            .filter(Boolean);

        return Array.from(new Set([...departmentOptionsBase, ...dynamic]));
    }, [monthRows]);

    const filteredRows = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return monthRows.filter((row) => {
            const fullName = `${row.nombres || ''} ${row.apellidos || ''}`.trim().toLowerCase();
            const roleName = String(row.nombre_cargo || '').toLowerCase();
            const matchesSearch = !normalizedSearch || fullName.includes(normalizedSearch) || roleName.includes(normalizedSearch);
            const matchesDepartment = department === 'Todos' || row.nombre_departamento === department;

            return matchesSearch && matchesDepartment;
        });
    }, [department, monthRows, search]);

    const totals = useMemo(() => {
        return filteredRows.reduce(
            (acc, row) => {
                acc.salario += Number(row.salario_base) || 0;
                acc.heo += Number(row.horas_extra_diurna) || 0;
                acc.hef += Number(row.horas_extra_diurna_festiva) || 0;
                acc.hen += Number(row.horas_extra_nocturna) || 0;
                acc.hefn += Number(row.horas_extra_nocturna_festiva) || 0;
                acc.deducciones += Number(row.total_deducciones) || 0;
                acc.devengado += Number(row.total_devengado) || 0;
                acc.neto += Number(row.total_pagar) || 0;
                return acc;
            },
            {
                salario: 0,
                heo: 0,
                hef: 0,
                hen: 0,
                hefn: 0,
                deducciones: 0,
                devengado: 0,
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
                        Consolidado de empleados, horas extra y valores de pago del periodo seleccionado.
                    </p>
                </div>
            </div>

            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando detalle de nómina...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}

            <div className="admin-payroll-filters">
                <div className="admin-payroll-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Buscar empleado o cargo..."
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
                                <th>HED</th>
                                <th>HEDF</th>
                                <th>HEN</th>
                                <th>HENF</th>
                                <th className="is-danger">Deducciones</th>
                                <th className="is-primary">Devengado</th>
                                <th className="is-primary">Neto a pagar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '28px 24px', color: 'var(--text-light)' }}>
                                        No hay nóminas para el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => (
                                    <tr key={row.id_nomina}>
                                        <td className="admin-payroll-table__employee-cell">
                                            <div className="admin-payroll-employee">
                                                <div className="admin-payroll-employee__avatar">👤</div>
                                                <div>
                                                    <div className="admin-payroll-employee__name">{row.empleado}</div>
                                                    <div className="admin-payroll-employee__role">
                                                        {row.nombre_cargo || 'Cargo no asignado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatCurrency(row.salario_base)}</td>
                                        <td>{Number(row.horas_extra_diurna) || 0}</td>
                                        <td>{Number(row.horas_extra_diurna_festiva) || 0}</td>
                                        <td>{Number(row.horas_extra_nocturna) || 0}</td>
                                        <td>{Number(row.horas_extra_nocturna_festiva) || 0}</td>
                                        <td className="is-danger">{formatCurrency(row.total_deducciones)}</td>
                                        <td className="is-primary">{formatCurrency(row.total_devengado)}</td>
                                        <td className="is-primary is-strong">{formatCurrency(row.total_pagar)}</td>
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
                                <td className="is-danger">{formatCurrency(totals.deducciones)}</td>
                                <td className="is-primary">{formatCurrency(totals.devengado)}</td>
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
