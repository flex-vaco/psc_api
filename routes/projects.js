
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Project = require('../models/Project.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Project.findAll);
router.get("/:project_id", verifyToken, Project.findById);
router.post("/add", verifyToken, Project.create);
router.post("/update/:project_id", verifyToken, Project.update);
router.get("/delete/:project_id", verifyToken, Project.erase);

module.exports = router;