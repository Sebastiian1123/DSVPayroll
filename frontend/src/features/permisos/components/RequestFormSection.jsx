import { getToday } from '../utils/requestHelpers';
import { ORIGIN_OPTIONS, YES_NO_OPTIONS } from '../utils/requestTypeOptions';

const RequestFormSection = ({
  selectedOption,
  formData,
  supportFile,
  submitting,
  hasEmployee,
  canManagePayrollFields,
  onSubmit,
  onChange,
  onSupportFileChange
}) => (
  <section className="permisos-panel">
    <div className="permisos-panel-header">
      <h2>Nueva solicitud de {selectedOption.label.toLowerCase()}</h2>
      <p>{selectedOption.helperText}</p>
    </div>

    <form className="permisos-form" onSubmit={onSubmit}>
      <div className="permisos-form-row">
        <div className="permisos-form-group">
          <label htmlFor="fecha_inicio">Fecha inicio</label>
          <input
            id="fecha_inicio"
            type="date"
            name="fecha_inicio"
            min={getToday()}
            value={formData.fecha_inicio}
            onChange={onChange}
            required
          />
        </div>

        <div className="permisos-form-group">
          <label htmlFor="fecha_fin">Fecha fin</label>
          <input
            id="fecha_fin"
            type="date"
            name="fecha_fin"
            min={formData.fecha_inicio || getToday()}
            value={formData.fecha_fin}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="permisos-form-group">
        <label htmlFor="sub_tipo">{selectedOption.subtypeLabel}</label>
        {selectedOption.subtypeOptions.length > 0 ? (
          <select id="sub_tipo" name="sub_tipo" value={formData.sub_tipo} onChange={onChange}>
            <option value="">{selectedOption.subtypePlaceholder}</option>
            {selectedOption.subtypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="sub_tipo"
            type="text"
            name="sub_tipo"
            value={formData.sub_tipo}
            onChange={onChange}
            placeholder={selectedOption.subtypePlaceholder}
            maxLength={50}
          />
        )}
      </div>

      {selectedOption.payrollConfig?.showRemunerationToggle && canManagePayrollFields && (
        <div className="permisos-form-row">
          <div className="permisos-form-group">
            <label htmlFor="es_remunerado">Se paga en nomina</label>
            <select id="es_remunerado" name="es_remunerado" value={formData.es_remunerado} onChange={onChange}>
              {YES_NO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="permisos-field-help">
              {selectedOption.payrollConfig.remunerationHelpText}
            </span>
          </div>

          <div className="permisos-form-group">
            <label htmlFor="porcentaje_pago">Porcentaje de pago</label>
            <input
              id="porcentaje_pago"
              type="number"
              name="porcentaje_pago"
              value={formData.porcentaje_pago}
              onChange={onChange}
              min="0"
              max="100"
              step="0.01"
              required
            />
            <span className="permisos-field-help">
              {selectedOption.payrollConfig.percentageHelpText}
            </span>
          </div>
        </div>
      )}

      {selectedOption.payrollConfig?.showOriginField && canManagePayrollFields && (
        <div className="permisos-form-row">
          <div className="permisos-form-group">
            <label htmlFor="origen_novedad">Origen para nomina</label>
            <select id="origen_novedad" name="origen_novedad" value={formData.origen_novedad} onChange={onChange}>
              {ORIGIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="permisos-field-help">
              {selectedOption.payrollConfig.remunerationHelpText}
            </span>
          </div>

          <div className="permisos-form-group">
            <label htmlFor="porcentaje_pago">Porcentaje reconocido</label>
            <input
              id="porcentaje_pago"
              type="number"
              name="porcentaje_pago"
              value={formData.porcentaje_pago}
              onChange={onChange}
              min="0"
              max="100"
              step="0.01"
              required
            />
            <span className="permisos-field-help">
              {selectedOption.payrollConfig.percentageHelpText}
            </span>
          </div>
        </div>
      )}

      {selectedOption.payrollConfig?.showHoursField && (
        <div className="permisos-form-group">
          <label htmlFor="horas_solicitadas">Horas solicitadas</label>
          <input
            id="horas_solicitadas"
            type="number"
            name="horas_solicitadas"
            value={formData.horas_solicitadas}
            onChange={onChange}
            min="0"
            step="0.5"
            placeholder="Opcional si el permiso solo cubre unas horas"
          />
          <span className="permisos-field-help">
            Si dejas este campo vacio, el sistema asumira que el permiso cubre dias completos.
          </span>
        </div>
      )}

      <div className="permisos-form-group">
        <label htmlFor="comentario_empleado">{selectedOption.commentLabel}</label>
        <textarea
          id="comentario_empleado"
          name="comentario_empleado"
          value={formData.comentario_empleado}
          onChange={onChange}
          rows={4}
          placeholder={selectedOption.commentPlaceholder}
        />
      </div>

      <div className="permisos-form-group">
        <label htmlFor="documento_soporte">Soporte</label>
        <input id="documento_soporte" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onSupportFileChange} />
        {supportFile && (
          <div className="permisos-selected-file">
            <strong>Archivo seleccionado:</strong> {supportFile.name}
          </div>
        )}
        <span className="permisos-field-help">
          Formatos permitidos: PDF, PNG y JPG. Tamano maximo: 5 MB.
        </span>
      </div>

      <button type="submit" className="permisos-submit-btn" disabled={submitting || !hasEmployee}>
        {submitting ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  </section>
);

export default RequestFormSection;


