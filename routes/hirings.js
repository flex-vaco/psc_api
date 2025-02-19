
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Hiring = require('../models/Hiring.js');
const HiringComments = require('../models/HiringComments.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Hiring.findAll);
router.get("/enquiredbyme", verifyToken, Hiring.enquiredByMe);
router.get("/enquiredtome", verifyToken, Hiring.enquiredToMe);
router.get("/hiringcomments/:hiring_id", verifyToken, HiringComments.findByHiringId);
router.post("/hiringcomments/add", verifyToken, HiringComments.create);
router.get("/:hiring_id", verifyToken, Hiring.findById);
router.post("/add", verifyToken, Hiring.create);
router.post("/update/:hiring_id", verifyToken, Hiring.update);
router.get("/delete/:hiring_id", verifyToken, Hiring.erase);

module.exports = router;