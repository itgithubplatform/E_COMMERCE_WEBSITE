const express = require("express");

const router = express.Router();

const authControllers = require("../controllers/auth");

router.post("/reset", authControllers.postResetPassword);

router.post("/newpassword", authControllers.postNewPassword);

module.exports = router;