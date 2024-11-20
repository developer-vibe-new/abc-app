const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/providerController');
const { upload } = require('../../helpers/multer');

const router = express.Router();

router.post('/registerOperator', responseHandler(controller.registerOperatorController));
router.post('/loginOperator', responseHandler(controller.loginOperatorController));
router.post('/verifyOtpOperator', responseHandler(controller.verifyOtpController));

router.post('/addDriver', responseHandler(controller.addDriverController));
router.get('/driverList', responseHandler(controller.driverListController));
router.post('/updateDriverStatus/:id', responseHandler(controller.updateDriverStatusController));
router.get('/driverBlockList', responseHandler(controller.driverBlockListController));
router.post('/driverOnlineStatus/:id', responseHandler(controller.driverOnlineStatusController));
router.post('/updateDrive/:id', upload.single('image'), responseHandler(controller.updateDriverController));

module.exports = router;