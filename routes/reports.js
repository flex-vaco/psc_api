
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Report = require('../models/Report');
const ComprehensiveReports = require('../models/ComprehensiveReports');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Existing routes
router.post("/forecastHours", verifyToken, Report.forecastHours);
router.post("/availableHours", verifyToken, Report.availableHours);
router.post("/utilization", verifyToken, Report.utilization);

// New comprehensive reports routes
router.get("/filter-options", verifyToken, ComprehensiveReports.getFilterOptions);
router.get("/dashboard-metrics", verifyToken, ComprehensiveReports.getDashboardMetrics);
router.post("/utilization-trends", verifyToken, ComprehensiveReports.getUtilizationTrends);
router.post("/allocation-forecast", verifyToken, ComprehensiveReports.getAllocationForecast);
router.get("/service-lines/:lineOfBusinessId", verifyToken, ComprehensiveReports.getServiceLinesByLineOfBusiness);

module.exports = router;