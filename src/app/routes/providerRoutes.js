const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/providerController');
const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/addDriver', verifyToken, responseHandler(controller.addDriverController));
router.get('/driverList', verifyToken, responseHandler(controller.driverListController));
router.post('/updateDriverStatus/:id', verifyToken, responseHandler(controller.updateDriverStatusController));
router.get('/driverBlockList', verifyToken, responseHandler(controller.driverBlockListController));
router.post('/driverOnlineStatus/:id', verifyToken, responseHandler(controller.driverOnlineStatusController));
router.post('/updateDrive/:id', verifyToken, upload.single('image'), responseHandler(controller.updateDriverController));

module.exports = router;