
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Employee = require('../models/Employee.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/filter", verifyToken, Employee.search);
router.get("/", verifyToken, Employee.findAll);
router.get("/:emp_id", verifyToken, Employee.findById);
router.post("/add", verifyToken, Employee.create);
router.post("/update/:emp_id", verifyToken, Employee.update);
router.get("/delete/:emp_id", verifyToken, Employee.erase);

module.exports = router;