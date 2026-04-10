import React, { useEffect, useMemo, useState } from 'react';
import { calculateAdminPayrollTotals, filterAdminPayrollRows } from '../utils/adminDetailPayrollUtils';
import { formatReportCurrency } from '../utils/reportFormatters';
import reportsService from '../services/reportsService';
import { mapAdminPayrollRows } from '../utils/adminReportsUtils';

const AdminDetailPayroll = ({ period, onBack }) => {
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('Todos');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetailRows = async () => {
            if (!period?.year || !period?.monthNumber) {
                setRows([]);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const data = await reportsService.getAdminPayrollDetailByPeriod({
                    anio: period.year,
                    mes: period.monthNumber
                });

                setRows(mapAdminPayrollRows(data?.nominas || []));
            } catch (fetchError) {
                console.error('Error cargando detalle administrativo de nómina:', fetchError);
                setRows([]);
                setError('No fue posible cargar el detalle del periodo seleccionado.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetailRows();
    }, [period?.monthNumber, period?.year]);

    const departments = useMemo(() => (
        ['Todos', ...new Set(rows.map((item) => item.departamento).filter(Boolean))]
    ), [rows]);

    const filteredRows = useMemo(() => (
        filterAdminPayrollRows({
            rows,
            search,
            department
        })
    ), [rows, search, department]);

    const totals = useMemo(() => calculateAdminPayrollTotals(filteredRows), [filteredRows]);

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
                    {departments.map((item) => (
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
            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando detalle del periodo...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}

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
                                <th className="is-danger">Deducciones</th>
                                <th className="is-primary">Neto a pagar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px 24px', color: 'var(--text-light)' }}>
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
                                        <td>{formatReportCurrency(row.salario)}</td>
                                        <td>{row.heo}</td>
                                        <td>{row.hef}</td>
                                        <td>{row.hen}</td>
                                        <td>{row.hefn}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deducciones)}</td>
                                        <td className="is-primary is-strong">{formatReportCurrency(row.neto)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="admin-payroll-table__totals-title">Totales del periodo</td>
                                <td>{formatReportCurrency(totals.salario)}</td>
                                <td>{totals.heo}</td>
                                <td>{totals.hef}</td>
                                <td>{totals.hen}</td>
                                <td>{totals.hefn}</td>
                                <td className="is-danger">{formatReportCurrency(totals.deducciones)}</td>
                                <td className="is-primary is-strong">{formatReportCurrency(totals.neto)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailPayroll;
