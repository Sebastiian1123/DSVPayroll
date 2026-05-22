import React, { useEffect, useState } from 'react';
import { showError } from '../../../utils/alerts';
import payrollService from '../../../services/payrollService';
import { formatReportCurrency } from '../utils/reportFormatters';
import {
  EMPLOYEE_REPORT_ACTIONS,
  getEmployeeReportPeriodMeta
} from '../utils/employeeReportDetailUtils';

const OVERTIME_TYPE_LABELS = {
  'EXTRA_DIURNA': 'Extra diurna',
  'EXTRA_NOCTURNA': 'Extra nocturna',
  'EXTRA_DIURNA_DOMINICAL_FESTIVO': 'Extra diurna domingos/festivos',
  'EXTRA_NOCTURNA_DOMINICAL_FESTIVO': 'Extra nocturna domingos/festivos'
};

const isOvertimeConcept = (concept) => {
  const c = String(concept || '').trim().toUpperCase();
  return c.startsWith('EXTRA_') || c.startsWith('EXTRA ');
};

const classifyDetailRow = (concept) => {
  const c = String(concept || '').trim().toUpperCase();
  if (isOvertimeConcept(concept)) {
    return 'HORA_EXTRA';
  }
  if (
    c.includes('SALUD') ||
    c.includes('PENSION') ||
    c.includes('ARL') ||
    c.includes('DESCUENTO') ||
    c.includes('AJUSTE')
  ) {
    return 'DEDUCCION';
  }
  if (
    c.includes('VACACIONES') ||
    c.includes('LICENCIA') ||
    c.includes('INCAPACIDAD') ||
    c.includes('PERMISO')
  ) {
    return 'NOVEDAD';
  }
  return 'DEVENGADO';
};

const EmployeeReportDetail = ({ report, onBack }) => {
  const periodMeta = getEmployeeReportPeriodMeta(report);
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!report?.dbId) {
        setError('No se encontro el id de la nomina');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await payrollService.getPayrollDetail(report.dbId);
        if (!data) {
          setError('No se pudo cargar el detalle de la nomina');
          return;
        }
        setPayroll(data.payroll);
        setOvertime(data.overtimeRows || []);

        const inc = [];
        const ded = [];

        for (const row of (data.detailRows || [])) {
          const valor = Number(row.valor) || 0;
          const category = classifyDetailRow(row.concepto);
          if (category === 'DEDUCCION') {
            ded.push(row);
          } else if (category === 'DEVENGADO' || category === 'NOVEDAD') {
            inc.push({ ...row, valor });
          }
        }

        setIncomes(inc);
        setDeductions(ded);
      } catch (err) {
        console.error('Error cargando detalle de nomina:', err);
        setError('Error al cargar el detalle de la nomina');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [report?.dbId]);

  const totalDevengado = payroll ? Number(payroll.total_devengado) || 0 : 0;
  const totalDeducciones = payroll ? Number(payroll.total_deducciones) || 0 : 0;
  const totalHorasExtra = overtime.reduce((acc, item) => acc + (Number(item.horas) || 0), 0);
  const totalValorHorasExtra = overtime.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0);

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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }} />
            <p>Cargando detalle...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 24, marginBottom: 12 }} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="detail-body">
              <div className="detail-section inc">
                <div className="section-title inc">
                  <i className="fa-solid fa-circle-plus"></i> Ingresos
                </div>

                <div className="concept-list">
                  {incomes.length > 0 ? incomes.map((item, idx) => (
                    <div className="concept-item" key={idx}>
                      <div className="concept-name">
                        <h4>{item.concepto}</h4>
                      </div>
                      <div className="concept-amount">{formatReportCurrency(item.valor)}</div>
                    </div>
                  )) : (
                    <div className="concept-item">
                      <div className="concept-name">
                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin ingresos registrados</p>
                      </div>
                    </div>
                  )}
                </div>

                 <div className="section-total">
                   <span>TOTAL BRUTO</span>
                   <span className="amount">{formatReportCurrency(totalDevengado)}</span>
                 </div>
               </div>

               {overtime.length > 0 && (
                 <div className="detail-section inc">
                   <div className="section-title inc">
                     <i className="fa-solid fa-clock"></i> Horas Extra
                   </div>

                   <div className="concept-list">
                     {overtime.map((item, idx) => (
                       <div className="concept-item" key={idx}>
                         <div className="concept-name">
                           <h4>{OVERTIME_TYPE_LABELS[item.tipo_hora] || item.tipo_hora}</h4>
                           <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '4px' }}>
                             {Number(item.horas) || 0} horas × {formatReportCurrency(Number(item.valor_hora_extra) || 0)} / hora
                             {item.porcentaje_recargo && ` (${(Number(item.porcentaje_recargo) * 100).toFixed(0)}%)`}
                           </p>
                         </div>
                         <div className="concept-amount">{formatReportCurrency(Number(item.valor_total) || 0)}</div>
                       </div>
                     ))}
                   </div>

                   <div className="section-total">
                     <span>TOTAL HORAS EXTRA ({totalHorasExtra}h)</span>
                     <span className="amount">{formatReportCurrency(totalValorHorasExtra)}</span>
                   </div>
                 </div>
               )}

               <div className="detail-section deductions ded">
                <div className="section-title ded" style={{ color: 'var(--danger-color)' }}>
                  <i className="fa-solid fa-circle-minus"></i> Deducciones
                </div>

                <div className="concept-list">
                  {deductions.length > 0 ? deductions.map((item, idx) => (
                    <div className="concept-item" key={idx}>
                      <div className="concept-name">
                        <h4>{item.concepto}</h4>
                      </div>
                      <div className="concept-amount">{formatReportCurrency(item.valor)}</div>
                    </div>
                  )) : (
                    <div className="concept-item">
                      <div className="concept-name">
                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin deducciones registradas</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="section-total">
                  <span>TOTAL RETENCIONES</span>
                  <span className="amount">{formatReportCurrency(totalDeducciones)}</span>
                </div>
              </div>
            </div>

            <div className="detail-footer">
              <div className="accumulated-info">
                <div className="acc-box">
                  <p>ACUMULADO BRUTO ANUAL</p>
                  <h4>{formatReportCurrency(totalDevengado)}</h4>
                </div>
                <div className="acc-box">
                  <p>RETENCIÓN YTD</p>
                  <h4>{formatReportCurrency(totalDeducciones)}</h4>
                </div>
              </div>

              <div className="net-total">
                <p>NETO A RECIBIR</p>
                <h2>{report.amount}</h2>
              </div>
            </div>
          </>
        )}

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
