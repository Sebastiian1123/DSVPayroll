const express = require('express');
const router = express.Router();

const { createPayroll, getPayrollReport } = require('../controllers/nominaController');
const { verifyToken, verifyAdminORRRHH } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/reportes', getPayrollReport);
router.post('/', verifyAdminORRRHH, createPayroll);

module.exports = router;
