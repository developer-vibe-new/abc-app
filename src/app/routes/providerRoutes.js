const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/providerController');

const router = express.Router();

router.post('/registerOperator', responseHandler(controller.registerOperatorController));
router.post('/loginOperator', responseHandler(controller.loginOperatorController));

module.exports = router;