const express = require('express');
const router = express.Router();
// const { validate } = require('express-validation');
const responseHandler = require('../../helpers/responseHandler');
const controllers = require('../../admin/controllers/userController');
const adminController = require('../../admin/controllers/adminController');
const validate = require('../../helpers/validate');
const userVal = require('../../validators/admin/userVal');
const { upload } = require('../../helpers/multer');
const stateController = require('../../admin/controllers/stateController');
const { auth } = require('../../middleware/authAdmin');
const driverController = require('../../admin/controllers/driverController');
const taxiTypeController = require('../controllers/taxiTypeController');
const userManController = require('../controllers/userManController');
const rentalController = require('../controllers/rentalController');
const vehicleController = require('../controllers/vehicleController');
const reportController = require('../controllers/reportsController');
const offerCodeController = require('../controllers/offerCodeController');
const subAdminController = require('../controllers/subAdminController');
const notificationController = require('../controllers/notificationController');
const settingController = require('../controllers/settingController');
// const validation = require('../../validators/admin/userVal');

router.get('/index', async (req, res) => {
    res.send('admin routes working properly ❤');
});

/* - admin routers - */
router.post('/adminlogin', responseHandler(adminController.login));
router.post('/changePassword', auth, responseHandler(adminController.changePasswordController));
router.get('/adminAuthCheck', auth, responseHandler(adminController.checkAuth));

/**
 * adminRegister
 */

// Dashboard
router.get('/dashboard', auth, responseHandler(adminController.dashboardDataController));

router.post('/adminRegister', adminController.registerAdmin);
router.post('/stateCreate', auth, responseHandler(stateController.createState));
router.post('/updateState', auth, responseHandler(stateController.updateState));
router.post('/deleteState/:id', auth, responseHandler(stateController.deleteState));
router.get('/viewState', auth, responseHandler(stateController.viewState));
router.post('/createCity', responseHandler(stateController.createCity));
router.post('/updateCity', auth, responseHandler(stateController.updateCity));
router.post('/deleteCity/:id', auth, responseHandler(stateController.deleteCity));
router.get('/viewCity', auth, responseHandler(stateController.viewCity));

// Operator routes
router.get('/operatorList', auth,responseHandler(adminController.operatorListController));
router.post('/operatorsCurrentStatus',auth, responseHandler(adminController.operatorsUpdate));
router.post('/operatorStatus',auth, responseHandler(adminController.operatorsUpdateStatusController));
router.get('/getOperatorDetails/:id',auth,responseHandler(adminController.getOperatorDetailsContoller));
router.post('/editOperatorDetails/:id',auth,responseHandler(adminController.editOperatorDetailsController));

// driver 
router.get('/getDriverDetails/:id',auth,responseHandler(driverController.getDriverDetails));
router.post('/createDriver', auth, upload.single('image'), responseHandler(driverController.createDriver));
router.get('/viewDriver', responseHandler(driverController.viewDriver));
router.get('/editDriver/:id', auth, responseHandler(driverController.editDriver));
router.post('/updateDriver/:id', auth, upload.single('image'), responseHandler(driverController.updateDriver));
router.post('/blockDriver', auth, responseHandler(driverController.blockDriver));
router.get('/blockedDriversList', responseHandler(driverController.blockedDriversList));
router.get('/onlineDriverList', auth, responseHandler(driverController.onlineDriverList));
router.post('/updateDocumentStatus/:id', auth, responseHandler(driverController.updateDocumentStatusController));

// router.post('/deleteDriver/:id', auth, responseHandler(driverController.deleteDriver));
router.get('/editBlockDriver/:id', auth, responseHandler(driverController.editBlockDriver));
router.post('/blockedDriverUpdate/:id', auth, upload.single('image'), responseHandler(driverController.blockedDriverUpdate));
router.post('/unblockDriver', auth, responseHandler(driverController.unblockDriver));
router.get('/taxiTypeDropDown', auth, responseHandler(driverController.taxiTypeDropDown));

// taxitype manger
router.post('/addTaxiType', upload.single('image'), responseHandler(taxiTypeController.addTaxiTypeController));
router.get('/viewTaxiType', auth, responseHandler(taxiTypeController.viewTaxiType));
router.post('/updateTaxiType/:id', auth, upload.single('image'), responseHandler(taxiTypeController.updateTaxiType));
router.post('/updateTaxistatus', auth, responseHandler(taxiTypeController.updateTaxiStatus));

// user
router.get('/userList', responseHandler(userManController.userListing));
router.post('/updateStatusUser', auth, responseHandler(userManController.updateStatusUser));
router.get('/userRideingDetails/:id', auth, responseHandler(userManController.userRideingDetails));

router.post('/updateTaxiOutstationStatus', auth, responseHandler(taxiTypeController.updateTaxiTypeOutstationStatusController));
router.get('/editTaxiType/:id', auth, responseHandler(taxiTypeController.editTaxiTypeController));

router.post('/createRental', auth, responseHandler(rentalController.createRental));
router.get('/veiwRentalData/:id', auth, responseHandler(rentalController.viewRentalDataController));
router.post('/rentalEditData/:id', auth, responseHandler(rentalController.rentalEditData));
router.get('/rentalList', auth, responseHandler(rentalController.rentalListData));
router.get('/viewVehicle', responseHandler(vehicleController.viewVehicle));
router.post('/updateVehicleStatus', auth, responseHandler(vehicleController.updateVehicleStatusController));
router.get('/vehicleTypeList', auth, responseHandler(vehicleController.vehicleTypeList));
router.post('/createVehicle', auth, responseHandler(vehicleController.createVehicle));
router.get('/viewRideReport', auth, responseHandler(reportController.viewRideReport));
router.get('/editVehicle/:id', auth, responseHandler(vehicleController.editVehicleController));
router.post('/updateVehicle/:id', auth, responseHandler(vehicleController.updateVehicleController));

// Offer Code
router.post("/addOfferCode", auth, responseHandler(offerCodeController.addOfferCodeController));
router.get('/viewOfferCode', auth, responseHandler(offerCodeController.viewOfferCodeController));
router.get('/editOfferCode/:id', auth, responseHandler(offerCodeController.getEditOfferCodeController));
router.post('/updateOfferCode/:id', auth, responseHandler(offerCodeController.updateOfferCodeController));

// Sub admin
router.post('/addSubAdmin', auth, responseHandler(subAdminController.addSubAdminController));
router.get('/viewSubAdmin', auth, responseHandler(subAdminController.viewSubAdminController));
router.get('/editSubAdmin/:id', auth, responseHandler(subAdminController.editSubAdminController));
router.post('/updateSubAdmin/:id', auth, responseHandler(subAdminController.updateSubAdminController));
router.post('/deleteSubAdmin', auth, responseHandler(subAdminController.deleteSubAdminController));

// Notification manager
router.post('/addNotification', auth, responseHandler(notificationController.addNotificationController));
router.get("/viewNotification", auth, responseHandler(notificationController.viewNotificationController));
router.post('/deleteNotification', auth, responseHandler(notificationController.deleteNotificationController));

// Setting manager
router.post('/addSetting', auth, responseHandler(settingController.addSettingController));
router.get('/viewSetting', auth, responseHandler(settingController.viewSettingController));
router.post('/updateSetting', auth, responseHandler(settingController.updateSettingController));

// Export the router for use in the main application
module.exports = router;
