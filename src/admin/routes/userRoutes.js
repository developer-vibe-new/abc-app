const express = require('express');
const router = express.Router();
const responseHandler = require('../../helpers/responseHandler');
const controllers = require('../../admin/controllers/userController');
const adminController = require('../../admin/controllers/adminController');
const validate = require('../../helpers/validate');
const userVal = require('../../validators/admin/userVal');
const stateController = require('../../admin/controllers/stateController');
const {auth} = require('../../middleware/authAdmin');
const driverController = require('../../admin/controllers/driverController');

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

router.post('/adminRegister',adminController.registerAdmin);
router.post('/adminlogin', adminController.login);
router.post('/state-create',auth, stateController.createState);
router.post('/update-state',auth, stateController.updateState);
router.post('/delete-State/:id',auth, stateController.deleteState);
router.get('/view-state',auth, stateController.viewState);
router.post('/create-city',auth, stateController.createCity);
router.post('/update-city',auth, stateController.updateCity);
router.post('/delete-city/:id',auth, stateController.deleteCity);
router.get('/view-city',auth, stateController.viewCity);
router.get('/operators',auth, adminController.operators);
router.post('/operatorsUpdate/:id',auth, adminController.operatorsUpdate);
router.post('/createDriver',auth, driverController.createDriver);
router.get('/view-driver',auth,driverController.viewDriver);
router.post('/update-driver/:id',auth, driverController.updateDriver);
router.post('/delete-driver/:id',auth, driverController.deleteDriver);

// Export the router for use in the main application
module.exports = router;
