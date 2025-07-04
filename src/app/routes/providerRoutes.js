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
router.post('/driverOnlineStatus', verifyToken, responseHandler(controller.driverOnlineStatusController));
router.post('/updateDrive/:id', verifyToken, upload.single('image'), responseHandler(controller.updateDriverController));
router.post('/deleteDriver', verifyToken, responseHandler(controller.deleteDriverController));
router.post('/uploadDocuments', verifyToken, responseHandler(controller.updateDocumentsController));
router.get('/getDocuments', verifyToken, responseHandler(controller.getDocumentsController));
router.post('/timeFareEstimate', verifyToken, responseHandler(controller.timeFareEstimate));

//otp routes api for  providers
router.post('/register', responseHandler(controller.registerController));
router.post('/login', responseHandler(controller.providerLoginController));
router.post('/verifyOtp', responseHandler(controller.providerOtpVerification));
router.post('/addProviderTaxi', verifyToken, responseHandler(controller.addProviderTaxi));
router.post('/pendingRides', verifyToken, responseHandler(controller.pendingRides));
router.post('/bookedRides', verifyToken, responseHandler(controller.bookedRides));
router.post('/bookRide', verifyToken, responseHandler(controller.bookRide));

module.exports = router;