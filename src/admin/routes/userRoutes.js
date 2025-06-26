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
const { auth, authorize } = require('../../middleware/authAdmin');
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
router.post('/updateAdminCity', auth, responseHandler(adminController.updateAdminCityController));

/**
 * adminRegister
 */

// Dashboard
router.get('/dashboard', auth, responseHandler(adminController.dashboardDataController));

// Driver routes
router.get('/viewDriver', auth, authorize('driverManager', 'viewDriver'), responseHandler(driverController.viewDriver));
router.post('/blockDriver', auth, authorize('driverManager', 'blockDriver'), responseHandler(driverController.blockDriver));
router.get('/editDriver/:id', auth, authorize('driverManager', 'editDriver'), responseHandler(driverController.editDriver));
router.post('/updateDriver/:id', auth, authorize('driverManager', 'updateDriver'), upload.single('image'), responseHandler(driverController.updateDriver));
router.get('/getDriverDetails/:id', auth, authorize('driverManager', 'getDriverDetails'), responseHandler(driverController.getDriverDetails));
router.post('/updateDocumentStatus/:id', auth, authorize('driverManager', 'updateDocumentStatus'), responseHandler(driverController.updateDocumentStatusController));
router.get('/blockedDriversList', auth, authorize('driverManager', 'blockedDriversList'), responseHandler(driverController.blockedDriversList));
router.post('/unblockDriver', auth, authorize('driverManager', 'unblockDriver'), responseHandler(driverController.unblockDriver));
router.get('/onlineDriverList', auth, authorize('driverManager', 'onlineDriverList'), responseHandler(driverController.onlineDriverList));

// City routes
router.get('/viewCity', auth, responseHandler(stateController.viewCity));
router.post('/updateCityStatus', auth, authorize('cityManager', 'updateCityStatus'), responseHandler(stateController.updateCityStatusController));
router.get('/editCity/:id', auth, authorize('cityManager', 'editCity'), responseHandler(stateController.viewCityByIdController));
router.post('/updateCity/:id', auth, authorize('cityManager', 'updateCity'), responseHandler(stateController.updateCity));
router.post('/deleteCity/:id', auth, authorize('cityManager', 'deleteCity'), responseHandler(stateController.deleteCity));
router.post('/createCity', auth, authorize('cityManager', 'createCity'), responseHandler(stateController.createCity));

// Taxi Type routes
router.post('/addTaxiType', auth, authorize('taxiTypeManager', 'addTaxiType'), upload.single('image'), responseHandler(taxiTypeController.addTaxiTypeController));
router.get('/viewTaxiType', auth, authorize('taxiTypeManager', 'viewTaxiType'), responseHandler(taxiTypeController.viewTaxiType));
router.post('/updateTaxiOutstationStatus', auth, authorize('taxiTypeManager', 'updateTaxiOutstationStatus'), responseHandler(taxiTypeController.updateTaxiTypeOutstationStatusController));
router.post('/updateTaxistatus', auth, authorize('taxiTypeManager', 'updateTaxistatus'), responseHandler(taxiTypeController.updateTaxiStatus));
router.get('/editTaxiType/:id', auth, authorize('taxiTypeManager', 'editTaxiType'), responseHandler(taxiTypeController.editTaxiTypeController));
router.post('/updateTaxiType/:id', auth, authorize('taxiTypeManager', 'updateTaxiType'), upload.single('image'), responseHandler(taxiTypeController.updateTaxiType));

// User routes
router.get('/userList', auth, authorize('userManager', 'userList'), responseHandler(userManController.userListing));
router.post('/updateStatusUser', auth, authorize('userManager', 'updateStatusUser'), responseHandler(userManController.updateStatusUser));
router.get('/userRideingDetails/:id', auth, authorize('userManager', 'userRideingDetails'), responseHandler(userManController.userRideingDetails));

// Rental routes
router.post('/createRental', auth, authorize('rentalManager', 'createRental'), responseHandler(rentalController.createRental));
router.get('/rentalList', auth, authorize('rentalManager', 'rentalList'), responseHandler(rentalController.rentalListData));
router.get('/veiwRentalData/:id', auth, authorize('rentalManager', 'veiwRentalData'), responseHandler(rentalController.viewRentalDataController));
router.post('/rentalEditData/:id', auth, authorize('rentalManager', 'rentalEditData'), responseHandler(rentalController.rentalEditData));

// Vehicle routes
router.get('/vehicleTypeList', auth, responseHandler(vehicleController.vehicleTypeList));
router.get('/viewVehicle', auth, authorize('vehicleManager', 'viewVehicle'), responseHandler(vehicleController.viewVehicle));
router.post('/updateVehicleStatus', auth, authorize('vehicleManager', 'updateVehicleStatus'), responseHandler(vehicleController.updateVehicleStatusController));
router.post('/createVehicle', auth, authorize('vehicleManager', 'createVehicle'), responseHandler(vehicleController.createVehicle));
router.get('/editVehicle/:id', auth, authorize('vehicleManager', 'editVehicle'), responseHandler(vehicleController.editVehicleController));
router.post('/updateVehicle/:id', auth, authorize('vehicleManager', 'updateVehicle'), responseHandler(vehicleController.updateVehicleController));

// Offer Code
router.post("/addOfferCode", auth, authorize('offerCodeManager', 'addOfferCode'), responseHandler(offerCodeController.addOfferCodeController));
router.get('/viewOfferCode', auth, authorize('offerCodeManager', 'viewOfferCode'), responseHandler(offerCodeController.viewOfferCodeController));
router.get('/editOfferCode/:id', auth, authorize('offerCodeManager', 'editOfferCode'), authorize(['editOfferCode']), responseHandler(offerCodeController.getEditOfferCodeController));
router.post('/updateOfferCode/:id', auth, authorize('offerCodeManager', 'updateOfferCode'), responseHandler(offerCodeController.updateOfferCodeController));

// Sub admin
router.post('/addSubAdmin', auth, authorize('subAdminManager', 'addSubAdmin'), responseHandler(subAdminController.addSubAdminController));
router.get('/viewSubAdmin', auth, authorize('subAdminManager', 'viewSubAdmin'), responseHandler(subAdminController.viewSubAdminController));
router.get('/editSubAdmin/:id', auth, authorize('subAdminManager', 'editSubAdmin'), responseHandler(subAdminController.editSubAdminController));
router.post('/updateSubAdmin/:id', auth, authorize('subAdminManager', 'updateSubAdmin'), responseHandler(subAdminController.updateSubAdminController));
router.post('/deleteSubAdmin', auth, authorize('subAdminManager', 'deleteSubAdmin'), responseHandler(subAdminController.deleteSubAdminController));
router.post('/updateSubAdminStatus', auth, authorize('subAdminManager', 'updateSubAdminStatus'), responseHandler(subAdminController.updateSubAdminStatusController));

// Operator routes
router.get('/operatorList', auth, authorize('operatorManager', 'operatorList'), responseHandler(adminController.operatorListController));
router.post('/operatorsCurrentStatus', auth, authorize('operatorManager', 'operatorsCurrentStatus'), responseHandler(adminController.operatorsUpdate));
router.post('/operatorStatus', auth, authorize('operatorManager', 'operatorStatus'),  responseHandler(adminController.operatorsUpdateStatusController));
router.get('/getOperatorDetails/:id', auth, authorize('operatorManager', 'getOperatorDetails'), responseHandler(adminController.getOperatorDetailsContoller));
router.post('/editOperatorDetails/:id', auth, authorize('operatorManager', 'editOperatorDetails'), responseHandler(adminController.editOperatorDetailsController));

router.post('/adminRegister', adminController.registerAdmin);
router.post('/stateCreate', auth, responseHandler(stateController.createState));
router.post('/updateState', auth, responseHandler(stateController.updateState));
router.post('/deleteState/:id', auth, responseHandler(stateController.deleteState));
router.get('/viewState', auth, responseHandler(stateController.viewState));

// router.post('/deleteDriver/:id', auth, responseHandler(driverController.deleteDriver));
router.get('/editBlockDriver/:id', auth, responseHandler(driverController.editBlockDriver));
router.post('/blockedDriverUpdate/:id', auth, upload.single('image'), responseHandler(driverController.blockedDriverUpdate));
router.get('/taxiTypeDropDown', auth, responseHandler(driverController.taxiTypeDropDown));




router.get('/viewRideReport', auth, responseHandler(reportController.viewRideReport));

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
