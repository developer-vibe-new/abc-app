const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/carController');
const { upload } = require('../../helpers/multer');

const router = express.Router();

router.post('/addCar', responseHandler(controller.addCarController));

module.exports = router;