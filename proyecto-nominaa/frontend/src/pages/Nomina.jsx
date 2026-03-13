import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import api from '../services/api'
import '../styles/Nomina.css'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6']

const formatPesoColombiano = (value) => {
  const num = Number(value)
  if (isNaN(num)) return '–'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const getMonthInputValue = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const Nomina = () => {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(getMonthInputValue())
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employees, setEmployees] = useState([])
  const [reportData, setReportData] = useState([])
  const [reportSummary, setReportSummary] = useState({ totalNominas: 0, totalDevengado: 0, totalDeducciones: 0, totalPagado: 0 })
  const [loading, setLoading] = useState(false)

  const [year, month] = selectedMonth.split('-').map(Number)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees?limit=1000&page=1')
        setEmployees(response.data?.data || [])
      } catch (error) {
        console.error('Error cargando empleados para reportes:', error)
      }
    }

    fetchEmployees()
  }, [])

  useEffect(() => {
    const fetchReport = async () => {
      if (!year || !month) return

      try {
        setLoading(true)
        const response = await api.get('/nomina/reportes', {
          params: {
            anio: year,
            mes: month,
            ...(selectedEmployee ? { id_empleado: Number(selectedEmployee) } : {})
          }
        })

        setReportData(response.data?.data?.nominas || [])
        setReportSummary(response.data?.data?.resumen || { totalNominas: 0, totalDevengado: 0, totalDeducciones: 0, totalPagado: 0 })
      } catch (error) {
        console.error('Error cargando reporte de nómina:', error)
        setReportData([])
        setReportSummary({ totalNominas: 0, totalDevengado: 0, totalDeducciones: 0, totalPagado: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [year, month, selectedEmployee])

  const chartData = useMemo(() => {
    const totalsByEmployee = reportData.reduce((acc, row) => {
      const key = row.empleado || `Empleado ${row.id_empleado}`
      acc[key] = (acc[key] || 0) + (Number(row.total_pagar) || 0)
      return acc
    }, {})

    return Object.entries(totalsByEmployee).map(([name, value]) => ({ name, value }))
  }, [reportData])

  const activeEmployees = useMemo(() => new Set(reportData.map((row) => row.id_empleado)).size, [reportData])

  return (
    <>
      <Navbar />
      <div className="nomina-container">
        <div className="nomina-header">
          <div>
            <h1>Reportes de Nómina</h1>
            <p>Bienvenido, <strong>{user?.username}</strong>. Filtra por mes y empleado para ver datos reales generados en nómina.</p>
          </div>
          <div className="nomina-header-actions">
            <input
              className="nomina-filter-input"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <select
              className="nomina-filter-input"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Todos los empleados</option>
              {employees.map((emp) => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
            <Link to="/directory" className="btn-generar-nomina">
              <i className="fa-solid fa-play"></i>
              <span>Generar Nómina</span>
            </Link>
          </div>
        </div>

        <div className="nomina-cards-grid">
          <div className="nomina-card">
            <div className="nomina-card-icon nomina-card-icon--blue"><i className="fa-solid fa-dollar-sign"></i></div>
            <div>
              <p className="nomina-card-label">TOTAL PAGADO</p>
              <p className="nomina-card-value">{formatPesoColombiano(reportSummary.totalPagado)}</p>
            </div>
          </div>
          <div className="nomina-card">
            <div className="nomina-card-icon nomina-card-icon--purple"><i className="fa-solid fa-users"></i></div>
            <div>
              <p className="nomina-card-label">EMPLEADOS LIQUIDADOS</p>
              <p className="nomina-card-value">{activeEmployees}</p>
            </div>
          </div>
          <div className="nomina-card">
            <div className="nomina-card-icon nomina-card-icon--orange"><i className="fa-solid fa-file-invoice-dollar"></i></div>
            <div>
              <p className="nomina-card-label">TOTAL DEVENGADO</p>
              <p className="nomina-card-value">{formatPesoColombiano(reportSummary.totalDevengado)}</p>
            </div>
          </div>
          <div className="nomina-card">
            <div className="nomina-card-icon nomina-card-icon--red"><i className="fa-solid fa-file-circle-minus"></i></div>
            <div>
              <p className="nomina-card-label">TOTAL DEDUCCIONES</p>
              <p className="nomina-card-value">{formatPesoColombiano(reportSummary.totalDeducciones)}</p>
            </div>
          </div>
        </div>

        <div className="nomina-main-grid">
          <div className="nomina-chart-card">
            <div className="nomina-chart-header">
              <h3>Pago neto por empleado ({selectedMonth})</h3>
              <span className="nomina-chart-badge">{reportSummary.totalNominas} nóminas</span>
            </div>
            <div className="nomina-chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(2)}M`} />
                  <Tooltip formatter={(value) => [formatPesoColombiano(value), 'Pago neto']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="nomina-payday-card">
            <h3>ESTADO DEL REPORTE</h3>
            <p className="nomina-payday-count">{loading ? 'Cargando...' : `${reportData.length} REGISTROS`}</p>
            <p className="nomina-payday-date">Mes seleccionado: {selectedMonth}</p>
            <p className="nomina-payday-date">Filtro empleado: {selectedEmployee ? 'Aplicado' : 'Todos'}</p>
          </div>
        </div>
      </div>
    </>
  )
}
