
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Employee = require('../models/Employee.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", Employee.findAll);
router.get("/:id", Employee.findById);
router.post("/add", Employee.create);
router.post("/update/:id", Employee.update);
router.get("/delete/:id", Employee.erase);

module.exports = router;