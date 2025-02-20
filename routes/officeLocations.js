
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const OfficeLocation = require('../models/OfficeLocation.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, OfficeLocation.findAll);
router.get("/:office_location_id", verifyToken, OfficeLocation.findById);
router.post("/add", verifyToken, OfficeLocation.create);
router.post("/update/:office_location_id", verifyToken, OfficeLocation.update);

module.exports = router;