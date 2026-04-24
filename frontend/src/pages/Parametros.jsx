import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getPayrollParameters, updatePayrollParameters } from '../services/payrollService';
import '../styles/Parametros.css';

const INITIAL_FORM = {
  heo: '25%',
  hen: '75%',
  hef: '100%',
  hefn: '150%',
  subsidioTransporte: '140606',
  horasSemanales: '47',
  saludEmpleado: '4.0',
  saludEmpresa: '8.5',
  pensionEmpleado: '4.0',
  pensionEmpresa: '12.0',
  arlEmpresa: '0.522',
};

const parseRate = (value) => {
  const cleaned = String(value).replace('%', '').trim();
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseHours = (value) => {
  const cleaned = String(value).replace(',', '.').trim();
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getPercentageError = (value) => {
  if (!String(value).trim().includes('%')) {
    return 'Falta simbolo de porcentaje (%)';
  }

  return '';
};

export const Parametros = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({
    tone: 'info',
    title: 'Cargando parametrizacion',
    message: 'Estamos consultando los parametros vigentes de nomina.',
  });

  const percentageErrors = useMemo(
    () => ({
      heo: getPercentageError(form.heo),
      hen: getPercentageError(form.hen),
      hef: getPercentageError(form.hef),
      hefn: getPercentageError(form.hefn),
    }),
    [form]
  );

  const totals = useMemo(
    () => ({
      salud: parseRate(form.saludEmpleado) + parseRate(form.saludEmpresa),
      pension: parseRate(form.pensionEmpleado) + parseRate(form.pensionEmpresa),
      arl: parseRate(form.arlEmpresa),
    }),
    [form]
  );

  const workingHoursSummary = useMemo(() => {
    const semanales = parseHours(form.horasSemanales);

    if (!semanales) {
      return 'Ingresa las horas semanales para calcular automaticamente la equivalencia quincenal y mensual.';
    }

    return `Con ${semanales.toFixed(1)} horas semanales, la jornada equivale a ${(semanales * 2).toFixed(1)} horas quincenales y ${(semanales * 4).toFixed(1)} horas mensuales.`;
  }, [form.horasSemanales]);

  const derivedWorkingHours = useMemo(() => {
    const semanales = parseHours(form.horasSemanales);

    return {
      quincenales: semanales ? (semanales * 2).toFixed(1) : '',
      mensuales: semanales ? (semanales * 4).toFixed(1) : '',
    };
  }, [form.horasSemanales]);

  const hasValidationErrors = Object.values(percentageErrors).some(Boolean);

  useEffect(() => {
    const loadParameters = async () => {
      try {
        const data = await getPayrollParameters();

        if (data) {
          setForm((current) => ({
            ...current,
            ...data,
          }));
        }

        setFeedback({
          tone: 'success',
          title: 'Parametros cargados',
          message: 'Se cargaron los parametros vigentes de nomina desde la base de datos.',
        });
      } catch (error) {
        setFeedback({
          tone: 'warning',
          title: 'No fue posible cargar',
          message:
            error.response?.data?.message ||
            'Usando valores locales mientras se restablece la conexion con el backend.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadParameters();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFeedback({
      tone: 'info',
      title: 'Valores restablecidos',
      message: 'Se restablecieron los valores base sugeridos para la parametrizacion.',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (hasValidationErrors) {
      setFeedback({
        tone: 'warning',
        title: 'Revision pendiente',
        message: 'Revisa los campos marcados antes de guardar los cambios.',
      });
      return;
    }

    try {
      setSaving(true);

      const savedParameters = await updatePayrollParameters({
        heo: form.heo,
        hen: form.hen,
        hef: form.hef,
        hefn: form.hefn,
        subsidioTransporte: form.subsidioTransporte,
        horasSemanales: form.horasSemanales,
        saludEmpleado: form.saludEmpleado,
        saludEmpresa: form.saludEmpresa,
        pensionEmpleado: form.pensionEmpleado,
        pensionEmpresa: form.pensionEmpresa,
        arlEmpresa: form.arlEmpresa,
      });

      if (savedParameters) {
        setForm((current) => ({
          ...current,
          ...savedParameters,
        }));
      }

      setFeedback({
        tone: 'success',
        title: 'Cambios guardados con exito',
        message:
          'Los cambios fueron guardados correctamente en la base de datos y quedan listos para la siguiente liquidacion.',
      });
    } catch (error) {
      setFeedback({
        tone: 'warning',
        title: 'No se pudo guardar',
        message:
          error.response?.data?.message ||
          'Ocurrio un error guardando la parametrizacion en la base de datos.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="parametros-page">
        <div className="parametros-breadcrumb">
          <span>Configuracion</span>
          <i className="fa-solid fa-angle-right"></i>
          <span className="active">Parametrizacion de Nomina</span>
        </div>

        <div className={`parametros-alert parametros-alert-${feedback.tone}`}>
          <div className="parametros-alert-icon">
            <i
              className={`fa-solid ${
                feedback.tone === 'warning'
                  ? 'fa-triangle-exclamation'
                  : feedback.tone === 'info'
                    ? 'fa-rotate-left'
                    : 'fa-circle-check'
              }`}
            ></i>
          </div>
          <div className="parametros-alert-content">
            <strong>{feedback.title}</strong>
            <p>{feedback.message}</p>
          </div>
          <button
            type="button"
            className="parametros-alert-close"
            onClick={() =>
              setFeedback({
                tone: 'info',
                title: 'Edicion en curso',
                message: 'Puedes seguir ajustando los parametros antes de guardar nuevamente.',
              })
            }
            aria-label="Cerrar mensaje"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form className="parametros-shell" onSubmit={handleSubmit}>
          <div className="parametros-header">
            <div>
              <h1>Parametrizacion de Nomina</h1>
              <p>
                Define los valores base, porcentajes de ley y reglas de calculo que rigen la
                operacion financiera de su organizacion.
              </p>
            </div>

            <div className="parametros-actions">
              <button type="button" className="parametros-btn parametros-btn-secondary" onClick={handleReset}>
                Restablecer Valores
              </button>
              <button type="submit" className="parametros-btn parametros-btn-primary" disabled={saving || loading}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          <div className={`parametros-body ${loading ? 'is-loading' : ''}`}>
            <div className="parametros-grid">
              <section className="parametros-card parametros-card-wide">
                <div className="parametros-card-header">
                  <div className="parametros-card-icon blue">
                    <i className="fa-regular fa-clock"></i>
                  </div>
                  <h2>Porcentaje Horas Extras</h2>
                </div>

                <div className="parametros-form-grid">
                  <label className="parametros-field">
                    <span>Hora Extra Ordinaria (HEO)</span>
                    <input
                      type="text"
                      name="heo"
                      value={form.heo}
                      onChange={handleChange}
                      className={percentageErrors.heo ? 'has-error' : ''}
                      disabled={loading}
                    />
                    <small className={percentageErrors.heo ? 'error-text' : ''}>
                      {percentageErrors.heo || 'Porcentaje aplicado sobre la hora ordinaria.'}
                    </small>
                  </label>

                  <label className="parametros-field">
                    <span>Hora Extra Nocturna (HEN)</span>
                    <input
                      type="text"
                      name="hen"
                      value={form.hen}
                      onChange={handleChange}
                      className={percentageErrors.hen ? 'has-error' : ''}
                      disabled={loading}
                    />
                    <small className={percentageErrors.hen ? 'error-text' : ''}>
                      {percentageErrors.hen || 'Recargo vigente para jornada nocturna.'}
                    </small>
                  </label>

                  <label className="parametros-field">
                    <span>Hora Extra Festiva (HEF)</span>
                    <input
                      type="text"
                      name="hef"
                      value={form.hef}
                      onChange={handleChange}
                      className={percentageErrors.hef ? 'has-error' : ''}
                      disabled={loading}
                    />
                    <small className={percentageErrors.hef ? 'error-text' : ''}>
                      {percentageErrors.hef || 'Incluye valor adicional por dia festivo.'}
                    </small>
                  </label>

                  <label className="parametros-field">
                    <span>Hora Extra Festiva Nocturna (HEFN)</span>
                    <input
                      type="text"
                      name="hefn"
                      value={form.hefn}
                      onChange={handleChange}
                      className={percentageErrors.hefn ? 'has-error' : ''}
                      disabled={loading}
                    />
                    <small className={percentageErrors.hefn ? 'error-text' : ''}>
                      {percentageErrors.hefn || 'Debe incluir el simbolo de porcentaje.'}
                    </small>
                  </label>
                </div>
              </section>

              <section className="parametros-card parametros-card-side">
                <div className="parametros-card-header">
                  <div className="parametros-card-icon indigo">
                    <i className="fa-solid fa-bus"></i>
                  </div>
                  <h2>Subsidio de Transporte</h2>
                </div>

                <label className="parametros-field">
                  <span>Valor Mensual Legal</span>
                  <input
                    type="text"
                    name="subsidioTransporte"
                    value={form.subsidioTransporte}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <small>{formatCurrency(form.subsidioTransporte)}</small>
                </label>

                <div className="parametros-note">
                  El subsidio de transporte se paga a empleados que devenguen hasta dos (2)
                  Salarios Minimos Mensuales Legales Vigentes.
                </div>
              </section>

              <section className="parametros-card parametros-card-compact">
                <div className="parametros-card-header">
                  <div className="parametros-card-icon dark">
                    <i className="fa-solid fa-business-time"></i>
                  </div>
                  <h2>Horas Laborales</h2>
                </div>

                <div className="parametros-inline-grid">
                  <label className="parametros-field">
                    <span>Horas Semanales</span>
                    <input
                      type="text"
                      name="horasSemanales"
                      value={form.horasSemanales}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </label>

                  <label className="parametros-field">
                    <span>Horas Quincenales</span>
                    <input type="text" value={derivedWorkingHours.quincenales} readOnly disabled={loading} />
                    <small>Calculado automaticamente a partir de las horas semanales.</small>
                  </label>

                  <label className="parametros-field parametros-field-full">
                    <span>Horas Mensuales</span>
                    <input type="text" value={derivedWorkingHours.mensuales} readOnly disabled={loading} />
                    <small>Equivalencia mensual usada como referencia operativa.</small>
                  </label>
                </div>

                <div className="parametros-info">
                  <i className="fa-solid fa-circle-info"></i>
                  <p>{workingHoursSummary}</p>
                </div>
              </section>

              <section className="parametros-card parametros-card-table">
                <div className="parametros-card-header">
                  <div className="parametros-card-icon navy">
                    <i className="fa-solid fa-shield-heart"></i>
                  </div>
                  <h2>Aportes Seguridad Social</h2>
                </div>

                <div className="parametros-table">
                  <div className="parametros-table-header">
                    <span>Concepto</span>
                    <span>Empleado %</span>
                    <span>Empresa %</span>
                    <span>Total</span>
                  </div>

                  <div className="parametros-table-row">
                    <span>Salud</span>
                    <input type="text" name="saludEmpleado" value={form.saludEmpleado} onChange={handleChange} disabled={loading} />
                    <input type="text" name="saludEmpresa" value={form.saludEmpresa} onChange={handleChange} disabled={loading} />
                    <strong>{totals.salud.toFixed(1)}%</strong>
                  </div>

                  <div className="parametros-table-row">
                    <span>Pension</span>
                    <input type="text" name="pensionEmpleado" value={form.pensionEmpleado} onChange={handleChange} disabled={loading} />
                    <input type="text" name="pensionEmpresa" value={form.pensionEmpresa} onChange={handleChange} disabled={loading} />
                    <strong>{totals.pension.toFixed(1)}%</strong>
                  </div>

                  <div className="parametros-table-row">
                    <span>Riesgos (ARL Nivel 1)</span>
                    <span className="parametros-muted">N/A</span>
                    <input type="text" name="arlEmpresa" value={form.arlEmpresa} onChange={handleChange} disabled={loading} />
                    <strong>{totals.arl.toFixed(3)}%</strong>
                  </div>
                </div>
              </section>

              <section className="parametros-highlight">
                <div>
                  <h3>Seguridad y Cumplimiento</h3>
                  <p>
                    Todos los cambios realizados en esta seccion se registran en el historial de
                    auditoria de la empresa. Asegurese de que los porcentajes coincidan con las
                    normativas vigentes emitidas por el Ministerio del Trabajo.
                  </p>
                </div>
                <div className="parametros-highlight-mark">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
