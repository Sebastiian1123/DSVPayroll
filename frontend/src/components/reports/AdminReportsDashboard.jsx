import React, { useMemo } from 'react';

const MONTHS = [
    { number: 1, name: 'Enero' },
    { number: 2, name: 'Febrero' },
    { number: 3, name: 'Marzo' },
    { number: 4, name: 'Abril' },
    { number: 5, name: 'Mayo' },
    { number: 6, name: 'Junio' },
    { number: 7, name: 'Julio' },
    { number: 8, name: 'Agosto' },
    { number: 9, name: 'Septiembre' },
    { number: 10, name: 'Octubre' },
    { number: 11, name: 'Noviembre' },
    { number: 12, name: 'Diciembre' }
];

const formatCurrency = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return '—';

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const AdminReportsDashboard = ({
    reportRows = [],
    selectedYear,
    years = [],
    loading = false,
    error = '',
    onSelectYear,
    onSelectPeriod
}) => {
    const rowsByMonth = useMemo(() => {
        return reportRows.reduce((acc, row) => {
            const date = new Date(row.fecha_corte);
            const monthNumber = date.getUTCMonth() + 1;

            if (!acc[monthNumber]) {
                acc[monthNumber] = [];
            }

            acc[monthNumber].push(row);
            return acc;
        }, {});
    }, [reportRows]);

    const monthCards = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        return MONTHS.map((month) => {
            const monthRows = rowsByMonth[month.number] || [];
            const totalPagado = monthRows.reduce((acc, row) => acc + (Number(row.total_pagar) || 0), 0);
            const isFuture = selectedYear === currentYear && month.number > currentMonth;

            if (monthRows.length === 0) {
                return {
                    ...month,
                    count: 0,
                    totalPagado: 0,
                    status: isFuture ? 'PRÓXIMO' : 'SIN REGISTRO',
                    statusClass: isFuture ? 'badge-secondary' : 'badge-gray',
                    disabled: true,
                    description: isFuture ? 'Periodo futuro' : 'Sin nóminas registradas'
                };
            }

            return {
                ...month,
                count: monthRows.length,
                totalPagado,
                status: 'DISPONIBLE',
                statusClass: 'badge-success',
                disabled: false,
                description: `${monthRows.length} nómina(s) registradas`
            };
        });
    }, [rowsByMonth, selectedYear]);

    const summary = useMemo(() => {
        return reportRows.reduce((acc, row) => {
            acc.totalNominas += 1;
            acc.totalPagado += Number(row.total_pagar) || 0;
            acc.totalDevengado += Number(row.total_devengado) || 0;
            return acc;
        }, {
            totalNominas: 0,
            totalPagado: 0,
            totalDevengado: 0
        });
    }, [reportRows]);

    return (
        <div className="admin-reports-dashboard">
            <div className="reports-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1>Reportes de Nómina (Administrador)</h1>
                    <p>Selecciona un año y un mes para consultar la nómina consolidada de empleados.</p>
                </div>

                <div style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                    {years.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => onSelectYear?.(year)}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                background: selectedYear === year ? 'var(--info-color)' : 'transparent',
                                color: selectedYear === year ? 'white' : 'var(--text-light)',
                                fontWeight: selectedYear === year ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando reportes...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}

            <div className="admin-reports-layout">
                <div className="main-panel">
                    <div className="cycles-container">
                        <h3 style={{ fontSize: '16px', color: 'var(--text-dark)', marginBottom: '16px' }}>
                            Ciclos de nómina del año {selectedYear}
                        </h3>

                        <div className="months-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            {monthCards.map((month) => (
                                <div
                                    key={month.number}
                                    className={`month-card ${month.disabled ? 'disabled' : ''}`}
                                    style={{ minHeight: '130px', padding: '16px' }}
                                    onClick={() => {
                                        if (month.disabled) return;
                                        onSelectPeriod?.({
                                            month: month.name,
                                            monthNumber: month.number,
                                            year: selectedYear
                                        });
                                    }}
                                >
                                    <div className="month-header">
                                        <div className="month-icon">
                                            <i className="fa-regular fa-calendar-check"></i>
                                        </div>
                                        <span className={`badge badge-sm ${month.statusClass}`}>
                                            {month.status}
                                        </span>
                                    </div>
                                    <div className="month-title" style={{ marginTop: 'auto', marginBottom: '4px' }}>{month.name}</div>
                                    <div className="month-subtitle" style={{ margin: 0, fontSize: '11px' }}>{month.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-panel">
                    <div className="info-card">
                        <h3 className="info-card-title">Resumen anual</h3>

                        <div className="info-stat">
                            <div className="info-stat-label">Total de nóminas</div>
                            <div className="info-stat-value">{summary.totalNominas}</div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label">Total devengado</div>
                            <div className="info-stat-value">{formatCurrency(summary.totalDevengado)}</div>
                        </div>

                        <div className="info-stat">
                            <div className="info-stat-label">Total pagado</div>
                            <div className="info-stat-value">{formatCurrency(summary.totalPagado)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportsDashboard;
