import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const currency = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return '—';

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatLongDate = (dateLike) => {
    if (!dateLike) return '—';
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
};

const toMonthName = (dateLike, fallback = '') => {
    if (!dateLike) return fallback;
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat('es-CO', {
        month: 'long',
        timeZone: 'UTC'
    }).format(date);
};

const isLikelyDeduction = (concept) => {
    const normalized = String(concept || '').toLowerCase();
    return (
        normalized.includes('retenci') ||
        normalized.includes('deduc') ||
        normalized.includes('descuento') ||
        normalized.includes('prestamo') ||
        normalized.includes('seguridad social') ||
        normalized.includes('salud') ||
        normalized.includes('pension') ||
        normalized.includes('embargo')
    );
};

const EmployeeReportDetail = ({ report, reportId, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        const fetchPayrollDetail = async () => {
            if (!reportId) {
                setDetail(null);
                setError('No se encontró el identificador del recibo seleccionado.');
                return;
            }

            try {
                setLoading(true);
                setError('');
                const response = await api.get(`/nomina/reportes/${reportId}`);
                setDetail(response.data?.data || null);
            } catch (fetchError) {
                console.error('Error cargando detalle de nómina:', fetchError);
                setDetail(null);
                setError('No fue posible cargar el detalle de tu nómina. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchPayrollDetail();
    }, [reportId]);

    const monthTitle = useMemo(() => {
        const monthFromApi = toMonthName(detail?.nomina?.fecha_corte, report?.month || '');
        if (!monthFromApi) return report?.month || 'Recibo';
        return monthFromApi.charAt(0).toUpperCase() + monthFromApi.slice(1);
    }, [detail?.nomina?.fecha_corte, report?.month]);

    const yearTitle = useMemo(() => {
        const date = detail?.nomina?.fecha_corte ? new Date(detail.nomina.fecha_corte) : null;
        if (date && !Number.isNaN(date.getTime())) return date.getUTCFullYear();
        return report?.year || new Date().getFullYear();
    }, [detail?.nomina?.fecha_corte, report?.year]);

    const incomeItems = useMemo(() => {
        if (!detail?.detalles) return [];
        return detail.detalles.filter((row) => !isLikelyDeduction(row.concepto));
    }, [detail?.detalles]);

    const deductionItems = useMemo(() => {
        if (!detail?.detalles) return [];
        return detail.detalles.filter((row) => isLikelyDeduction(row.concepto));
    }, [detail?.detalles]);

    const overtimeTotal = useMemo(() => {
        if (!detail?.horas_extras?.length) return 0;
        return detail.horas_extras.reduce((acc, row) => acc + (Number(row.valor_total) || 0), 0);
    }, [detail?.horas_extras]);

    const overtimeHours = useMemo(() => {
        if (!detail?.horas_extras?.length) return 0;
        return detail.horas_extras.reduce((acc, row) => acc + (Number(row.horas) || 0), 0);
    }, [detail?.horas_extras]);

    const totalDevengado = Number(detail?.nomina?.total_devengado) || Number(report?.totalDevengado) || 0;
    const totalDeducciones = Number(detail?.nomina?.total_deducciones) || Number(report?.totalDeducciones) || 0;
    const totalPagar = Number(detail?.nomina?.total_pagar) || Number(report?.totalPagar) || 0;

    return (
        <div className="employee-report-detail">
            <div className="back-link" onClick={onBack}>
                <i className="fa-solid fa-arrow-left"></i> Volver a Mis Nóminas
            </div>

            <div className="reports-header" style={{ alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <span>Mis Nóminas</span>
                        <span>/</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{monthTitle} {yearTitle}</span>
                    </div>
                    <h1>Detalle de Nómina</h1>
                </div>
            </div>

            {loading && <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Cargando detalle...</p>}
            {!!error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}

            {!loading && !error && detail?.nomina && (
                <div className="report-detail-card">
                    <div className="detail-header">
                        <div className="company-info">
                            <div className="company-logo">
                                <i className="fa-solid fa-building"></i>
                            </div>
                            <div className="company-details">
                                <h3>{detail.nomina.empleado}</h3>
                                <p>ID Nómina: {detail.nomina.id_nomina}</p>
                            </div>
                        </div>

                        <div className="period-info">
                            <div className="period-col">
                                <p>PERIODO DE LIQUIDACIÓN</p>
                                <h4>{monthTitle} {yearTitle}</h4>
                                <p>{formatLongDate(detail.nomina.fecha_inicio)} al {formatLongDate(detail.nomina.fecha_corte)}</p>
                            </div>
                            <div className="period-col" style={{ textAlign: 'right' }}>
                                <p>FECHA DE ABONO</p>
                                <h4>{formatLongDate(detail.nomina.fecha_corte)}</h4>
                                <span className="badge badge-success badge-sm" style={{ marginTop: '4px' }}>PAGADA</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-body">
                        <div className="detail-section inc">
                            <div className="section-title inc">
                                <i className="fa-solid fa-circle-plus"></i> Ingresos
                            </div>

                            <div className="concept-list">
                                {incomeItems.map((item) => (
                                    <div className="concept-item" key={`inc-${item.id_detalle}`}>
                                        <div className="concept-name">
                                            <h4>{item.concepto}</h4>
                                            <p>Registro de nómina</p>
                                        </div>
                                        <div className="concept-amount">{currency(item.valor)}</div>
                                    </div>
                                ))}

                                {overtimeTotal > 0 && (
                                    <div className="concept-item">
                                        <div className="concept-name">
                                            <h4>Horas Extra</h4>
                                            <p>{overtimeHours} horas acumuladas</p>
                                        </div>
                                        <div className="concept-amount">{currency(overtimeTotal)}</div>
                                    </div>
                                )}

                                {incomeItems.length === 0 && overtimeTotal === 0 && (
                                    <div className="concept-item">
                                        <div className="concept-name">
                                            <h4>Sin ingresos detallados</h4>
                                            <p>No hay conceptos disponibles para este periodo.</p>
                                        </div>
                                        <div className="concept-amount">—</div>
                                    </div>
                                )}
                            </div>

                            <div className="section-total">
                                <span>TOTAL BRUTO</span>
                                <span className="amount">{currency(totalDevengado)}</span>
                            </div>
                        </div>

                        <div className="detail-section deductions ded">
                            <div className="section-title ded" style={{ color: 'var(--danger-color)' }}>
                                <i className="fa-solid fa-circle-minus"></i> Deducciones
                            </div>

                            <div className="concept-list">
                                {deductionItems.map((item) => (
                                    <div className="concept-item" key={`ded-${item.id_detalle}`}>
                                        <div className="concept-name">
                                            <h4>{item.concepto}</h4>
                                            <p>Registro de nómina</p>
                                        </div>
                                        <div className="concept-amount">-{currency(item.valor)}</div>
                                    </div>
                                ))}

                                {deductionItems.length === 0 && totalDeducciones > 0 && (
                                    <div className="concept-item">
                                        <div className="concept-name">
                                            <h4>Deducciones consolidadas</h4>
                                            <p>No hay desglose por concepto en esta nómina.</p>
                                        </div>
                                        <div className="concept-amount">-{currency(totalDeducciones)}</div>
                                    </div>
                                )}

                                {deductionItems.length === 0 && totalDeducciones === 0 && (
                                    <div className="concept-item">
                                        <div className="concept-name">
                                            <h4>Sin deducciones</h4>
                                            <p>Este periodo no tiene deducciones registradas.</p>
                                        </div>
                                        <div className="concept-amount">{currency(0)}</div>
                                    </div>
                                )}
                            </div>

                            <div className="section-total">
                                <span>TOTAL RETENCIONES</span>
                                <span className="amount">-{currency(totalDeducciones)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-footer">
                        <div className="accumulated-info">
                            <div className="acc-box">
                                <p>TIPO DE PAGO</p>
                                <h4>{detail.nomina.tipo_pago || '—'}</h4>
                            </div>
                            <div className="acc-box">
                                <p>HORAS EXTRA DEL PERIODO</p>
                                <h4>{overtimeHours || 0}</h4>
                            </div>
                        </div>

                        <div className="net-total">
                            <p>NETO A RECIBIR</p>
                            <h2>{currency(totalPagar)}</h2>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeReportDetail;
