const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/carController');
// const { upload } = require('../../helpers/multer');

const router = express.Router();

router.post('/addCar', responseHandler(controller.addCarController));
router.post('/updateCarStatus/:id', responseHandler(controller.updateCarStatusController));
router.post('/updateCar/:id', responseHandler(controller.updateCarController));

module.exports = router;