const { pool } = require('../config/database');

const VALID_PAYMENT_TYPES = new Set(['MENSUAL', 'QUINCENAL']);
const VALID_OVERTIME_TYPES = new Set([
  'EXTRA_DIURNA',
  'EXTRA_NOCTURNA',
  'EXTRA_DIURNA_DOMINICAL_FESTIVO',
  'EXTRA_NOCTURNA_DOMINICAL_FESTIVO'
]);

const createPayroll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      id_empleado,
      fecha_inicio,
      fecha_corte,
      tipo_pago,
      total_devengado,
      total_deducciones,
      detalles = [],
      horas_extras = []
    } = req.body;

    if (!id_empleado || !fecha_inicio || !fecha_corte) {
      return res.status(400).json({
        success: false,
        message: 'id_empleado, fecha_inicio y fecha_corte son obligatorios'
      });
    }

    const paymentType = VALID_PAYMENT_TYPES.has(tipo_pago) ? tipo_pago : 'MENSUAL';
    const devengado = Number(total_devengado) || 0;
    const deducciones = Number(total_deducciones) || 0;

    if (devengado < 0 || deducciones < 0) {
      return res.status(400).json({
        success: false,
        message: 'Los valores de nómina no pueden ser negativos'
      });
    }

    const overtimeRows = Array.isArray(horas_extras)
      ? horas_extras
          .filter((item) => item && VALID_OVERTIME_TYPES.has(item.tipo_hora))
          .map((item) => ({
            tipo_hora: item.tipo_hora,
            porcentaje_recargo: Number(item.porcentaje_recargo) || 0,
            horas: Number(item.horas) || 0,
            valor_hora_base: Number(item.valor_hora_base) || 0,
            valor_hora_extra: Number(item.valor_hora_extra) || 0,
            valor_total: Number(item.valor_total) || 0
          }))
          .filter((item) => item.horas > 0 && item.valor_total >= 0)
      : [];

    await connection.beginTransaction();

    const [payrollResult] = await connection.query(
      `INSERT INTO nomina (id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empleado, fecha_inicio, fecha_corte, paymentType, devengado, deducciones]
    );

    const idNomina = payrollResult.insertId;

    if (Array.isArray(detalles) && detalles.length > 0) {
      const detailRows = detalles
        .filter((item) => item && item.concepto && Number(item.valor) >= 0)
        .map((item) => [idNomina, String(item.concepto).slice(0, 100), Number(item.valor)]);

      if (detailRows.length > 0) {
        await connection.query(
          `INSERT INTO detalle_nomina (id_nomina, concepto, valor) VALUES ?`,
          [detailRows]
        );
      }
    }

    if (overtimeRows.length > 0) {
      const overtimeInsertRows = overtimeRows.map((row) => [
        idNomina,
        row.tipo_hora,
        row.porcentaje_recargo,
        row.horas,
        row.valor_hora_base,
        row.valor_hora_extra,
        row.valor_total
      ]);

      await connection.query(
        `INSERT INTO horas_extra_nomina
          (id_nomina, tipo_hora, porcentaje_recargo, horas, valor_hora_base, valor_hora_extra, valor_total)
         VALUES ?`,
        [overtimeInsertRows]
      );
    }

    const corteDate = new Date(fecha_corte);
    const anio = corteDate.getUTCFullYear();
    const mes = corteDate.getUTCMonth() + 1;
    const totalHorasExtra = overtimeRows.reduce((acc, row) => acc + row.horas, 0);
    const valorHorasExtra = overtimeRows.reduce((acc, row) => acc + row.valor_total, 0);

    await connection.query(
      `INSERT INTO reporte_nomina_mensual
        (anio, mes, total_nominas, total_devengado, total_deducciones, total_pagado, total_horas_extra, valor_horas_extra)
       VALUES (?, ?, 1, ?, ?, (? - ?), ?, ?)
       ON DUPLICATE KEY UPDATE
         total_nominas = total_nominas + 1,
         total_devengado = total_devengado + VALUES(total_devengado),
         total_deducciones = total_deducciones + VALUES(total_deducciones),
         total_pagado = total_pagado + VALUES(total_pagado),
         total_horas_extra = total_horas_extra + VALUES(total_horas_extra),
         valor_horas_extra = valor_horas_extra + VALUES(valor_horas_extra)`,
      [anio, mes, devengado, deducciones, devengado, deducciones, totalHorasExtra, valorHorasExtra]
    );

    await connection.commit();

    const [savedPayrollRows] = await connection.query(
      `SELECT id_nomina, id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones, total_pagar
       FROM nomina
       WHERE id_nomina = ?`,
      [idNomina]
    );

    return res.status(201).json({
      success: true,
      message: 'Nómina guardada exitosamente',
      data: savedPayrollRows[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando nómina:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error guardando la nómina'
    });
  } finally {
    connection.release();
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const now = new Date();
    const requestedYear = Number(req.query.anio) || now.getUTCFullYear();
    const requestedEmployeeId = Number(req.query.id_empleado) || null;

    const hasMonthFilter = req.query.mes !== undefined && req.query.mes !== null && req.query.mes !== '';
    const requestedMonth = hasMonthFilter ? Number(req.query.mes) : null;

    if (hasMonthFilter && (requestedMonth < 1 || requestedMonth > 12)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro mes debe estar entre 1 y 12'
      });
    }

    const queryParams = [requestedYear];
    let monthFilterSql = '';
    let employeeFilterSql = '';

    if (hasMonthFilter) {
      monthFilterSql = ' AND MONTH(n.fecha_corte) = ? ';
      queryParams.push(requestedMonth);
    }

    if (requestedEmployeeId) {
      employeeFilterSql = ' AND n.id_empleado = ? ';
      queryParams.push(requestedEmployeeId);
    }

    const [rows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      WHERE YEAR(n.fecha_corte) = ?
        ${monthFilterSql}
        ${employeeFilterSql}
      ORDER BY n.fecha_corte DESC, n.id_nomina DESC`,
      queryParams
    );

    const resumen = rows.reduce((acc, row) => ({
      totalNominas: acc.totalNominas + 1,
      totalDevengado: acc.totalDevengado + (Number(row.total_devengado) || 0),
      totalDeducciones: acc.totalDeducciones + (Number(row.total_deducciones) || 0),
      totalPagado: acc.totalPagado + (Number(row.total_pagar) || 0)
    }), {
      totalNominas: 0,
      totalDevengado: 0,
      totalDeducciones: 0,
      totalPagado: 0
    });

    return res.json({
      success: true,
      data: {
        filtros: {
          anio: requestedYear,
          mes: hasMonthFilter ? requestedMonth : null,
          id_empleado: requestedEmployeeId
        },
        resumen,
        nominas: rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte de nómina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo el reporte de nómina'
    });
  }
};

const getPayrollReportDetail = async (req, res) => {
  try {
    const payrollId = Number(req.params.id_nomina);

    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro id_nomina es obligatorio'
      });
    }

    const [headerRows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      WHERE n.id_nomina = ?
      LIMIT 1`,
      [payrollId]
    );

    if (headerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la nómina solicitada'
      });
    }

    const payroll = headerRows[0];
    const isEmployeeRole = req.user?.rol === 'EMPLEADO';
    if (isEmployeeRole && Number(req.user?.id_empleado) !== Number(payroll.id_empleado)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para consultar esta nómina'
      });
    }

    const [detailRows] = await pool.query(
      `SELECT id_detalle, id_nomina, concepto, valor
       FROM detalle_nomina
       WHERE id_nomina = ?
       ORDER BY id_detalle ASC`,
      [payrollId]
    );

    const [overtimeRows] = await pool.query(
      `SELECT
        id_hora_extra,
        id_nomina,
        tipo_hora,
        porcentaje_recargo,
        horas,
        valor_hora_base,
        valor_hora_extra,
        valor_total
      FROM horas_extra_nomina
      WHERE id_nomina = ?
      ORDER BY id_hora_extra ASC`,
      [payrollId]
    );

    return res.json({
      success: true,
      data: {
        nomina: payroll,
        detalles: detailRows,
        horas_extras: overtimeRows
      }
    });
  } catch (error) {
    console.error('Error obteniendo detalle de nómina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo el detalle de nómina'
    });
  }
};

module.exports = {
  createPayroll,
  getPayrollReport,
  getPayrollReportDetail
};
