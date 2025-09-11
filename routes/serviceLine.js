const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ServiceLine = require('../models/ServiceLine.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, ServiceLine.findAll);
router.get("/:id", verifyToken, ServiceLine.findById);
router.get("/lineOfBusiness/:lineOfBusinessId", verifyToken, ServiceLine.findByLineOfBusiness);
router.get("/offshoreLead/assigned", verifyToken, ServiceLine.findByOffshoreLead);
router.post("/add", verifyToken, ServiceLine.create);
router.post("/update/:id", verifyToken, ServiceLine.update);
router.get("/delete/:id", verifyToken, ServiceLine.erase);

module.exports = router; 