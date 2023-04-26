
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Client = require('../models/Client.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Client.findAll);
router.get("/:client_id", verifyToken, Client.findById);
router.post("/add", verifyToken, Client.create);
router.post("/update/:client_id", verifyToken, Client.update);
router.get("/delete/:client_id", verifyToken, Client.erase);

module.exports = router;