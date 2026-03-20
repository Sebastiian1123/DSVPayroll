const express = require('express');
const router = express.Router();

const { createPayroll, getPayrollReport, getPayrollReportDetail } = require('../controllers/nominaController');
const { verifyToken, verifyAdminORRRHH } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/reportes', getPayrollReport);
router.get('/reportes/:id_nomina', getPayrollReportDetail);
router.post('/', verifyAdminORRRHH, createPayroll);

module.exports = router;
