import React, { useEffect, useMemo, useState } from 'react';
import reportsService from '../services/reportsService';
import { buildAdminMonths, buildAdminYears } from '../utils/adminReportsUtils';

const AdminReportsDashboard = ({ onSelectPeriod }) => {
    const currentYear = new Date().getUTCFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [reportRows, setReportRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdminReports = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await reportsService.getPayrollReports({ anio: selectedYear });
                setReportRows(data?.nominas || []);
            } catch (fetchError) {
                console.error('Error cargando reportes administrativos:', fetchError);
                setReportRows([]);
                setError('No fue posible cargar los reportes administrativos.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminReports();
    }, [selectedYear]);

    const years = useMemo(() => (
        buildAdminYears({ reportRows, selectedYear, currentYear })
    ), [currentYear, reportRows, selectedYear]);

    const months = useMemo(() => (
        buildAdminMonths({ reportRows, selectedYear })
    ), [reportRows, selectedYear]);

    return (
        <div className="admin-reports-dashboard">
            <div className="reports-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1>Seleccionar Periodo de Nómina</h1>
                    <p>Seleccione un año fiscal y mes para gestionar desembolsos o revisar ciclos financieros.</p>
                </div>
                <button
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}
                >
                    <i className="fa-solid fa-clock-rotate-left"></i> Ver Registros de Auditoría
                </button>
            </div>

            <div className="admin-reports-layout">
                <div className="main-panel">
                    <div className="year-selector-container">
                        <div className="year-selector-title" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-regular fa-calendar" style={{ color: 'var(--primary-color)' }}></i>
                                Navegador de Años
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px' }}><i className="fa-solid fa-chevron-left"></i></button>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px' }}><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="years-row">
                            {years.map((y) => (
                                <div
                                    key={y.year}
                                    className={`year-btn ${y.isCurrent ? 'active' : ''}`}
                                    onClick={() => setSelectedYear(y.year)}
                                >
                                    <span className="year-btn-label">Año Fiscal</span>
                                    <span className="year-btn-number">{y.year}</span>
                                    <div className="year-btn-status">
                                        <div className={`status-dot ${y.statusType}`}></div>
                                        {y.status}
                                    </div>
                                    {y.isCurrent && (
                                        <span className="badge badge-info" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '9px' }}>ACTUAL</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="cycles-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-dark)' }}>Ciclos del Año Fiscal {selectedYear}</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-light)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot success"></div> Cerrado</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot primary"></div> En Progreso</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div className="status-dot gray"></div> Pendiente</span>
                            </div>
                        </div>

                        <div className="months-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            {months.map((m) => (
                                <div
                                    key={m.id}
                                    className={`month-card ${m.isActive ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                                    style={{ minHeight: '130px', padding: '16px' }}
                                    onClick={() => !m.disabled && onSelectPeriod?.({
                                        month: m.name,
                                        monthNumber: m.monthNumber,
                                        year: selectedYear,
                                        status: m.status
                                    })}
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
                                    <div className="month-subtitle" style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-dark)' }}>{m.totalPagadoLabel}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-panel">
                    <div className="info-card">
                        <h3 className="info-card-title">Información del Periodo</h3>

                        <div className="info-stat">
                            <div className="info-stat-label">Empleados Activos</div>
                            <div className="info-stat-value">
                                2,482
                                <span className="info-stat-badge">+12 este mes</span>
                            </div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Total Mes Anterior
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                            <div className="info-stat-value">
                                $1.24M
                            </div>
                        </div>

                        <p style={{ fontSize: '11px', marginTop: '24px', opacity: 0.8, fontStyle: 'italic', lineHeight: 1.5 }}>
                            "La nómina de marzo está actualmente en etapa de validación. 450 hojas de tiempo pendientes de aprobación."
                        </p>

                        <button className="btn" style={{ width: '100%', marginTop: '24px', background: 'white', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            Procesar Nómina de Marzo
                        </button>
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
                                    <p>Nuevas regulaciones desde 01 Abr</p>
                                </div>
                            </div>
                            <div className="compliance-item">
                                <div className="compliance-icon info"><i className="fa-solid fa-circle-info"></i></div>
                                <div className="compliance-text">
                                    <h4>Prep. de Auditoría</h4>
                                    <p>Auditoría trimestral en 12 días</p>
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
            {loading && <p style={{ color: 'var(--text-light)', marginTop: '16px' }}>Cargando resumen de periodos...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginTop: '16px' }}>{error}</p>}
        </div>
    );
};

export default AdminReportsDashboard;
