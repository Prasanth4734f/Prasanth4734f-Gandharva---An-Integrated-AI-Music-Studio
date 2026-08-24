const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.handleGetUsers);
router.post('/report', adminController.handleReportProblem);

module.exports = router;
