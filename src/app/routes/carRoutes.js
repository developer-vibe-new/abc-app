const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/carController');
// const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/addCar', verifyToken, responseHandler(controller.addCarController));
router.get('/carList', responseHandler(controller.carListcontroller));
router.post('/updateCarStatus/:id', responseHandler(controller.updateCarStatusController));
router.post('/updateCar/:id', responseHandler(controller.updateCarController));

module.exports = router;