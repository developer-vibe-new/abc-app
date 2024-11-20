const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/userController');

const router = express.Router();

router.post('/sendOtp', responseHandler(controller.sendOtpController));

module.exports = router;