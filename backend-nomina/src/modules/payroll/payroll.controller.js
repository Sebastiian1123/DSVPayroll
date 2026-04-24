const { pool } = require('../../config/database');
const { generatePayrollPdfBuffer } = require('./payroll-pdf.service');
const { VALID_PAYMENT_TYPES, VALID_OVERTIME_TYPES } = require('./payroll.constants');
const {
  getPayrollNoveltiesForPeriod,
  buildPayrollNoveltyDetailRows,
  buildAppliedNoveltyRows
} = require('./payroll.helpers');

const parseParameterNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapPayrollParametersRow = (row = {}) => {
  const horasSemanales = parseParameterNumber(row.horas_semanales, 47);

  return {
    id_parametro: row.id_parametro,
    heo: `${parseParameterNumber(row.horas_extra_ordinaria_pct, 25)}%`,
    hen: `${parseParameterNumber(row.horas_extra_nocturna_pct, 75)}%`,
    hef: `${parseParameterNumber(row.horas_extra_festiva_pct, 100)}%`,
    hefn: `${parseParameterNumber(row.horas_extra_festiva_nocturna_pct, 150)}%`,
    subsidioTransporte: String(parseParameterNumber(row.subsidio_transporte, 140606)),
    horasSemanales: String(horasSemanales),
    horasQuincenales: (horasSemanales * 2).toFixed(1),
    horasMensuales: (horasSemanales * 4).toFixed(1),
    saludEmpleado: String(parseParameterNumber(row.salud_empleado_pct, 4)),
    saludEmpresa: String(parseParameterNumber(row.salud_empresa_pct, 8.5)),
    pensionEmpleado: String(parseParameterNumber(row.pension_empleado_pct, 4)),
    pensionEmpresa: String(parseParameterNumber(row.pension_empresa_pct, 12)),
    arlEmpresa: String(parseParameterNumber(row.arl_empresa_pct, 0.522)),
    actualizado_en: row.actualizado_en || null,
    actualizado_por: row.actualizado_por || null
  };
};

const parsePercentageInput = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateWorkedDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

const OVERTIME_PERCENTAGE_BY_TYPE = (values) => ({
  EXTRA_DIURNA: values.heo,
  EXTRA_NOCTURNA: values.hen,
  EXTRA_DIURNA_DOMINICAL_FESTIVO: values.hef,
  EXTRA_NOCTURNA_DOMINICAL_FESTIVO: values.hefn
});

const getCurrentPayrollConfig = async (db = pool) => {
  const [rows] = await db.query(
    `SELECT
      id_parametro,
      horas_extra_ordinaria_pct,
      horas_extra_nocturna_pct,
      horas_extra_festiva_pct,
      horas_extra_festiva_nocturna_pct,
      subsidio_transporte,
      horas_semanales,
      salud_empleado_pct,
      salud_empresa_pct,
      pension_empleado_pct,
      pension_empresa_pct,
      arl_empresa_pct,
      actualizado_por,
      actualizado_en
    FROM parametros_nomina
    ORDER BY id_parametro ASC
    LIMIT 1`
  );

  if (rows.length === 0) {
    return {
      id_parametro: null,
      horas_extra_ordinaria_pct: 25,
      horas_extra_nocturna_pct: 75,
      horas_extra_festiva_pct: 100,
      horas_extra_festiva_nocturna_pct: 150,
      subsidio_transporte: 140606,
      horas_semanales: 47,
      salud_empleado_pct: 4,
      salud_empresa_pct: 8.5,
      pension_empleado_pct: 4,
      pension_empresa_pct: 12,
      arl_empresa_pct: 0.522,
      actualizado_por: null,
      actualizado_en: null
    };
  }

  return rows[0];
};

const getPayrollParameters = async (req, res) => {
  try {
    const row = await getCurrentPayrollConfig(pool);

    return res.json({
      success: true,
      data: mapPayrollParametersRow(row)
    });
  } catch (error) {
    console.error('Error obteniendo parametros de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo parametros de nomina'
    });
  }
};

const updatePayrollParameters = async (req, res) => {
  try {
    const payload = req.body || {};
    const horasSemanales = parseParameterNumber(payload.horasSemanales, 0);
    const subsidioTransporte = parseParameterNumber(payload.subsidioTransporte, 0);

    if (horasSemanales <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Las horas semanales deben ser mayores a cero'
      });
    }

    if (subsidioTransporte < 0) {
      return res.status(400).json({
        success: false,
        message: 'El subsidio de transporte no puede ser negativo'
      });
    }

    const values = {
      heo: parsePercentageInput(payload.heo, 25),
      hen: parsePercentageInput(payload.hen, 75),
      hef: parsePercentageInput(payload.hef, 100),
      hefn: parsePercentageInput(payload.hefn, 150),
      subsidioTransporte,
      horasSemanales,
      saludEmpleado: parseParameterNumber(payload.saludEmpleado, 4),
      saludEmpresa: parseParameterNumber(payload.saludEmpresa, 8.5),
      pensionEmpleado: parseParameterNumber(payload.pensionEmpleado, 4),
      pensionEmpresa: parseParameterNumber(payload.pensionEmpresa, 12),
      arlEmpresa: parseParameterNumber(payload.arlEmpresa, 0.522)
    };

    const percentageFields = [
      ['heo', values.heo],
      ['hen', values.hen],
      ['hef', values.hef],
      ['hefn', values.hefn],
      ['saludEmpleado', values.saludEmpleado],
      ['saludEmpresa', values.saludEmpresa],
      ['pensionEmpleado', values.pensionEmpleado],
      ['pensionEmpresa', values.pensionEmpresa],
      ['arlEmpresa', values.arlEmpresa]
    ];

    const invalidField = percentageFields.find(([, value]) => value < 0);
    if (invalidField) {
      return res.status(400).json({
        success: false,
        message: `El valor de ${invalidField[0]} no puede ser negativo`
      });
    }

    const [existingRows] = await pool.query(
      `SELECT id_parametro
       FROM parametros_nomina
       ORDER BY id_parametro ASC
       LIMIT 1`
    );

    let parameterId = existingRows[0]?.id_parametro || null;

    if (!parameterId) {
      const [insertResult] = await pool.query(
        `INSERT INTO parametros_nomina (
          horas_extra_ordinaria_pct,
          horas_extra_nocturna_pct,
          horas_extra_festiva_pct,
          horas_extra_festiva_nocturna_pct,
          subsidio_transporte,
          horas_semanales,
          salud_empleado_pct,
          salud_empresa_pct,
          pension_empleado_pct,
          pension_empresa_pct,
          arl_empresa_pct,
          actualizado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.heo,
          values.hen,
          values.hef,
          values.hefn,
          values.subsidioTransporte,
          values.horasSemanales,
          values.saludEmpleado,
          values.saludEmpresa,
          values.pensionEmpleado,
          values.pensionEmpresa,
          values.arlEmpresa,
          req.user?.id_usuario || null
        ]
      );

      parameterId = insertResult.insertId;
    } else {
      await pool.query(
        `UPDATE parametros_nomina
         SET horas_extra_ordinaria_pct = ?,
             horas_extra_nocturna_pct = ?,
             horas_extra_festiva_pct = ?,
             horas_extra_festiva_nocturna_pct = ?,
             subsidio_transporte = ?,
             horas_semanales = ?,
             salud_empleado_pct = ?,
             salud_empresa_pct = ?,
             pension_empleado_pct = ?,
             pension_empresa_pct = ?,
             arl_empresa_pct = ?,
             actualizado_por = ?
         WHERE id_parametro = ?`,
        [
          values.heo,
          values.hen,
          values.hef,
          values.hefn,
          values.subsidioTransporte,
          values.horasSemanales,
          values.saludEmpleado,
          values.saludEmpresa,
          values.pensionEmpleado,
          values.pensionEmpresa,
          values.arlEmpresa,
          req.user?.id_usuario || null,
          parameterId
        ]
      );
    }

    const overtimePercentages = OVERTIME_PERCENTAGE_BY_TYPE(values);
    await pool.query(
      `UPDATE horas_extra_nomina
       SET porcentaje_recargo = CASE
         WHEN tipo_hora = 'EXTRA_DIURNA' THEN ?
         WHEN tipo_hora = 'EXTRA_NOCTURNA' THEN ?
         WHEN tipo_hora = 'EXTRA_DIURNA_DOMINICAL_FESTIVO' THEN ?
         WHEN tipo_hora = 'EXTRA_NOCTURNA_DOMINICAL_FESTIVO' THEN ?
         ELSE porcentaje_recargo
       END`,
      [
        overtimePercentages.EXTRA_DIURNA,
        overtimePercentages.EXTRA_NOCTURNA,
        overtimePercentages.EXTRA_DIURNA_DOMINICAL_FESTIVO,
        overtimePercentages.EXTRA_NOCTURNA_DOMINICAL_FESTIVO
      ]
    );

    const [savedRows] = await pool.query(
      `SELECT
        id_parametro,
        horas_extra_ordinaria_pct,
        horas_extra_nocturna_pct,
        horas_extra_festiva_pct,
        horas_extra_festiva_nocturna_pct,
        subsidio_transporte,
        horas_semanales,
        salud_empleado_pct,
        salud_empresa_pct,
        pension_empleado_pct,
        pension_empresa_pct,
        arl_empresa_pct,
        actualizado_por,
        actualizado_en
      FROM parametros_nomina
      WHERE id_parametro = ?
      LIMIT 1`,
      [parameterId]
    );

    return res.json({
      success: true,
      message: 'Parametros de nomina actualizados exitosamente',
      data: mapPayrollParametersRow(savedRows[0])
    });
  } catch (error) {
    console.error('Error actualizando parametros de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error actualizando parametros de nomina'
    });
  }
};

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

    if (new Date(fecha_corte) < new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'fecha_corte no puede ser menor a fecha_inicio'
      });
    }

    const paymentType = VALID_PAYMENT_TYPES.has(tipo_pago) ? tipo_pago : 'MENSUAL';
    const workedDays = calculateWorkedDays(fecha_inicio, fecha_corte);

    if (workedDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El periodo seleccionado no genera dias trabajados validos'
      });
    }

    const payrollConfig = await getCurrentPayrollConfig(connection);
    const overtimePercentages = OVERTIME_PERCENTAGE_BY_TYPE({
      heo: parseParameterNumber(payrollConfig.horas_extra_ordinaria_pct, 25),
      hen: parseParameterNumber(payrollConfig.horas_extra_nocturna_pct, 75),
      hef: parseParameterNumber(payrollConfig.horas_extra_festiva_pct, 100),
      hefn: parseParameterNumber(payrollConfig.horas_extra_festiva_nocturna_pct, 150)
    });

    const [employeeRows] = await connection.query(
      `SELECT id_empleado, sueldo
       FROM empleados
       WHERE id_empleado = ?
       LIMIT 1`,
      [id_empleado]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado para generar la nomina'
      });
    }

    const salarioBase = Number(employeeRows[0].sueldo) || 0;
    const horasMensualesReferencia = Math.max(parseParameterNumber(payrollConfig.horas_semanales, 47) * 4, 1);
    const valorDia = salarioBase / 30;
    const valorHoraBase = salarioBase / horasMensualesReferencia;

    const overtimeRows = Array.isArray(horas_extras)
      ? horas_extras
        .filter((item) => item && VALID_OVERTIME_TYPES.has(item.tipo_hora))
        .map((item) => {
          const horas = Number(item.horas) || 0;
          const porcentajeRecargo = parseParameterNumber(overtimePercentages[item.tipo_hora], 0);
          const valorHoraExtra = Number((valorHoraBase * (1 + (porcentajeRecargo / 100))).toFixed(2));
          const valorTotal = Number((horas * valorHoraExtra).toFixed(2));

          return {
            tipo_hora: item.tipo_hora,
            porcentaje_recargo: porcentajeRecargo,
            horas,
            valor_hora_base: Number(valorHoraBase.toFixed(2)),
            valor_hora_extra: valorHoraExtra,
            valor_total: valorTotal
          };
        })
        .filter((item) => item.horas > 0 && item.valor_total >= 0)
      : [];

    const totalHorasExtra = overtimeRows.reduce((acc, row) => acc + row.horas, 0);
    const valorHorasExtra = overtimeRows.reduce((acc, row) => acc + row.valor_total, 0);
    const pagoBasicoPeriodo = Number((valorDia * workedDays).toFixed(2));
    const subsidioTransporte = parseParameterNumber(payrollConfig.subsidio_transporte, 0);
    const baseDeduccionesEmpleado = pagoBasicoPeriodo + valorHorasExtra;
    const saludEmpleado = Number((baseDeduccionesEmpleado * (parseParameterNumber(payrollConfig.salud_empleado_pct, 4) / 100)).toFixed(2));
    const pensionEmpleado = Number((baseDeduccionesEmpleado * (parseParameterNumber(payrollConfig.pension_empleado_pct, 4) / 100)).toFixed(2));
    const saludEmpresa = Number((baseDeduccionesEmpleado * (parseParameterNumber(payrollConfig.salud_empresa_pct, 8.5) / 100)).toFixed(2));
    const pensionEmpresa = Number((baseDeduccionesEmpleado * (parseParameterNumber(payrollConfig.pension_empresa_pct, 12) / 100)).toFixed(2));
    const arlEmpresa = Number((baseDeduccionesEmpleado * (parseParameterNumber(payrollConfig.arl_empresa_pct, 0.522) / 100)).toFixed(2));
    const baseDevengado = Number((pagoBasicoPeriodo + valorHorasExtra + subsidioTransporte).toFixed(2));
    const baseDeducciones = Number((saludEmpleado + pensionEmpleado).toFixed(2));

    // Busca novedades aprobadas del periodo antes de guardar la nómina.
    // Su impacto se suma automaticamente al devengado o a las deducciones.
    const payrollNovelties = await getPayrollNoveltiesForPeriod({
      db: connection,
      idEmpleado: id_empleado,
      fechaInicio: fecha_inicio,
      fechaCorte: fecha_corte
    });

    const novelties = payrollNovelties.novedades || [];
    const noveltySummary = payrollNovelties.resumen || {
      totalDevengado: 0,
      totalDeducciones: 0
    };
    const finalDevengado = Number((baseDevengado + Number(noveltySummary.totalDevengado || 0)).toFixed(2));
    const finalDeducciones = Number((baseDeducciones + Number(noveltySummary.totalDeducciones || 0)).toFixed(2));

    await connection.beginTransaction();

    // Evita duplicar la misma nómina para un empleado y el mismo rango de fechas.
    const [existingPayrollRows] = await connection.query(
      `SELECT id_nomina
       FROM nomina
       WHERE id_empleado = ?
         AND fecha_inicio = ?
         AND fecha_corte = ?
       LIMIT 1
       FOR UPDATE`,
      [id_empleado, fecha_inicio, fecha_corte]
    );

    if (existingPayrollRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Ya existe una nomina registrada para este empleado y periodo'
      });
    }

    const [payrollResult] = await connection.query(
      `INSERT INTO nomina (id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empleado, fecha_inicio, fecha_corte, paymentType, finalDevengado, finalDeducciones]
    );

    const idNomina = payrollResult.insertId;
    const overtimeDetails = overtimeRows.map((row) => [idNomina, `${row.tipo_hora} (${row.horas}h)`, row.valor_total]);
    const manualDetailRows = [
      [idNomina, `Pago base (${workedDays} dias)`, pagoBasicoPeriodo],
      ...overtimeDetails,
      [idNomina, 'Subsidio de transporte', subsidioTransporte],
      [idNomina, `Salud empleado ${parseParameterNumber(payrollConfig.salud_empleado_pct, 4)}%`, saludEmpleado],
      [idNomina, `Pension empleado ${parseParameterNumber(payrollConfig.pension_empleado_pct, 4)}%`, pensionEmpleado],
      [idNomina, `Salud empresa ${parseParameterNumber(payrollConfig.salud_empresa_pct, 8.5)}%`, saludEmpresa],
      [idNomina, `Pension empresa ${parseParameterNumber(payrollConfig.pension_empresa_pct, 12)}%`, pensionEmpresa],
      [idNomina, `ARL empresa ${parseParameterNumber(payrollConfig.arl_empresa_pct, 0.522)}%`, arlEmpresa]
    ].filter((item) => Number(item[2]) >= 0);
    const noveltyDetailRows = buildPayrollNoveltyDetailRows(idNomina, novelties);
    const appliedNoveltyRows = buildAppliedNoveltyRows(idNomina, novelties);
    const mergedDetailRows = [...manualDetailRows, ...noveltyDetailRows];

    if (mergedDetailRows.length > 0) {
      await connection.query(
        `INSERT INTO detalle_nomina (id_nomina, concepto, valor) VALUES ?`,
        [mergedDetailRows]
      );
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

    if (appliedNoveltyRows.length > 0) {
      await connection.query(
        `INSERT INTO nomina_novedades_aplicadas
          (id_nomina, id_solicitud, categoria, concepto, cantidad, unidad, porcentaje_aplicado, valor_aplicado)
         VALUES ?`,
        [appliedNoveltyRows]
      );

      const settledRequestIds = [...new Set(appliedNoveltyRows.map((row) => Number(row[1])).filter(Boolean))];
      if (settledRequestIds.length > 0) {
        await connection.query(
          `UPDATE solicitudes_laborales
           SET pendiente_liquidacion = 0,
               liquidada_en_nomina = 1,
               fecha_liquidacion = CURRENT_TIMESTAMP
           WHERE id_solicitud IN (?)`,
          [settledRequestIds]
        );
      }
    }

    const corteDate = new Date(fecha_corte);
    const anio = corteDate.getUTCFullYear();
    const mes = corteDate.getUTCMonth() + 1;

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
      [anio, mes, finalDevengado, finalDeducciones, finalDevengado, finalDeducciones, totalHorasExtra, valorHorasExtra]
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
      message: 'Nomina guardada exitosamente',
      data: {
        ...savedPayrollRows[0],
        novedades_aplicadas: novelties,
        resumen_novedades: payrollNovelties.resumen
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando nomina:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error guardando la nomina'
    });
  } finally {
    connection.release();
  }
};

// Muestra las solicitudes aprobadas que impactarian una nómina del periodo.
// Sirve como paso previo para validar reglas antes de integrarlas al guardado final.
const getPayrollNoveltiesPreview = async (req, res) => {
  try {
    const idEmpleado = Number(req.query.id_empleado);
    const fechaInicio = req.query.fecha_inicio;
    const fechaCorte = req.query.fecha_corte;

    if (!idEmpleado || !fechaInicio || !fechaCorte) {
      return res.status(400).json({
        success: false,
        message: 'id_empleado, fecha_inicio y fecha_corte son obligatorios'
      });
    }

    if (new Date(fechaCorte) < new Date(fechaInicio)) {
      return res.status(400).json({
        success: false,
        message: 'fecha_corte no puede ser menor a fecha_inicio'
      });
    }

    const payrollNovelties = await getPayrollNoveltiesForPeriod({
      db: pool,
      idEmpleado,
      fechaInicio,
      fechaCorte
    });

    return res.json({
      success: true,
      data: {
        id_empleado: idEmpleado,
        fecha_inicio: fechaInicio,
        fecha_corte: fechaCorte,
        empleado: payrollNovelties.empleado,
        resumen: payrollNovelties.resumen,
        novedades: payrollNovelties.novedades
      }
    });
  } catch (error) {
    console.error('Error obteniendo novedades de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo las novedades de nomina'
    });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const now = new Date();
    const requestedYear = Number(req.query.anio) || now.getUTCFullYear();
    const requestedEmployeeId = Number(req.query.id_empleado) || null;
    const isAdminOrRRHH = req.user?.rol === 'ADMINISTRADOR' || req.user?.rol === 'RRHH';
    const isEmployee = req.user?.rol === 'EMPLEADO';
    const authenticatedEmployeeId = Number(req.user?.id_empleado) || null;

    const hasMonthFilter = req.query.mes !== undefined && req.query.mes !== null && req.query.mes !== '';
    const requestedMonth = hasMonthFilter ? Number(req.query.mes) : null;

    if (hasMonthFilter && (requestedMonth < 1 || requestedMonth > 12)) {
      return res.status(400).json({
        success: false,
        message: 'El parametro mes debe estar entre 1 y 12'
      });
    }

    if (requestedYear < 2000 || requestedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'El parametro anio debe estar entre 2000 y 2100'
      });
    }

    if (!isAdminOrRRHH && !isEmployee) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para consultar reportes de nomina'
      });
    }

    if (isEmployee && !authenticatedEmployeeId) {
      return res.status(403).json({
        success: false,
        message: 'Tu usuario no tiene un empleado asociado para consultar reportes'
      });
    }

    const finalEmployeeId = isAdminOrRRHH ? requestedEmployeeId : authenticatedEmployeeId;

    const queryParams = [requestedYear];
    let monthFilterSql = '';
    let employeeFilterSql = '';

    if (hasMonthFilter) {
      monthFilterSql = ' AND MONTH(n.fecha_corte) = ? ';
      queryParams.push(requestedMonth);
    }

    if (finalEmployeeId) {
      employeeFilterSql = ' AND n.id_empleado = ? ';
      queryParams.push(finalEmployeeId);
    }

    const [rows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
        e.sueldo AS salario_basico,
        c.nombre_cargo AS cargo,
        d.nombre_departamento AS departamento,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar,
        COALESCE(he.heo, 0) AS heo,
        COALESCE(he.hef, 0) AS hef,
        COALESCE(he.hen, 0) AS hen,
        COALESCE(he.hefn, 0) AS hefn,
        COALESCE(dd.salud, 0) AS deduccion_salud,
        COALESCE(dd.arl, 0) AS deduccion_arl,
        COALESCE(dd.pension, 0) AS deduccion_pension
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      LEFT JOIN cargos c ON c.id_cargo = e.id_cargo
      LEFT JOIN departamentos d ON d.id_departamento = e.id_departamento
      LEFT JOIN (
        SELECT
          id_nomina,
          SUM(CASE WHEN tipo_hora = 'EXTRA_DIURNA' THEN horas ELSE 0 END) AS heo,
          SUM(CASE WHEN tipo_hora = 'EXTRA_DIURNA_DOMINICAL_FESTIVO' THEN horas ELSE 0 END) AS hef,
          SUM(CASE WHEN tipo_hora = 'EXTRA_NOCTURNA' THEN horas ELSE 0 END) AS hen,
          SUM(CASE WHEN tipo_hora = 'EXTRA_NOCTURNA_DOMINICAL_FESTIVO' THEN horas ELSE 0 END) AS hefn
        FROM horas_extra_nomina
        GROUP BY id_nomina
      ) he ON he.id_nomina = n.id_nomina
      LEFT JOIN (
        SELECT
          id_nomina,
          SUM(CASE WHEN LOWER(concepto) LIKE '%salud%' THEN valor ELSE 0 END) AS salud,
          SUM(CASE WHEN LOWER(concepto) LIKE '%arl%' THEN valor ELSE 0 END) AS arl,
          SUM(CASE WHEN LOWER(concepto) LIKE '%pensi%' THEN valor ELSE 0 END) AS pension
        FROM detalle_nomina
        GROUP BY id_nomina
      ) dd ON dd.id_nomina = n.id_nomina
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
          id_empleado: finalEmployeeId
        },
        resumen,
        nominas: rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo el reporte de nomina'
    });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const idNomina = Number(req.params.id_nomina);

    if (!idNomina) {
      return res.status(400).json({
        success: false,
        message: 'Debes indicar un id_nomina valido'
      });
    }

    const [payrollRows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
        c.nombre_cargo AS cargo,
        d.nombre_departamento AS departamento,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      LEFT JOIN cargos c ON c.id_cargo = e.id_cargo
      LEFT JOIN departamentos d ON d.id_departamento = e.id_departamento
      WHERE n.id_nomina = ?
      LIMIT 1`,
      [idNomina]
    );

    if (payrollRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nomina no encontrada'
      });
    }

    const payroll = payrollRows[0];
    const isAdminOrRRHH = req.user?.rol === 'ADMINISTRADOR' || req.user?.rol === 'RRHH';
    const authenticatedEmployeeId = Number(req.user?.id_empleado) || null;

    if (!isAdminOrRRHH && authenticatedEmployeeId !== Number(payroll.id_empleado)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para consultar esta nomina'
      });
    }

    const [detailRows] = await pool.query(
      `SELECT concepto, valor
       FROM detalle_nomina
       WHERE id_nomina = ?
       ORDER BY id_detalle ASC`,
      [idNomina]
    );

    const [overtimeRows] = await pool.query(
      `SELECT tipo_hora, horas, valor_total
       FROM horas_extra_nomina
       WHERE id_nomina = ?
       ORDER BY id_hora_extra ASC`,
      [idNomina]
    );

    const [noveltyRows] = await pool.query(
      `SELECT
        nna.id_solicitud,
        nna.categoria,
        nna.concepto,
        nna.cantidad,
        nna.unidad,
        nna.porcentaje_aplicado,
        nna.valor_aplicado,
        s.tipo,
        s.sub_tipo,
        s.fecha_inicio,
        s.fecha_fin
      FROM nomina_novedades_aplicadas nna
      INNER JOIN solicitudes_laborales s ON s.id_solicitud = nna.id_solicitud
      WHERE nna.id_nomina = ?
      ORDER BY nna.id_nomina_novedad ASC`,
      [idNomina]
    );

    return res.json({
      success: true,
      data: {
        nomina: payroll,
        detalle_nomina: detailRows,
        horas_extra: overtimeRows,
        novedades_aplicadas: noveltyRows
      }
    });
  } catch (error) {
    console.error('Error obteniendo detalle de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo detalle de nomina'
    });
  }
};

const downloadPayrollPdf = async (req, res) => {
  console.log("1. Inicio descarga PDF");
  try {
    const { id_nomina } = req.params;

    if (!id_nomina) {
      return res.status(400).json({
        success: false,
        message: 'El id de la nomina es obligatorio'
      });
    }

    const [payrollRows] = await pool.query(
      `SELECT
        n.id_nomina,
        n.id_empleado,
        n.fecha_inicio,
        n.fecha_corte,
        n.tipo_pago,
        n.total_devengado,
        n.total_deducciones,
        n.total_pagar,
        e.nombres,
        e.apellidos,
        e.tipo_identificacion,
        e.numero_identificacion,
        e.sueldo,
        c.nombre_cargo,
        d.nombre_departamento
      FROM nomina n
      INNER JOIN empleados e ON e.id_empleado = n.id_empleado
      INNER JOIN cargos c ON c.id_cargo = e.id_cargo
      INNER JOIN departamentos d ON d.id_departamento = e.id_departamento
      WHERE n.id_nomina = ?`,
      [id_nomina]
    );
    console.log("2. Datos nómina");

    if (payrollRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nomina no encontrada'
      });
    }

    const payroll = payrollRows[0];

    const isAdminOrRRHH = req.user?.rol === 'ADMINISTRADOR' || req.user?.rol === 'RRHH';
    const authenticatedEmployeeId = Number(req.user?.id_empleado) || null;
    const payrollEmployeeId = Number(payroll.id_empleado);

    if (!isAdminOrRRHH && authenticatedEmployeeId !== payrollEmployeeId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para descargar esta nomina'
      });
    }

    const [detailRows] = await pool.query(
      `SELECT concepto, valor
      FROM detalle_nomina
      WHERE id_nomina = ?`,
      [id_nomina]
    );
    console.log("3. Detalles");

    const [overtimeRows] = await pool.query(
      `SELECT
      tipo_hora,
      porcentaje_recargo,
      horas,
      valor_hora_base,
      valor_hora_extra,
      valor_total
      FROM horas_extra_nomina
      WHERE id_nomina = ?`,
      [id_nomina]
    );console.log("4. Horas extra");

    const pdfBuffer = await generatePayrollPdfBuffer({
      payroll,
      detailRows,
      overtimeRows
    });
    console.log("5. PDF generado");

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=nomina-${payroll.id_nomina}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF de nomina:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error generando el PDF de nomina'
    });
  }
};

module.exports = {
  createPayroll,
  getPayrollReport,
  getPayrollById,
  downloadPayrollPdf,
  getPayrollNoveltiesPreview,
  getPayrollNoveltiesForPeriod,
  getPayrollParameters,
  updatePayrollParameters
};
