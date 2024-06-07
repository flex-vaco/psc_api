
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Application = require('../models/Application.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/getCategories", verifyToken, Application.getCategories);
router.get("/getTechnologies", verifyToken, Application.getTechnologies);
router.post("/sendEmail", verifyToken, Application.sendEmail);
router.get("/getChatResp", verifyToken, Application.getChatResp);
router.get("/runUserQuery", verifyToken, Application.runUserQuery);
router.post("/saveUserQuery", verifyToken, Application.saveUserQuery);
router.get("/getUserQueries", verifyToken, Application.getUserQueries);


module.exports = router;