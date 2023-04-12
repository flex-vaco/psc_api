
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Employee = require('../models/Employee.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Employee.findAll);
router.get("/:id", verifyToken, Employee.findById);
router.post("/add", verifyToken, Employee.create);
router.post("/update/:id", verifyToken, Employee.update);
router.get("/delete/:id", verifyToken, Employee.erase);

module.exports = router;