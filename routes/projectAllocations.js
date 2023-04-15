
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ProjectAllocation = require('../models/ProjectAllocation');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, ProjectAllocation.findAll);
router.get("/:emp_proj_aloc_id", verifyToken, ProjectAllocation.findById);
router.post("/add", verifyToken, ProjectAllocation.create);
router.post("/update/:emp_proj_aloc_id", verifyToken, ProjectAllocation.update);
router.get("/delete/:emp_proj_aloc_id", verifyToken, ProjectAllocation.erase);

module.exports = router;