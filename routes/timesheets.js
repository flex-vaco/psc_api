
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Timesheet = require('../models/Timesheet');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.post("/create", verifyToken, Timesheet.create);
router.post("/update", verifyToken, Timesheet.update);
router.get("/delete/:timesheet_id", verifyToken, Timesheet.erase);
router.get("/", verifyToken, Timesheet.getTimesheets);
router.post("/by_allocation", verifyToken, Timesheet.getTimesheetsByAllocation);
router.post("/change_status", verifyToken, Timesheet.changeStatus);

module.exports = router;