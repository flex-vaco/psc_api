
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/User.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, User.findAll);
router.get("/:user_id", verifyToken, User.findById);
router.post("/sign-up", User.create);
router.post("/update/:user_id", verifyToken, User.update);
router.get("/delete/:user_id", verifyToken, User.erase);
router.post("/sign-in", User.signIn);
router.post("/roles", verifyToken, User.getUserRoles);
router.post("/resetPassword/:user_id", verifyToken, User.resetPassword);

module.exports = router;