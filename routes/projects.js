
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Project = require('../models/Project.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", Project.findAll);
router.get("/:id", Project.findById);
router.post("/add", Project.create);
router.post("/update/:id", Project.update);
router.get("/delete/:id", Project.erase);

module.exports = router;