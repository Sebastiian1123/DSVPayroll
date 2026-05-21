const express = require('express');
const router = express.Router();

const {
  calcularLiquidacion,
  guardarLiquidacion,
  getLiquidaciones,
  getLiquidacionById,
  anularLiquidacion,
  marcarPagada,
  downloadLiquidacionPdf,
  getRecontratacionConfig,
  updateRecontratacionConfig,
  revertirPago,
  revertirAnulacion
} = require('./liquidacion.controller');

const { verifyToken, verifyAdminORRRHH } = require('../../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getLiquidaciones);
router.get('/:id_liquidacion', getLiquidacionById);
router.post('/calcular', verifyAdminORRRHH, calcularLiquidacion);
router.post('/', verifyAdminORRRHH, guardarLiquidacion);
router.put('/:id_liquidacion/pagar', verifyAdminORRRHH, marcarPagada);
router.put('/:id_liquidacion/anular', verifyAdminORRRHH, anularLiquidacion);
router.put('/:id_liquidacion/revertir-pago', verifyAdminORRRHH, revertirPago);
router.put('/:id_liquidacion/revertir-anulacion', verifyAdminORRRHH, revertirAnulacion);
router.get('/:id_liquidacion/pdf', verifyAdminORRRHH, downloadLiquidacionPdf);

// Configuracion de recontratacion
router.get('/config/recontratacion', verifyAdminORRRHH, getRecontratacionConfig);
router.put('/config/recontratacion', verifyAdminORRRHH, updateRecontratacionConfig);

module.exports = router;
