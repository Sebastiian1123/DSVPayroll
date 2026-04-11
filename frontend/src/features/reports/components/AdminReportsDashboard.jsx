import React, { useEffect, useMemo, useState } from 'react';
import reportsService from '../../../services/reportsService';
import { buildAdminMonthCards, buildAdminYearOptions } from '../utils/adminReportsUtils';
import { formatReportCurrency } from '../utils/reportFormatters';

const AdminReportsDashboard = ({ onSelectPeriod }) => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({
        totalNominas: 0,
        totalDevengado: 0,
        totalDeducciones: 0,
        totalPagado: 0
    });
    const [yearRows, setYearRows] = useState([]);

    const years = useMemo(() => buildAdminYearOptions(currentYear), [currentYear]);
    const monthCards = useMemo(() => (
        buildAdminMonthCards({
            selectedYear,
            rows: yearRows
        })
    ), [selectedYear, yearRows]);

    useEffect(() => {
        const fetchYearOverview = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await reportsService.getPayrollReports({ anio: selectedYear });
                setSummary({
                    totalNominas: Number(data?.resumen?.totalNominas) || 0,
                    totalDevengado: Number(data?.resumen?.totalDevengado) || 0,
                    totalDeducciones: Number(data?.resumen?.totalDeducciones) || 0,
                    totalPagado: Number(data?.resumen?.totalPagado) || 0
                });
                setYearRows(Array.isArray(data?.nominas) ? data.nominas : []);
            } catch (fetchError) {
                console.error('Error cargando dashboard administrativo:', fetchError);
                setSummary({
                    totalNominas: 0,
                    totalDevengado: 0,
                    totalDeducciones: 0,
                    totalPagado: 0
                });
                setYearRows([]);
                setError('No fue posible cargar la información de reportes administrativos.');
            } finally {
                setLoading(false);
            }
        };

        fetchYearOverview();
    }, [selectedYear]);

    return (
        <div className="admin-reports-dashboard">
            <div className="reports-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1>Seleccionar Periodo de Nómina</h1>
                    <p>Seleccione un año y mes para consultar la nómina real de los empleados.</p>
                </div>
            </div>
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}
            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando datos administrativos...</p>}

            <div className="admin-reports-layout">
                <div className="main-panel">
                    <div className="year-selector-container">
                        <div className="year-selector-title" style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-regular fa-calendar" style={{ color: 'var(--primary-color)' }}></i>
                                Navegador de Años
                            </div>
                        </div>
                        <div className="years-row">
                            {years.map((year) => (
                                <button
                                    type="button"
                                    key={year}
                                    className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                                    onClick={() => setSelectedYear(year)}
                                >
                                    <span className="year-btn-label">Año Fiscal</span>
                                    <span className="year-btn-number">{year}</span>
                                    <div className="year-btn-status">
                                        <div className={`status-dot ${selectedYear === year ? 'primary' : 'gray'}`}></div>
                                        {selectedYear === year ? 'ACTIVO' : 'CONSULTAR'}
                                    </div>
                                    {selectedYear === year && (
                                        <span className="badge badge-info" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '9px' }}>ACTUAL</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cycles-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-dark)' }}>Ciclos del Año Fiscal {selectedYear}</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-light)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot success"></div> Cerrado</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot gray"></div> Sin datos</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot warning"></div> Pendiente</span>
                            </div>
                        </div>

                        <div className="months-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            {monthCards.map((m) => (
                                <div
                                    key={m.id}
                                    className={`month-card ${m.isActive ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                                    style={{ minHeight: '130px', padding: '16px' }}
                                    onClick={() => !m.disabled && onSelectPeriod?.({ month: m.name, monthNumber: m.id, year: selectedYear, status: m.status })}
                                >
                                    <div className="month-header">
                                        <div className="month-icon">
                                            <i className="fa-regular fa-calendar-check"></i>
                                        </div>
                                        <span className={`badge badge-sm ${m.statusClass}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <div className="month-title" style={{ marginTop: 'auto', marginBottom: '4px' }}>{m.name}</div>
                                    <div className="month-subtitle" style={{ margin: 0, fontSize: '11px' }}>{m.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-panel">
                    <div className="info-card">
                        <h3 className="info-card-title">Información del Periodo</h3>

                        <div className="info-stat">
                            <div className="info-stat-label">Nóminas del año</div>
                            <div className="info-stat-value">
                                {summary.totalNominas}
                            </div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Total devengado
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                            <div className="info-stat-value">
                                {formatReportCurrency(summary.totalDevengado)}
                            </div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label">Total deducciones</div>
                            <div className="info-stat-value">{formatReportCurrency(summary.totalDeducciones)}</div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label">Total pagado</div>
                            <div className="info-stat-value">{formatReportCurrency(summary.totalPagado)}</div>
                        </div>
                    </div>

                    <div className="compliance-card">
                        <h3 style={{ fontSize: '14px', color: 'var(--text-dark)', marginBottom: '16px', fontWeight: 600 }}>Verificación de Cumplimiento</h3>
                        <div className="compliance-list">
                            <div className="compliance-item">
                                <div className="compliance-icon success"><i className="fa-solid fa-circle-check"></i></div>
                                <div className="compliance-text">
                                    <h4>Declaraciones de Impuestos</h4>
                                    <p>Al día hasta Feb 2024</p>
                                </div>
                            </div>
                            <div className="compliance-item">
                                <div className="compliance-icon warning"><i className="fa-solid fa-triangle-exclamation"></i></div>
                                <div className="compliance-text">
                                    <h4>Leyes Laborales</h4>
                                    <p>Validar cambios legales del periodo seleccionado</p>
                                </div>
                            </div>
                            <div className="compliance-item">
                                <div className="compliance-icon info"><i className="fa-solid fa-circle-info"></i></div>
                                <div className="compliance-text">
                                    <h4>Prep. de Auditoría</h4>
                                    <p>Descargue consolidado mensual para auditoría</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', border: '1px solid var(--border-color)', gap: '16px', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', border: '1px solid var(--border-color)' }}>
                            <i className="fa-solid fa-headset"></i>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '2px' }}>¿Necesita Ayuda?</h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>Contactar Especialista en Nómina</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportsDashboard;
