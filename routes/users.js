
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/User.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", User.findAll);
router.get("/:email", User.findByEmail);
router.post("/sign-up", User.create);
router.post("/update/:id", User.update);
router.get("/delete/:id", User.erase);
router.post("/sign-in", User.signIn);

module.exports = router;