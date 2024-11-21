const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/operatorController');

const router = express.Router();

router.post('/register', responseHandler(controller.registerOperatorController));
router.post('/login', responseHandler(controller.loginOperatorController));
router.post('/verifyOtp', responseHandler(controller.verifyOtpController));

module.exports = router;