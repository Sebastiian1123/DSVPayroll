import React, { useEffect, useState } from 'react';
import { showError } from '../../../utils/alerts';
import payrollService from '../../../services/payrollService';
import {
    EMPLOYEE_REPORT_ACTIONS,
    EMPLOYEE_REPORT_DEDUCTIONS,
    EMPLOYEE_REPORT_INCOMES,
    getEmployeeReportPeriodMeta
} from '../utils/employeeReportDetailUtils';

const EmployeeReportDetail = ({ report, onBack }) => {
    const periodMeta = getEmployeeReportPeriodMeta(report);
    const [payrollDetail, setPayrollDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const fetchPayrollDetail = async () => {
            if (!report?.dbId) return;

            try {
                setLoadingDetail(true);
                const detail = await payrollService.getPayrollDetail(report.dbId);
                setPayrollDetail(detail);
            } catch (error) {
                console.error('Error cargando detalle de nómina:', error);
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchPayrollDetail();
    }, [report?.dbId]);

    const handleDownloadPdf = async () => {
        try {
            if (!report?.dbId) {
                showError('Error', 'No se encontro el id de la nomina');
                return;
            }

            const response = await payrollService.downloadPayrollPdf(report.dbId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `nomina-${report.dbId}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando PDF:', error);
            showError('Error', 'No se pudo descargar el PDF');
        }
    };

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
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{periodMeta.liquidationPeriodLabel}</span>
                    </div>
                    <h1>Detalle de Nómina</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}>
                        <i className="fa-regular fa-envelope"></i> Enviar a Email
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleDownloadPdf}
                    >
                        <i className="fa-solid fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>

            <div className="report-detail-card">
                {loadingDetail && (
                    <div style={{ padding: '12px 16px', color: 'var(--text-light)' }}>
                        Cargando novedades aplicadas...
                    </div>
                )}

                <div className="detail-header">
                    <div className="company-info">
                        <div className="company-logo">
                            <i className="fa-solid fa-building"></i>
                        </div>
                        <div className="company-details">
                            <h3>Nómina S.A. de C.V.</h3>
                            <p>RFC: NOM-123456-789 | Dirección Fiscal Empresa, Ciudad</p>
                        </div>
                    </div>

                    <div className="period-info">
                        <div className="period-col">
                            <p>PERIODO DE LIQUIDACIÓN</p>
                            <h4>{periodMeta.liquidationPeriodLabel}</h4>
                            <p>{periodMeta.liquidationRangeLabel}</p>
                        </div>
                        <div className="period-col" style={{ textAlign: 'right' }}>
                            <p>FECHA DE ABONO</p>
                            <h4>{periodMeta.paymentDateLabel}</h4>
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
                            {EMPLOYEE_REPORT_INCOMES.map((item) => (
                                <div className="concept-item" key={item.title}>
                                    <div className="concept-name">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                    <div className="concept-amount">{item.amount}</div>
                                </div>
                            ))}
                        </div>

                        <div className="section-total">
                            <span>TOTAL BRUTO</span>
                            <span className="amount">
                                {payrollDetail?.nomina?.total_devengado
                                    ? `$${Number(payrollDetail.nomina.total_devengado).toLocaleString('es-CO')}`
                                    : '$3,580.40'}
                            </span>
                        </div>
                    </div>

                    <div className="detail-section deductions ded">
                        <div className="section-title ded" style={{ color: 'var(--danger-color)' }}>
                            <i className="fa-solid fa-circle-minus"></i> Deducciones
                        </div>

                        <div className="concept-list">
                            {EMPLOYEE_REPORT_DEDUCTIONS.map((item) => (
                                <div className="concept-item" key={item.title}>
                                    <div className="concept-name">
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                    <div className="concept-amount">{item.amount}</div>
                                </div>
                            ))}
                        </div>

                        <div className="section-total">
                            <span>TOTAL RETENCIONES</span>
                            <span className="amount">
                                {payrollDetail?.nomina?.total_deducciones
                                    ? `-$${Number(payrollDetail.nomina.total_deducciones).toLocaleString('es-CO')}`
                                    : '-$965.15'}
                            </span>
                        </div>
                    </div>
                </div>

                {payrollDetail?.novedades_aplicadas?.length > 0 && (
                    <div className="detail-body" style={{ paddingTop: 0 }}>
                        <div className="detail-section">
                            <div className="section-title inc">
                                <i className="fa-solid fa-list-check"></i> Novedades aprobadas aplicadas
                            </div>
                            <div className="concept-list">
                                {payrollDetail.novedades_aplicadas.map((novelty) => (
                                    <div className="concept-item" key={`${novelty.id_solicitud}-${novelty.concepto}`}>
                                        <div className="concept-name">
                                            <h4>{novelty.concepto}</h4>
                                            <p>
                                                {novelty.tipo} · {Number(novelty.cantidad || 0)} {novelty.unidad?.toLowerCase()}
                                            </p>
                                        </div>
                                        <div className="concept-amount">
                                            {novelty.categoria === 'DEDUCCION' ? '-' : '+'}
                                            ${Number(novelty.valor_aplicado || 0).toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="detail-footer">
                    <div className="accumulated-info">
                        <div className="acc-box">
                            <p>ACUMULADO BRUTO ANUAL</p>
                            <h4>$35,804.00</h4>
                        </div>
                        <div className="acc-box">
                            <p>RETENCIÓN YTD</p>
                            <h4>$6,981.80</h4>
                        </div>
                    </div>

                    <div className="net-total">
                        <p>NETO A RECIBIR</p>
                        <h2>
                            {payrollDetail?.nomina?.total_pagar
                                ? `$${Number(payrollDetail.nomina.total_pagar).toLocaleString('es-CO')}`
                                : report.amount}
                        </h2>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                            (Dos mil seiscientos quince con veinticinco centavos)
                        </span>
                    </div>
                </div>

                <div className="employer-notes">
                    <i className="fa-solid fa-note-sticky"></i>
                    <p>
                        "Este mes se incluye el abono extraordinario por el cumplimiento de objetivos del tercer trimestre. Asimismo, se ha ajustado la retención de ISR según la nueva normativa fiscal vigente. Recordamos que las solicitudes de vacaciones para el periodo navideño deben realizarse antes del 15 de noviembre."
                    </p>
                </div>

                <div className="detail-actions">
                    {EMPLOYEE_REPORT_ACTIONS.map((action) => (
                        <div className="detail-actions-btn" key={action.label}>
                            <i className={action.icon}></i> {action.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeeReportDetail;
