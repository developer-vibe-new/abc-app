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
router.get('/dashboard', auth, authorize(['dashboard']), responseHandler(adminController.dashboardDataController));

// Driver routes
router.get('/viewDriver', auth, authorize(['viewDriver']), responseHandler(driverController.viewDriver));
router.post('/blockDriver', auth, authorize(['blockDriver']), responseHandler(driverController.blockDriver));
router.get('/editDriver/:id', auth, authorize(['editDriver']), responseHandler(driverController.editDriver));
router.post('/updateDriver/:id', auth, authorize(['updateDriver']), upload.single('image'), responseHandler(driverController.updateDriver));
router.get('/getDriverDetails/:id', auth, authorize(['getDriverDetails']), responseHandler(driverController.getDriverDetails));
router.post('/updateDocumentStatus/:id', auth, authorize(['updateDocumentStatus']), responseHandler(driverController.updateDocumentStatusController));

// City routes
router.get('/viewCity', auth, authorize(['viewCity']), responseHandler(stateController.viewCity));
router.post('/updateCityStatus', auth, authorize(['updateCityStatus']), responseHandler(stateController.updateCityStatusController));
router.get('/editCity/:id', auth, authorize(['editCity']), responseHandler(stateController.viewCityByIdController));
router.post('/updateCity/:id', auth, authorize(['updateCity']), responseHandler(stateController.updateCity));
router.post('/deleteCity/:id', auth, authorize(['deleteCity']), responseHandler(stateController.deleteCity));
router.post('/createCity', auth, authorize(['createCity']), responseHandler(stateController.createCity));

// Taxi Type routes
router.post('/addTaxiType', auth, authorize(['addTaxiType']), upload.single('image'), responseHandler(taxiTypeController.addTaxiTypeController));
router.get('/viewTaxiType', auth, authorize(['viewTaxiType']), responseHandler(taxiTypeController.viewTaxiType));
router.post('/updateTaxiOutstationStatus', auth, authorize(['updateTaxiOutstationStatus']), responseHandler(taxiTypeController.updateTaxiTypeOutstationStatusController));
router.post('/updateTaxistatus', auth, authorize(['updateTaxistatus']), responseHandler(taxiTypeController.updateTaxiStatus));
router.get('/editTaxiType/:id', auth, authorize(['editTaxiType']), responseHandler(taxiTypeController.editTaxiTypeController));
router.post('/updateTaxiType/:id', auth, authorize(['updateTaxiType']), upload.single('image'), responseHandler(taxiTypeController.updateTaxiType));

// Operator routes
router.get('/operatorList', auth, authorize(['operatorList']), responseHandler(adminController.operatorListController));
router.post('/operatorsCurrentStatus', auth, authorize(['operatorsCurrentStatus']), responseHandler(adminController.operatorsUpdate));
router.post('/operatorStatus', auth, authorize(['operatorStatus']),  responseHandler(adminController.operatorsUpdateStatusController));
router.get('/getOperatorDetails/:id', auth, authorize(['getOperatorDetails']), responseHandler(adminController.getOperatorDetailsContoller));
router.post('/editOperatorDetails/:id', auth, authorize(['editOperatorDetails']), responseHandler(adminController.editOperatorDetailsController));

// User routes
router.get('/userList', auth, authorize(['userList']), responseHandler(userManController.userListing));
router.post('/updateStatusUser', auth, authorize(['updateStatusUser']), responseHandler(userManController.updateStatusUser));
router.get('/userRideingDetails/:id', auth, authorize(['userRideingDetails']), responseHandler(userManController.userRideingDetails));

// Vehicle routes
router.get('/viewVehicle', auth, authorize(['viewVehicle']), responseHandler(vehicleController.viewVehicle));
router.post('/updateVehicleStatus', auth, authorize(['updateVehicleStatus']), responseHandler(vehicleController.updateVehicleStatusController));
router.get('/vehicleTypeList', auth, authorize(['vehicleTypeList']), responseHandler(vehicleController.vehicleTypeList));
router.post('/createVehicle', auth, authorize(['createVehicle']), responseHandler(vehicleController.createVehicle));
router.get('/editVehicle/:id', auth, authorize(['editVehicle']), responseHandler(vehicleController.editVehicleController));
router.post('/updateVehicle/:id', auth, authorize(['updateVehicle']), responseHandler(vehicleController.updateVehicleController));

router.post('/adminRegister', adminController.registerAdmin);
router.post('/stateCreate', auth, responseHandler(stateController.createState));
router.post('/updateState', auth, responseHandler(stateController.updateState));
router.post('/deleteState/:id', auth, responseHandler(stateController.deleteState));
router.get('/viewState', auth, responseHandler(stateController.viewState));
 
router.post('/createDriver', upload.single('image'), responseHandler(driverController.createDriver));
router.get('/blockedDriversList', auth, responseHandler(driverController.blockedDriversList));
router.get('/onlineDriverList', auth, responseHandler(driverController.onlineDriverList));

// router.post('/deleteDriver/:id', auth, responseHandler(driverController.deleteDriver));
router.get('/editBlockDriver/:id', auth, responseHandler(driverController.editBlockDriver));
router.post('/blockedDriverUpdate/:id', auth, upload.single('image'), responseHandler(driverController.blockedDriverUpdate));
router.post('/unblockDriver', auth, responseHandler(driverController.unblockDriver));
router.get('/taxiTypeDropDown', auth, responseHandler(driverController.taxiTypeDropDown));

router.post('/createRental', auth, responseHandler(rentalController.createRental));
router.get('/veiwRentalData/:id', auth, responseHandler(rentalController.viewRentalDataController));
router.post('/rentalEditData/:id', auth, responseHandler(rentalController.rentalEditData));
router.get('/rentalList', auth, responseHandler(rentalController.rentalListData));

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
