const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const CoiExtract = require('../models/CoiExtract.js');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/extract-pdf", CoiExtract.extractPdf);

module.exports = router;
