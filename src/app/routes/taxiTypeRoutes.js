const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/taxiTypeController');

const router = express.Router();

router.post('/addTaxiType', responseHandler(controller.addTaxiTypeController));

module.exports = router;