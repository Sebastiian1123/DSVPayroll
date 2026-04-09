import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { buildEmployeeReportsByMonth } from '../utils/employeeReportsUtils';

const EmployeeReportsList = ({ onSelectReport }) => {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportRows, setReportRows] = useState([]);

    const years = useMemo(() => [currentYear, currentYear - 1, currentYear - 2], [currentYear]);

    useEffect(() => {
        const fetchEmployeeReportsByYear = async () => {
            if (!user?.id_empleado) {
                setReportRows([]);
                setError('Tu usuario no está asociado a un empleado. Contacta al administrador.');
                return;
            }

            try {
                setLoading(true);
                setError('');

                const response = await api.get('/nomina/reportes', {
                    params: {
                        anio: selectedYear,
                        id_empleado: Number(user.id_empleado)
                    }
                });

                setReportRows(response.data?.data?.nominas || []);
            } catch (fetchError) {
                console.error('Error cargando reportes de empleado:', fetchError);
                setReportRows([]);
                setError('No fue posible cargar tus reportes de nómina. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeReportsByYear();
    }, [selectedYear, user?.id_empleado]);

    const reportByMonth = useMemo(() => (
        buildEmployeeReportsByMonth({
            reportRows,
            selectedYear
        })
    ), [reportRows, selectedYear]);

    return (
        <div className="employee-reports-list">
            <div className="reports-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', alignItems: 'center' }}>
                        <span>Inicio</span>
                        <span>/</span>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>Recibos de Nómina</span>
                    </div>
                    <h1>Historial de Pagos</h1>
                    <p>Selecciona un mes para visualizar el detalle de tu nómina del año <strong style={{ color: 'var(--text-dark)' }}>{selectedYear}</strong>.</p>
                </div>

                <div style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                    {years.map((y) => (
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

            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando reportes...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}

            <div className="months-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {reportByMonth.map((r, index) => (
                    <div
                        key={index}
                        className={`month-card ${r.disabled ? 'disabled' : ''}`}
                        onClick={() => !r.disabled && onSelectReport(r)}
                        style={{ padding: '24px' }}
                    >
                        <div className="month-header">
                            <div className="month-icon" style={{ fontSize: '24px', color: r.disabled ? '#cbd5e1' : 'var(--text-dark)' }}>
                                {r.disabled ? <i className="fa-regular fa-calendar"></i> : <i className="fa-solid fa-file-invoice"></i>}
                            </div>
                            {r.status && (
                                <span className={`badge badge-sm ${r.statusClass}`} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                                <span style={{ fontSize: r.amount.includes('$') ? '20px' : '14px', color: r.disabled ? '#9ca3af' : 'var(--text-dark)' }}>{r.amount}</span>
                                {!r.disabled && (
                                    <div style={{
                                        width: '28px', height: '28px',
                                        borderRadius: '50%',
                                        background: '#f1f5f9',
                                        color: '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className="fa-solid fa-chevron-right fa-sm"></i>
                                    </div>
                                )}
                            </div>
                        )}

                        {!r.amount && <div style={{ minHeight: '44px' }}></div>}
                    </div>
                ))}
            </div>

            <div className="info-banner" style={{ background: '#f8fafc', border: 'none' }}>
                <div className="banner-content">
                    <div className="banner-icon" style={{ background: 'var(--info-color)' }}>
                        <i className="fa-solid fa-info"></i>
                    </div>
                    <div className="banner-text">
                        <h4 style={{ fontSize: '16px' }}>¿Necesitas un reporte consolidado?</h4>
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
