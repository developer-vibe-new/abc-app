const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/operatorController');
const validate = require('../../validators/app/validationMiddleware');

const router = express.Router();

router.post('/register', validate.validateOperator, responseHandler(controller.registerOperatorController));
router.post('/login', validate.validateloginOperator, responseHandler(controller.loginOperatorController));
router.post('/verifyOtp', validate.validateverifyOtpOperator, responseHandler(controller.verifyOtpController));

module.exports = router;