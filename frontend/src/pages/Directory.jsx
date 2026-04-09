import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { OVERTIME_TYPES, ROWS_PER_PAGE } from '../utils/payroll/constants'
import {
  buildOvertimeRow,
  buildPayrollPayload,
  calculatePayrollSummary
} from '../utils/payroll/calculations'
import {
  formatPesoColombiano,
  getDefaultPayrollPeriod
} from '../utils/payroll/formatters'
import '../styles/Directory.css'

export const Directory = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [savingPayroll, setSavingPayroll] = useState(false)
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' })
  const [payrollDates, setPayrollDates] = useState(getDefaultPayrollPeriod())
  const [overtimeRows, setOvertimeRows] = useState([buildOvertimeRow()])
  const [payrollNovelties, setPayrollNovelties] = useState([])
  const [payrollNoveltiesSummary, setPayrollNoveltiesSummary] = useState({
    totalNovedades: 0,
    totalDevengado: 0,
    totalDeducciones: 0,
    totalImpactoNeto: 0
  })
  const [loadingPayrollNovelties, setLoadingPayrollNovelties] = useState(false)
  const [payrollNoveltiesError, setPayrollNoveltiesError] = useState('')

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const response = await api.get('/employees?limit=1000&page=1')
        setEmployees(response.data?.data || [])
        setError('')
      } catch (err) {
        console.error('Error cargando empleados para nómina:', err)
        setEmployees([])
        setError('No se pudo cargar la información de empleados')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return employees

    return employees.filter((emp) => {
      const fullName = `${emp.nombres || ''} ${emp.apellidos || ''}`.toLowerCase()
      const identification = `${emp.tipo_identificacion || ''} ${emp.numero_identificacion || ''}`.toLowerCase()
      const cargo = (emp.nombre_cargo || '').toLowerCase()
      const departamento = (emp.nombre_departamento || '').toLowerCase()

      return (
        fullName.includes(term) ||
        identification.includes(term) ||
        cargo.includes(term) ||
        departamento.includes(term)
      )
    })
  }, [employees, searchTerm])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const totalItems = filteredEmployees.length
  const totalPages = Math.ceil(totalItems / ROWS_PER_PAGE) || 1
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * ROWS_PER_PAGE
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems)
  const currentRows = useMemo(
    () => filteredEmployees.slice(startIndex, endIndex),
    [filteredEmployees, startIndex, endIndex]
  )

  const payrollSummary = useMemo(() => (
    calculatePayrollSummary({
      selectedEmployee,
      payrollDates,
      overtimeRows
    })
  ), [selectedEmployee, payrollDates, overtimeRows])

  const estimatedGross = payrollSummary.subtotalBruto + (Number(payrollNoveltiesSummary.totalDevengado) || 0)
  const estimatedDeductions = payrollSummary.totalDeducciones + (Number(payrollNoveltiesSummary.totalDeducciones) || 0)
  const estimatedNet = estimatedGross - estimatedDeductions

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)))

  const paginationNumbers = useMemo(() => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (safePage > 3) pages.push(1, '...')
      for (let i = Math.max(1, safePage - 1); i <= Math.min(totalPages, safePage + 1); i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('...', totalPages)
    }
    return pages
  }, [safePage, totalPages])

  const openEmployeeModal = (emp) => {
    setSelectedEmployee(emp)
    setPayrollDates(getDefaultPayrollPeriod())
    setOvertimeRows([buildOvertimeRow()])
    setPayrollNovelties([])
    setPayrollNoveltiesSummary({
      totalNovedades: 0,
      totalDevengado: 0,
      totalDeducciones: 0,
      totalImpactoNeto: 0
    })
    setPayrollNoveltiesError('')
    setModalMessage({ type: '', text: '' })
    setShowModal(true)
  }

  const closeEmployeeModal = () => {
    setSelectedEmployee(null)
    setModalMessage({ type: '', text: '' })
    setPayrollNovelties([])
    setPayrollNoveltiesError('')
    setShowModal(false)
  }

  const updatePayrollDate = (field, value) => {
    setPayrollDates((prev) => ({ ...prev, [field]: value }))
  }

  const addOvertimeRow = () => {
    setOvertimeRows((prev) => [...prev, buildOvertimeRow()])
  }

  const removeOvertimeRow = (rowId) => {
    setOvertimeRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId)))
  }

  const updateOvertimeRow = (rowId, field, value) => {
    setOvertimeRows((prev) => prev.map((row) => (
      row.id === rowId
        ? {
            ...row,
            [field]: field === 'hours' ? Math.max(0, Number(value) || 0) : value
          }
        : row
    )))
  }

  // Consulta las solicitudes aprobadas que impactan el periodo seleccionado.
  // Esto permite mostrar al usuario el efecto antes de guardar la nomina.
  useEffect(() => {
    const fetchPayrollNovelties = async () => {
      if (!showModal || !selectedEmployee?.id_empleado || !payrollDates.startDate || !payrollDates.endDate) {
        return
      }

      try {
        setLoadingPayrollNovelties(true)
        setPayrollNoveltiesError('')

        const response = await api.get('/nomina/novedades', {
          params: {
            id_empleado: selectedEmployee.id_empleado,
            fecha_inicio: payrollDates.startDate,
            fecha_corte: payrollDates.endDate
          }
        })

        setPayrollNovelties(response.data?.data?.novedades || [])
        setPayrollNoveltiesSummary(response.data?.data?.resumen || {
          totalNovedades: 0,
          totalDevengado: 0,
          totalDeducciones: 0,
          totalImpactoNeto: 0
        })
      } catch (requestError) {
        setPayrollNovelties([])
        setPayrollNoveltiesSummary({
          totalNovedades: 0,
          totalDevengado: 0,
          totalDeducciones: 0,
          totalImpactoNeto: 0
        })
        setPayrollNoveltiesError(requestError.response?.data?.message || 'No se pudieron cargar las novedades del periodo.')
      } finally {
        setLoadingPayrollNovelties(false)
      }
    }

    fetchPayrollNovelties()
  }, [showModal, selectedEmployee?.id_empleado, payrollDates.startDate, payrollDates.endDate])

  const savePayroll = async () => {
    if (!selectedEmployee) return

    if (!payrollDates.startDate || !payrollDates.endDate || payrollSummary.diasTrabajados <= 0) {
      setModalMessage({ type: 'error', text: 'Debes seleccionar un rango de fechas válido.' })
      return
    }

    try {
      setSavingPayroll(true)
      setModalMessage({ type: '', text: '' })

      const payload = buildPayrollPayload({
        selectedEmployee,
        payrollDates,
        payrollSummary
      })

      await api.post('/nomina', payload)

      setModalMessage({ type: 'success', text: 'Nómina guardada exitosamente.' })
      setTimeout(() => {
        closeEmployeeModal()
      }, 700)
    } catch (requestError) {
      setModalMessage({
        type: 'error',
        text: requestError.response?.data?.message || 'No se pudo guardar la nómina.'
      })
    } finally {
      setSavingPayroll(false)
    }
  }

  return (
    <>
      <Navbar />

      <div className="directory-container">
        <h1>Directorio de Empleados</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, identificación, cargo o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-gray-light" type="button">
            <i className="fa-solid fa-magnifying-glass"></i> Buscar
          </button>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="btn btn-secondary" type="button">
              <i className="fa-solid fa-trash"></i> Limpiar
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Identificación</th>
                    <th>Cargo</th>
                    <th>Departamento</th>
                    <th>Sueldo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center' }}>
                        No hay empleados para mostrar
                      </td>
                    </tr>
                  ) : (
                    currentRows.map((emp) => (
                      <tr key={emp.id_empleado}>
                        <td>{emp.id_empleado}</td>
                        <td>{emp.nombres} {emp.apellidos}</td>
                        <td>{emp.tipo_identificacion} - {emp.numero_identificacion}</td>
                        <td>{emp.nombre_cargo || 'Sin cargo'}</td>
                        <td>{emp.nombre_departamento || 'Sin departamento'}</td>
                        <td>{formatPesoColombiano(emp.sueldo)}</td>
                        <td>Activo</td>
                        <td>
                          <div className="action-buttons action-buttons--menu">
                            <button
                              type="button"
                              className="btn-action"
                              title="Ejecutar nómina"
                              aria-label="Ejecutar nómina"
                              onClick={() => openEmployeeModal(emp)}
                            >
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="directory-pagination">
              <div className="directory-pagination__rows">
                <span>Filas por página: {ROWS_PER_PAGE}</span>
              </div>
              <div className="directory-pagination__info">
                {totalItems === 0 ? 'Mostrando 0-0 de 0' : `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems}`}
              </div>
              <div className="directory-pagination__controls">
                <button type="button" className="directory-pagination__btn" onClick={() => goToPage(1)} disabled={safePage === 1} aria-label="Primera página">
                  <i className="fa-solid fa-angles-left"></i>
                </button>
                <button type="button" className="directory-pagination__btn" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} aria-label="Página anterior">
                  <i className="fa-solid fa-angle-left"></i>
                </button>
                <div className="directory-pagination__numbers">
                  {paginationNumbers.map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="directory-pagination__ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`directory-pagination__btn directory-pagination__btn--number ${safePage === p ? 'directory-pagination__btn--active' : ''}`}
                        onClick={() => goToPage(p)}
                        aria-label={`Página ${p}`}
                        aria-current={safePage === p ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button type="button" className="directory-pagination__btn" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} aria-label="Página siguiente">
                  <i className="fa-solid fa-angle-right"></i>
                </button>
                <button type="button" className="directory-pagination__btn" onClick={() => goToPage(totalPages)} disabled={safePage === totalPages} aria-label="Última página">
                  <i className="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={closeEmployeeModal}>
          <div className="modal-content payroll-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payroll-modal-header">
              <div className="payroll-header-left">
                <div className="employee-avatar">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <h2>Ejecutar Nómina</h2>
                  <p className="employee-subtitle">
                    Procesando pago para <span className="employee-name-highlight">{selectedEmployee.nombres} {selectedEmployee.apellidos}</span> (EMP-{String(selectedEmployee.id_empleado).padStart(4, '0')})
                  </p>
                </div>
              </div>
              <button onClick={closeEmployeeModal} className="close-btn" aria-label="Cerrar modal">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="payroll-modal-body">
              <div className="payroll-section">
                <h3 className="section-title">INFORMACIÓN DEL EMPLEADO</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Empleado</label>
                    <input type="text" value={`${selectedEmployee.nombres} ${selectedEmployee.apellidos}`} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Identificación</label>
                    <input type="text" value={`${selectedEmployee.tipo_identificacion} - ${selectedEmployee.numero_identificacion}`} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Sueldo Base</label>
                    <input type="text" value={formatPesoColombiano(selectedEmployee.sueldo)} readOnly />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cargo</label>
                    <input type="text" value={selectedEmployee.nombre_cargo || 'Sin cargo'} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Departamento</label>
                    <input type="text" value={selectedEmployee.nombre_departamento || 'Sin departamento'} readOnly />
                  </div>
                </div>
              </div>

              <div className="payroll-section">
                <h3 className="section-title">PERÍODO DE TRABAJO Y ASISTENCIA</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha Inicio</label>
                    <div className="input-with-icon">
                      <input
                        type="date"
                        value={payrollDates.startDate}
                        onChange={(e) => updatePayrollDate('startDate', e.target.value)}
                      />
                      <i className="fa-solid fa-calendar"></i>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Fecha Fin</label>
                    <div className="input-with-icon">
                      <input
                        type="date"
                        value={payrollDates.endDate}
                        onChange={(e) => updatePayrollDate('endDate', e.target.value)}
                      />
                      <i className="fa-solid fa-calendar"></i>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Días Trabajados</label>
                    <input type="number" value={payrollSummary.diasTrabajados} readOnly />
                  </div>
                </div>
              </div>

              <div className="payroll-section">
                <div className="section-header-with-action">
                  <h3 className="section-title">COMPENSACIÓN POR HORAS EXTRA</h3>
                  <button type="button" className="btn-add-entry" onClick={addOvertimeRow}>+ Agregar Entrada</button>
                </div>
                <div className="overtime-table">
                  <div className="overtime-table-header">
                    <div className="overtime-col-type">Tipo de Hora Extra</div>
                    <div className="overtime-col-hours">Horas</div>
                    <div className="overtime-col-rate">Tasa ($/hr)</div>
                    <div className="overtime-col-actions"></div>
                  </div>
                  {payrollSummary.detallesHorasExtra.map((row) => (
                    <div className="overtime-table-row" key={row.id}>
                      <div className="overtime-col-type">
                        <select
                          value={row.typeKey}
                          onChange={(e) => updateOvertimeRow(row.id, 'typeKey', e.target.value)}
                        >
                          {OVERTIME_TYPES.map((type) => (
                            <option value={type.key} key={type.key}>
                              {type.label} (+{Math.round(type.surcharge * 100)}%)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="overtime-col-hours">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.hours}
                          onChange={(e) => updateOvertimeRow(row.id, 'hours', e.target.value)}
                        />
                      </div>
                      <div className="overtime-col-rate">
                        <input type="text" value={formatPesoColombiano(row.valorHoraExtra)} readOnly />
                      </div>
                      <div className="overtime-col-actions">
                        <button type="button" className="btn-delete-entry" onClick={() => removeOvertimeRow(row.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="payroll-section">
                <h3 className="section-title">DEDUCCIONES OBLIGATORIAS Y OTRAS</h3>
                <div className="deductions-grid">
                  <div className="deduction-box">
                    <div className="deduction-label">Pensión Porcentaje</div>
                    <div className="deduction-value">4% ({formatPesoColombiano(payrollSummary.pension)})</div>
                  </div>
                  <div className="deduction-box">
                    <div className="deduction-label">Porcentaje a Salud</div>
                    <div className="deduction-value">4% ({formatPesoColombiano(payrollSummary.salud)})</div>
                  </div>
                  <div className="deduction-box">
                    <div className="deduction-label">Neto Pago</div>
                    <div className="deduction-value">{formatPesoColombiano(payrollSummary.neto)}</div>
                  </div>
                </div>
              </div>

              <div className="payroll-section">
                <div className="section-header-with-action">
                  <h3 className="section-title">NOVEDADES DEL PERIODO</h3>
                  <span className="payroll-novelties-badge">
                    {loadingPayrollNovelties ? 'Cargando...' : `${payrollNoveltiesSummary.totalNovedades || 0} registradas`}
                  </span>
                </div>

                {payrollNoveltiesError && (
                  <div className="payroll-inline-message payroll-inline-message--error">
                    {payrollNoveltiesError}
                  </div>
                )}

                {!payrollNoveltiesError && loadingPayrollNovelties && (
                  <div className="payroll-inline-message">
                    Consultando permisos, incapacidades, licencias y vacaciones aprobadas...
                  </div>
                )}

                {!payrollNoveltiesError && !loadingPayrollNovelties && payrollNovelties.length === 0 && (
                  <div className="payroll-inline-message">
                    No hay novedades aprobadas que afecten este periodo.
                  </div>
                )}

                {!payrollNoveltiesError && payrollNovelties.length > 0 && (
                  <>
                    <div className="payroll-novelties-list">
                      {payrollNovelties.map((novelty) => (
                        <div className="payroll-novelty-card" key={novelty.id_solicitud}>
                          <div>
                            <strong>{novelty.concepto}</strong>
                            <p>
                              {novelty.tipo} {novelty.sub_tipo ? `· ${novelty.sub_tipo}` : ''} · {novelty.cantidad} {novelty.unidad.toLowerCase()}
                            </p>
                          </div>
                          <span className={`payroll-novelty-value payroll-novelty-value--${novelty.categoria.toLowerCase()}`}>
                            {novelty.categoria === 'DEDUCCION' ? '- ' : novelty.categoria === 'DEVENGADO' ? '+ ' : ''}
                            {formatPesoColombiano(novelty.valor)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="deductions-grid payroll-novelties-summary-grid">
                      <div className="deduction-box">
                        <div className="deduction-label">Devengado por novedades</div>
                        <div className="deduction-value">{formatPesoColombiano(payrollNoveltiesSummary.totalDevengado)}</div>
                      </div>
                      <div className="deduction-box">
                        <div className="deduction-label">Deduccion por novedades</div>
                        <div className="deduction-value">- {formatPesoColombiano(payrollNoveltiesSummary.totalDeducciones)}</div>
                      </div>
                      <div className="deduction-box">
                        <div className="deduction-label">Impacto neto</div>
                        <div className="deduction-value">{formatPesoColombiano(payrollNoveltiesSummary.totalImpactoNeto)}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="payroll-modal-footer">
              {modalMessage.text && (
                <div className={`payroll-save-message payroll-save-message--${modalMessage.type || 'info'}`}>
                  {modalMessage.text}
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">Pago Base por Días:</span>
                <span className="summary-value">{formatPesoColombiano(payrollSummary.pagoBasicoPeriodo)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Total Horas Extra:</span>
                <span className="summary-value">{formatPesoColombiano(payrollSummary.totalHorasExtra)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Subsidio Transporte:</span>
                <span className="summary-value">{formatPesoColombiano(payrollSummary.subsidioTransporte)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Subtotal Bruto:</span>
                <span className="summary-value">{formatPesoColombiano(payrollSummary.subtotalBruto)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Devengado por novedades:</span>
                <span className="summary-value">{formatPesoColombiano(payrollNoveltiesSummary.totalDevengado)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Total Deducciones:</span>
                <span className="summary-value summary-deductions">- {formatPesoColombiano(payrollSummary.totalDeducciones)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Deducciones por novedades:</span>
                <span className="summary-value summary-deductions">- {formatPesoColombiano(payrollNoveltiesSummary.totalDeducciones)}</span>
              </div>
              <div className="summary-row summary-net">
                <span className="summary-label">Pago Neto Estimado:</span>
                <span className="summary-value summary-net-value">{formatPesoColombiano(estimatedNet)}</span>
              </div>

              <div className="payroll-footer-actions">
                <button type="button" className="payroll-btn payroll-btn--secondary" onClick={closeEmployeeModal} disabled={savingPayroll}>
                  Cancelar
                </button>
                <button type="button" className="payroll-btn payroll-btn--primary" onClick={savePayroll} disabled={savingPayroll}>
                  {savingPayroll ? 'Guardando...' : 'Guardar nómina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
