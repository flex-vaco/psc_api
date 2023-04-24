
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Report = require('../models/Report');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/forecastHours", verifyToken, Report.forecastHours);
router.get("/availableHours", verifyToken, Report.availableHours);

module.exports = router;