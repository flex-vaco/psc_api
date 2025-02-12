const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Category = require('../models/Category.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, Category.findAll);
router.post("/add", verifyToken, Category.create);
router.get("/:category_id", verifyToken, Category.findById);
router.post("/update/:category_id", verifyToken, Category.update);

module.exports = router;