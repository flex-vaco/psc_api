const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const CapabilityArea = require('../models/CapabilityArea.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, CapabilityArea.findAll);
router.get("/serviceLine/:serviceLineId", verifyToken, CapabilityArea.findByServiceLine);
router.get("/lineOfBusiness/:lineOfBusinessId", verifyToken, CapabilityArea.findByLineOfBusiness);
router.get("/:id", verifyToken, CapabilityArea.findById);
router.post("/add", verifyToken, CapabilityArea.create);
router.post("/update/:id", verifyToken, CapabilityArea.update);
router.get("/delete/:id", verifyToken, CapabilityArea.erase);

module.exports = router; 