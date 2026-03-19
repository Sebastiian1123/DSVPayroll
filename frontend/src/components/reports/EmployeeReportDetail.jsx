import React from 'react';

const EmployeeReportDetail = ({ report, onBack }) => {
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
                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{report.month} {report.year || 2023}</span>
                    </div>
                    <h1>Detalle de Nómina</h1>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)'}}>
                        <i className="fa-regular fa-envelope"></i> Enviar a Email
                    </button>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>

            <div className="report-detail-card">
                {/* Header: Company & Period */}
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
                            <h4>{report.month} {report.year || 2023}</h4>
                            <p>01/{report.id.split('-').pop()}/{report.year || 2023} al 31/{report.id.split('-').pop()}/{report.year || 2023}</p>
                        </div>
                        <div className="period-col" style={{ textAlign: 'right' }}>
                            <p>FECHA DE ABONO</p>
                            <h4>31 {report.month.substring(0,3)} {report.year || 2023}</h4>
                            <span className="badge badge-success badge-sm" style={{ marginTop: '4px' }}>PAGADA</span>
                        </div>
                    </div>
                </div>

                {/* Body: Incomes & Deductions */}
                <div className="detail-body">
                    {/* Ingresos */}
                    <div className="detail-section inc">
                        <div className="section-title inc">
                            <i className="fa-solid fa-circle-plus"></i> Ingresos
                        </div>
                        
                        <div className="concept-list">
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Sueldo Base</h4>
                                    <p>Mensualidad ordinaria</p>
                                </div>
                                <div className="concept-amount">$2,850.00</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Horas Extra</h4>
                                    <p>8 horas estructurales</p>
                                </div>
                                <div className="concept-amount">$185.40</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Plus de Productividad</h4>
                                    <p>Objetivos Q3 logrados</p>
                                </div>
                                <div className="concept-amount">$450.00</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Complemento Transporte</h4>
                                    <p>Gasto mensual compensado</p>
                                </div>
                                <div className="concept-amount">$95.00</div>
                            </div>
                        </div>

                        <div className="section-total">
                            <span>TOTAL BRUTO</span>
                            <span className="amount">$3,580.40</span>
                        </div>
                    </div>

                    {/* Deducciones */}
                    <div className="detail-section deductions ded">
                        <div className="section-title ded" style={{ color: 'var(--danger-color)'}}>
                            <i className="fa-solid fa-circle-minus"></i> Deducciones
                        </div>
                        
                        <div className="concept-list">
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Retención ISR</h4>
                                    <p>Tipo aplicado: 19.5%</p>
                                </div>
                                <div className="concept-amount">-$598.18</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Seguridad Social (IMSS)</h4>
                                    <p>Contingencias comunes</p>
                                </div>
                                <div className="concept-amount">-$168.27</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Préstamo Empresa</h4>
                                    <p>Cuota 3 de 12</p>
                                </div>
                                <div className="concept-amount">-$53.70</div>
                            </div>
                            <div className="concept-item">
                                <div className="concept-name">
                                    <h4>Seguro de Salud</h4>
                                    <p>Cofinanciación empresa</p>
                                </div>
                                <div className="concept-amount">-$45.00</div>
                            </div>
                        </div>

                        <div className="section-total">
                            <span>TOTAL RETENCIONES</span>
                            <span className="amount">-$965.15</span>
                        </div>
                    </div>
                </div>

                {/* Footer: Totals & Notes */}
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
                        <h2>{report.amount}</h2>
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
                    <div className="detail-actions-btn"><i className="fa-regular fa-circle-question"></i> Centro de Ayuda</div>
                    <div className="detail-actions-btn"><i className="fa-solid fa-triangle-exclamation"></i> Notificar un Error</div>
                    <div className="detail-actions-btn"><i className="fa-solid fa-shield-halved"></i> Política de Nóminas</div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeReportDetail;
