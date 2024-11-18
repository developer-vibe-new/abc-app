const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/providerController');

const router = express.Router();

router.post('/registerOperator', responseHandler(controller.registerOperatorController));
router.post('/loginOperator', responseHandler(controller.loginOperatorController));
router.post('/verifyOtpOperator' , responseHandler(controller.verifyOtpController));

router.post('/addDriver', responseHandler(controller.addDriverController));

module.exports = router;