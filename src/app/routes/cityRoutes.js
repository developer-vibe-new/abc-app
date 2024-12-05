const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/cityController');

const router = express.Router();

router.get('/getCity', responseHandler(controller.getCityController));

module.exports = router;