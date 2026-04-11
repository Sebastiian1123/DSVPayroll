import React, { useEffect, useMemo, useState } from 'react';
import reportsService from '../../../services/reportsService';
import { calculateAdminPayrollTotals, filterAdminPayrollRows } from '../utils/adminDetailPayrollUtils';
import { formatReportCurrency } from '../utils/reportFormatters';

const AdminDetailPayroll = ({ period, onBack }) => {
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('Todos');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdminPayrollByPeriod = async () => {
            if (!period?.year || !period?.monthNumber) {
                setRows([]);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const data = await reportsService.getPayrollReports({
                    anio: period.year,
                    mes: period.monthNumber
                });
                setRows(Array.isArray(data?.nominas) ? data.nominas : []);
            } catch (fetchError) {
                console.error('Error cargando detalle administrativo de nómina:', fetchError);
                setRows([]);
                setError('No fue posible cargar el reporte detallado para el periodo seleccionado.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminPayrollByPeriod();
    }, [period?.year, period?.monthNumber]);

    const availableDepartments = useMemo(() => ([
        'Todos',
        ...Array.from(new Set(rows.map((row) => row.departamento).filter(Boolean)))
    ]), [rows]);

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
                        Exportar Excel (Próximamente)
                    </button>
                    <button className="admin-report-btn admin-report-btn--secondary" type="button">
                        <i className="fa-regular fa-file-pdf"></i>
                        PDF (Próximamente)
                    </button>
                </div>
            </div>
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}
            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando nómina del periodo...</p>}

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
                    {availableDepartments.map((item) => (
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
                                    <tr key={row.id_nomina}>
                                        <td className="admin-payroll-table__employee-cell">
                                            <div className="admin-payroll-employee">
                                                <div className="admin-payroll-employee__avatar">{String(row.empleado || '').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div className="admin-payroll-employee__name">{row.empleado}</div>
                                                    <div className="admin-payroll-employee__role">{row.cargo || 'Sin cargo'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatReportCurrency(row.salario_basico)}</td>
                                        <td>{row.heo}</td>
                                        <td>{row.hef}</td>
                                        <td>{row.hen}</td>
                                        <td>{row.hefn}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_salud)}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_arl)}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_pension)}</td>
                                        <td className="is-primary is-strong">{formatReportCurrency(row.total_pagar)}</td>
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
                                <td className="is-danger">{formatReportCurrency(totals.salud)}</td>
                                <td className="is-danger">{formatReportCurrency(totals.arl)}</td>
                                <td className="is-danger">{formatReportCurrency(totals.pension)}</td>
                                <td className="is-primary is-strong">{formatReportCurrency(totals.totalPagar)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailPayroll;
