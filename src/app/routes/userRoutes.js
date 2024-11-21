const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/userController');
const { verifyToken } = require('../../middleware/auth');
const { upload } = require('../../helpers/multer');

const router = express.Router();

router.post('/sendOtp', responseHandler(controller.sendOtpController));
router.post('/verifyOtp', responseHandler(controller.verifyOtpController));
router.post('/updateUser', verifyToken, upload.single('image'), responseHandler(controller.updateUserController));
router.get('/userDetails', verifyToken, responseHandler(controller.userDetailsController));

module.exports = router;