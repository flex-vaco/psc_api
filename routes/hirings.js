
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Hiring = require('../models/Hiring.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Hiring.findAll);
router.get("/:hiring_id", verifyToken, Hiring.findById);
router.post("/add", verifyToken, Hiring.create);
router.post("/update/:hiring_id", verifyToken, Hiring.update);
router.get("/delete/:hiring_id", verifyToken, Hiring.erase);

module.exports = router;