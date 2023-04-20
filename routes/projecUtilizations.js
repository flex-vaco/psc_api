
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ProjecUtilization = require('../models/ProjecUtilization');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, ProjecUtilization.findAll);
router.post("/add", verifyToken, ProjecUtilization.create);
router.get("/delete/:emp_proj_utili_id", verifyToken, ProjecUtilization.erase);
router.get("/:emp_proj_utili_id", verifyToken, ProjecUtilization.findById);
router.post("/update/:emp_proj_utili_id", verifyToken, ProjecUtilization.update);

module.exports = router;