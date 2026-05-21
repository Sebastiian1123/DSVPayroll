import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import prestacionesService from '../services/prestacionesService'
import '../styles/Nomina.css'
import '../styles/Prestaciones.css'
import { showSuccess, showError } from '../utils/alerts.js'

const formatPeso = (value) => {
  const num = Number(value)
  if (isNaN(num)) return '–'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

const Prestaciones = () => {
  const { isAdmin } = useAuth()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acumulando, setAcumulando] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await prestacionesService.getPrestacionesResumen({ anio: selectedYear })
        setEmpleados(Array.isArray(data.empleados) ? data.empleados : [])
      } catch (e) {
        showError('No se pudieron cargar las prestaciones', e)
        setError('No se pudieron cargar las prestaciones')
        setEmpleados([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  const handleAcumularMasivo = async () => {
    setAcumulando(true)
    try {
      const now = new Date()
      const result = await prestacionesService.acumularPrestacionesMasivo({
        anio: selectedYear,
        mes: now.getMonth() + 1
      })
      showSuccess(result.message || 'Prestaciones acumuladas')
      const data = await prestacionesService.getPrestacionesResumen({ anio: selectedYear })
      setEmpleados(Array.isArray(data.empleados) ? data.empleados : [])
    } catch (e) {
      showError('Error acumulando prestaciones', e)
    } finally {
      setAcumulando(false)
    }
  }

  const years = []
  for (let y = currentYear - 3; y <= currentYear + 1; y++) years.push(y)

  return (
    <div className="prestaciones-page">
      <Navbar />
      <div className="nomina-container">
        <div className="prestaciones-header">
          <div>
            <h1>Prestaciones Sociales</h1>
            <p>Consulta y acumulación de prima, cesantías, intereses y vacaciones</p>
          </div>
          <div className="prestaciones-header-actions">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="prestaciones-year-select">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {isAdmin() && (
              <button onClick={handleAcumularMasivo} disabled={acumulando} className="prestaciones-btn-acumular">
                {acumulando ? 'Acumulando...' : 'Acumular Mes Actual'}
              </button>
            )}
          </div>
        </div>

        {error && <p className="prestaciones-error">{error}</p>}
        {loading && <p className="prestaciones-loading">Cargando...</p>}

        {!loading && empleados.length === 0 && !error && (
          <p className="prestaciones-empty">
            No hay datos de prestaciones para {selectedYear}. Usa "Acumular Mes Actual" para generar.
          </p>
        )}

        {empleados.map((emp) => (
          <div key={emp.id_empleado} className="prestaciones-employee-card">
            <div className="prestaciones-employee-header">
              <h3 className="prestaciones-employee-name">{emp.empleado}</h3>
              <span className="prestaciones-employee-salary">Salario: {formatPeso(emp.salario_actual)}</span>
            </div>

            <div className="prestaciones-summary-grid">
              <div className="prestaciones-summary-card prestaciones-summary-card--prima">
                <div className="prestaciones-summary-label">Prima</div>
                <div className="prestaciones-summary-value prestaciones-summary-value--prima">{formatPeso(emp.totales.prima)}</div>
              </div>
              <div className="prestaciones-summary-card prestaciones-summary-card--cesantias">
                <div className="prestaciones-summary-label">Cesantías</div>
                <div className="prestaciones-summary-value prestaciones-summary-value--cesantias">{formatPeso(emp.totales.cesantias)}</div>
              </div>
              <div className="prestaciones-summary-card prestaciones-summary-card--intereses">
                <div className="prestaciones-summary-label">Intereses Cesantías</div>
                <div className="prestaciones-summary-value prestaciones-summary-value--intereses">{formatPeso(emp.totales.intereses)}</div>
              </div>
              <div className="prestaciones-summary-card prestaciones-summary-card--vacaciones">
                <div className="prestaciones-summary-label">Vacaciones</div>
                <div className="prestaciones-summary-value prestaciones-summary-value--vacaciones">{formatPeso(emp.totales.vacaciones)}</div>
              </div>
            </div>

            <table className="prestaciones-detail-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="prestaciones-cell-right">Salario Base</th>
                  <th className="prestaciones-cell-right">Días Acum.</th>
                  <th className="prestaciones-cell-right">Prima</th>
                  <th className="prestaciones-cell-right">Cesantías</th>
                  <th className="prestaciones-cell-right">Intereses</th>
                  <th className="prestaciones-cell-right">Vacaciones</th>
                </tr>
              </thead>
              <tbody>
                {emp.meses.map((m) => (
                  <tr key={m.id_prestacion}>
                    <td className="prestaciones-month-cell">{String(m.mes).padStart(2, '0')}</td>
                    <td className="prestaciones-cell-right">{formatPeso(m.salario_base)}</td>
                    <td className="prestaciones-cell-right">{m.dias_acumulados}</td>
                    <td className="prestaciones-cell-right">{formatPeso(m.prima_servicios)}</td>
                    <td className="prestaciones-cell-right">{formatPeso(m.cesantias)}</td>
                    <td className="prestaciones-cell-right">{formatPeso(m.intereses_cesantias)}</td>
                    <td className="prestaciones-cell-right">{formatPeso(m.vacaciones)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Prestaciones
