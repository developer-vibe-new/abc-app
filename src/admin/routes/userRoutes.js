const express = require('express');
const router = express.Router();
const responseHandler = require('../../helpers/responseHandler');
const controllers = require('../../admin/controllers/userController');
const adminController = require('../../admin/controllers/adminController');
const validate = require('../../helpers/validate');
const userVal = require('../../validators/admin/userVal');
// const stateController = require('../../admin/controllers/stateController');
const stateController = require('../../admin/controllers/stateController');
const {auth} = require('../../middleware/authAdmin');
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

// Export the router for use in the main application
module.exports = router;
