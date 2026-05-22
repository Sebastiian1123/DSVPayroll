import React, { useEffect, useMemo, useState } from 'react';
import reportsService from '../../../services/reportsService';
import { useAuth } from '../../../context/AuthContext';
import { calculateAdminPayrollTotals, filterAdminPayrollRows } from '../utils/adminDetailPayrollUtils';
import { formatReportCurrency } from '../utils/reportFormatters';

const AdminDetailPayroll = ({ period, onBack }) => {
    const { isAdmin } = useAuth();

    if (!isAdmin()) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>No tienes permisos para acceder a esta página</h2>
                <p>Contacta al administrador si crees que esto es un error.</p>
            </div>
        );
    }
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('Todos');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState('');

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
                console.error('Error cargando detalle administrativo de nomina:', fetchError);
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

    const handleDownload = async ({ format, idEmpleado = null }) => {
        if (!period?.year || !period?.monthNumber) return;

        const downloadKey = `${format}-${idEmpleado || 'all'}`;

        try {
            setDownloading(downloadKey);
            setError('');
            const payload = {
                anio: period.year,
                mes: period.monthNumber,
                id_empleado: idEmpleado
            };

            if (format === 'excel') {
                await reportsService.downloadPayrollReportExcel(payload);
                return;
            }

            await reportsService.downloadPayrollReportPdf(payload);
        } catch (downloadError) {
            console.error('Error descargando reporte de nomina:', downloadError);
            setError('No fue posible descargar el reporte. Intenta nuevamente.');
        } finally {
            setDownloading('');
        }
    };

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
                    <h1>Reporte Detallado de Nomina</h1>
                    <p>
                        Lista consolidada de empleados, horas extras y deducciones del periodo seleccionado.
                    </p>
                </div>

                <div className="admin-payroll-report__actions">
                    <button
                        className="admin-report-btn admin-report-btn--primary"
                        type="button"
                        onClick={() => handleDownload({ format: 'excel' })}
                        disabled={!!downloading || loading}
                    >
                        <i className="fa-solid fa-download"></i>
                        {downloading === 'excel-all' ? 'Generando Excel...' : 'Exportar Excel'}
                    </button>
                    <button
                        className="admin-report-btn admin-report-btn--secondary"
                        type="button"
                        onClick={() => handleDownload({ format: 'pdf' })}
                        disabled={!!downloading || loading}
                    >
                        <i className="fa-regular fa-file-pdf"></i>
                        {downloading === 'pdf-all' ? 'Generando PDF...' : 'PDF'}
                    </button>
                </div>
            </div>
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}
            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando nomina del periodo...</p>}

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
                    <label>Anio:</label>
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
                                <th>Salario basico</th>
                                <th>HEO</th>
                                <th>HEF</th>
                                <th>HEN</th>
                                <th>HEFN</th>
                                <th className="is-danger">Deduc. salud</th>
                                <th className="is-danger">Deduc. ARL</th>
                                <th className="is-danger">Deduc. pension</th>
                                <th className="is-primary">Neto a pagar</th>
                                <th>Estado HE</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={12} style={{ textAlign: 'center', padding: '28px 24px', color: 'var(--text-light)' }}>
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
                                        <td>{formatReportCurrency(row.heo_valor)}</td>
                                        <td>{formatReportCurrency(row.hef_valor)}</td>
                                        <td>{formatReportCurrency(row.hen_valor)}</td>
                                        <td>{formatReportCurrency(row.hefn_valor)}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_salud)}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_arl)}</td>
                                        <td className="is-danger">{formatReportCurrency(row.deduccion_pension)}</td>
                                        <td className="is-primary is-strong">{formatReportCurrency(row.total_pagar)}</td>
                                        <td>
                                            {Number(row.overtime_data_complete) === 1 ? 'Completo' : 'Inconsistente'}
                                        </td>
                                        <td>
                                            <div className="admin-payroll-row-actions">
                                                <button
                                                    type="button"
                                                    className="admin-payroll-row-action"
                                                    title="Descargar Excel del empleado"
                                                    onClick={() => handleDownload({ format: 'excel', idEmpleado: row.id_empleado })}
                                                    disabled={!!downloading}
                                                >
                                                    <i className="fa-solid fa-file-excel"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-payroll-row-action"
                                                    title="Descargar PDF del empleado"
                                                    onClick={() => handleDownload({ format: 'pdf', idEmpleado: row.id_empleado })}
                                                    disabled={!!downloading}
                                                >
                                                    <i className="fa-regular fa-file-pdf"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="admin-payroll-table__totals-title">Totales del periodo</td>
                                <td>{formatReportCurrency(totals.salario)}</td>
                                <td>{formatReportCurrency(totals.heo)}</td>
                                <td>{formatReportCurrency(totals.hef)}</td>
                                <td>{formatReportCurrency(totals.hen)}</td>
                                <td>{formatReportCurrency(totals.hefn)}</td>
                                <td className="is-danger">{formatReportCurrency(totals.salud)}</td>
                                <td className="is-danger">{formatReportCurrency(totals.arl)}</td>
                                <td className="is-danger">{formatReportCurrency(totals.pension)}</td>
                                <td className="is-primary is-strong">{formatReportCurrency(totals.totalPagar)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailPayroll;
