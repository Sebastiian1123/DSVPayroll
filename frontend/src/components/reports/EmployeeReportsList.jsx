import React, { useState } from 'react';

const EmployeeReportsList = ({ onSelectReport }) => {
    const [selectedYear, setSelectedYear] = useState(2023);
    const years = [2023, 2022, 2021];

    // Mock Data based on Image 1
    const reports = [
        { id: 'RN-2023-01', month: 'Enero', amount: '$7,241.14', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 'RN-2023-02', month: 'Febrero', amount: '$7,150.00', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 'RN-2023-03', month: 'Marzo', amount: '$7,320.50', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 'RN-2023-04', month: 'Abril', amount: '$7,241.14', status: 'PAGADO', statusClass: 'badge-success' },
        { id: 'RN-2023-05', month: 'Mayo', amount: '$7,241.14', status: 'DISPONIBLE', statusClass: 'badge-info', isActive: true },
        { id: 'RN-2023-06', month: 'Junio', amount: 'Generando...', status: 'PRÓXIMO', statusClass: 'badge-secondary', disabled: true },
        { id: 'RN-2023-07', month: 'Julio', status: '', disabled: true },
        { id: 'RN-2023-08', month: 'Agosto', status: '', disabled: true },
        { id: 'RN-2023-09', month: 'Septiembre', status: '', disabled: true },
        { id: 'RN-2023-10', month: 'Octubre', status: '', disabled: true },
        { id: 'RN-2023-11', month: 'Noviembre', status: '', disabled: true },
        { id: 'RN-2023-12', month: 'Diciembre', status: '', disabled: true },
    ];

    return (
        <div className="employee-reports-list">
            <div className="reports-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', alignItems: 'center'}}>
                        <span>Inicio</span>
                        <span>/</span>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 500}}>Recibos de Nómina</span>
                    </div>
                    <h1>Historial de Pagos</h1>
                    <p>Selecciona un mes para visualizar el detalle de tu nómina del año <strong style={{color: 'var(--text-dark)'}}>{selectedYear}</strong>.</p>
                </div>
                
                <div style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)'}}>
                    {years.map(y => (
                        <button 
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            style={{ 
                                padding: '8px 24px', 
                                border: 'none', 
                                borderRadius: '6px',
                                background: selectedYear === y ? 'var(--info-color)' : 'transparent',
                                color: selectedYear === y ? 'white' : 'var(--text-light)',
                                fontWeight: selectedYear === y ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            <div className="months-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {reports.map((r, index) => (
                    <div 
                        key={index} 
                        className={`month-card ${r.isActive ? 'active' : ''} ${r.disabled ? 'disabled' : ''}`}
                        onClick={() => !r.disabled && onSelectReport(r)}
                        style={{ padding: '24px' }}
                    >
                        <div className="month-header">
                            <div className="month-icon" style={{ fontSize: '24px', color: r.isActive ? 'var(--info-color)' : (r.disabled ? '#cbd5e1' : 'var(--text-dark)') }}>
                                {r.disabled ? <i className="fa-regular fa-calendar"></i> : <i className="fa-solid fa-file-invoice"></i>}
                            </div>
                            {r.status && (
                                <span className={`badge badge-sm ${r.statusClass}`} style={{textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                                    {r.status}
                                </span>
                            )}
                        </div>
                        
                        <div className="month-title" style={{ fontSize: '18px', marginTop: '16px' }}>{r.month}</div>
                        
                        <div className="month-subtitle" style={{ color: '#9ca3af' }}>
                            {r.id ? `Recibo #${r.id}` : ''}
                        </div>
                        
                        {r.amount && (
                            <div className="month-amount" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: r.amount.includes('$') ? '20px' : '14px', color: r.disabled ? '#9ca3af' : 'var(--text-dark)'}}>{r.amount}</span>
                                {!r.disabled && (
                                    <div style={{ 
                                        width: '28px', height: '28px', 
                                        borderRadius: '50%', 
                                        background: r.isActive ? 'var(--info-color)' : '#f1f5f9',
                                        color: r.isActive ? 'white' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className={`fa-solid ${r.isActive ? 'fa-eye' : 'fa-chevron-right'} fa-sm`}></i>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Empty spacing for disabled months without amount */}
                        {!r.amount && <div style={{ minHeight: '44px' }}></div>}
                    </div>
                ))}
            </div>

            {/* Banner Consolidado */}
            <div className="info-banner" style={{ background: '#f8fafc', border: 'none' }}>
                <div className="banner-content">
                    <div className="banner-icon" style={{ background: 'var(--info-color)'}}>
                        <i className="fa-solid fa-info"></i>
                    </div>
                    <div className="banner-text">
                        <h4 style={{ fontSize: '16px'}}>¿Necesitas un reporte consolidado?</h4>
                        <p>Puedes descargar un resumen anual de tus percepciones y deducciones para trámites legales o fiscales.</p>
                    </div>
                </div>
                <button className="btn" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                    Descargar Reporte Anual
                </button>
            </div>
        </div>
    );
};

export default EmployeeReportsList;
