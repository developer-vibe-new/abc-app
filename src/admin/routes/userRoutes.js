const express = require('express');
const router = express.Router();
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
// const auth = require('../../middleware/adminAuth');
// const { upload } = require('../../helpers/multer');


router.get('/index', async (req, res) => {
    res.send('admin routes working properly ❤');
});

/* - admin routers - */
router.post('/login', validate(userVal.login), responseHandler(controllers.login));

/**
 * adminRegister
 */

router.post('/adminRegister', adminController.registerAdmin);
router.post('/adminlogin', responseHandler(adminController.login));
router.post('/stateCreate', auth, responseHandler(stateController.createState));
router.post('/updateState', auth, responseHandler(stateController.updateState));
router.post('/deleteState/:id', auth, responseHandler(stateController.deleteState));
router.get('/viewState', auth, responseHandler(stateController.viewState));
router.post('/createCity', auth, responseHandler(stateController.createCity));
router.post('/updateCity', auth, responseHandler(stateController.updateCity));
router.post('/deleteCity/:id', auth, responseHandler(stateController.deleteCity));
router.get('/viewCity', auth, responseHandler(stateController.viewCity));
router.get('/operators', auth, responseHandler(adminController.operators));
router.post('/operatorsUpdate/:id', auth, responseHandler(adminController.operatorsUpdate));
router.post('/createDriver', auth, upload.single('image'), responseHandler(driverController.createDriver));
router.get('/viewDriver', auth, responseHandler(driverController.viewDriver));
router.post('/updateDriver/:id', auth, upload.single('image'), responseHandler(driverController.updateDriver));
router.post('/deleteDriver/:id', auth, responseHandler(driverController.deleteDriver));
router.get('/viewTaxiType', auth, responseHandler(taxiTypeController.viewTaxiType));
router.post('/updateTaxiType/:id', auth, upload.single('image'), responseHandler(taxiTypeController.updateTaxiType));
router.post('/updateTaxistatus', auth, responseHandler(taxiTypeController.updateTaxiStatus));
router.get('/userList', auth, responseHandler(userManController.userListing));
router.post('/updateStatusUser', auth, responseHandler(userManController.updateStatusUser));
router.get('/userRideingDetails/:id', auth, responseHandler(userManController.userRideingDetails));

router.get('/rentalList', auth, responseHandler(rentalController.rentalListData));
router.post('/rentalEditData/:id', auth, responseHandler(rentalController.rentalEditData));
router.post('/createRental', auth, responseHandler(rentalController.createRental));
router.get('/viewVehicle', auth, responseHandler(vehicleController.viewVehicle));
router.get('/vehicleTypeList', auth, responseHandler(vehicleController.vehicleTypeList));
router.post('/createVehicle', auth, responseHandler(vehicleController.createVehicle));
router.get('/viewRideReport', auth, responseHandler(reportController.viewRideReport));

// Export the router for use in the main application
module.exports = router;
