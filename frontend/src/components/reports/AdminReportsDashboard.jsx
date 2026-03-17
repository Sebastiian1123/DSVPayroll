import React from 'react';

const AdminReportsDashboard = () => {
    // Mock Data based on Image 3
    const years = [
        { year: 2023, status: 'CERRADO', statusType: 'success' },
        { year: 2024, status: 'PERIODO ACTIVO', statusType: 'primary', isCurrent: true },
        { year: 2025, status: 'PLANIFICADO', statusType: 'warning' },
        { year: 2026, status: 'BLOQUEADO', statusType: 'gray' },
    ];

    const months = [
        { id: 1, name: 'Enero', desc: 'Pagado el 31 Ene', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 2, name: 'Febrero', desc: 'Pagado el 28 Feb', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 3, name: 'Marzo', desc: 'Periodo Actual', status: 'EN PROGRESO', statusClass: 'badge-info', isActive: true },
        { id: 4, name: 'Abril', desc: 'Inicia 01 Abr', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 5, name: 'Mayo', desc: 'Próximo Trimestre', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 6, name: 'Junio', desc: 'Final T2', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 7, name: 'Julio', desc: 'Ciclo 07-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 8, name: 'Agosto', desc: 'Ciclo 08-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 9, name: 'Septiembre', desc: 'Final T3', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 10, name: 'Octubre', desc: 'Ciclo 10-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 11, name: 'Noviembre', desc: 'Ciclo 11-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
        { id: 12, name: 'Diciembre', desc: 'Finde Año', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
    ];

    return (
        <div className="admin-reports-dashboard">
            <div className="reports-header" style={{ marginBottom: "32px"}}>
                <div>
                    <h1>Seleccionar Periodo de Nómina</h1>
                    <p>Seleccione un año fiscal y mes para gestionar desembolsos o revisar ciclos financieros.</p>
                </div>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)'}}>
                    <i className="fa-solid fa-clock-rotate-left"></i> Ver Registros de Auditoría
                </button>
            </div>

            <div className="admin-reports-layout">
                {/* Panel Izquierdo: Años y Meses */}
                <div className="main-panel">
                    {/* Selector de Años */}
                    <div className="year-selector-container">
                        <div className="year-selector-title" style={{ justifyContent: 'space-between', marginBottom: '16px'}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-regular fa-calendar" style={{ color: 'var(--primary-color)'}}></i> 
                                Navegador de Años
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px'}}><i className="fa-solid fa-chevron-left"></i></button>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px'}}><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="years-row">
                            {years.map(y => (
                                <div key={y.year} className={`year-btn ${y.isCurrent ? 'active' : ''}`}>
                                    <span className="year-btn-label">Año Fiscal</span>
                                    <span className="year-btn-number">{y.year}</span>
                                    <div className="year-btn-status">
                                        <div className={`status-dot ${y.statusType}`}></div>
                                        {y.status}
                                    </div>
                                    {y.isCurrent && (
                                        <span className="badge badge-info" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '9px'}}>ACTUAL</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid de Ciclos / Meses */}
                    <div className="cycles-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-dark)'}}>Ciclos del Año Fiscal 2024</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-light)'}}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px'}}><div className="status-dot success"></div> Cerrado</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px'}}><div className="status-dot primary"></div> En Progreso</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px'}}><div className="status-dot gray"></div> Pendiente</span>
                            </div>
                        </div>

                        <div className="months-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)'}}>
                            {months.map(m => (
                                <div key={m.id} className={`month-card ${m.isActive ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`} style={{ minHeight: '130px', padding: '16px' }}>
                                    <div className="month-header">
                                        <div className="month-icon">
                                            <i className="fa-regular fa-calendar-check"></i>
                                        </div>
                                        <span className={`badge badge-sm ${m.statusClass}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <div className="month-title" style={{ marginTop: 'auto', marginBottom: '4px'}}>{m.name}</div>
                                    <div className="month-subtitle" style={{ margin: 0, fontSize: '11px'}}>{m.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Información del Periodo */}
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
                            <div className="info-stat-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', border: '1px solid var(--border-color)'}}>
                            <i className="fa-solid fa-headset"></i>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '2px'}}>¿Necesita Ayuda?</h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-light)'}}>Contactar Especialista en Nómina</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminReportsDashboard;
