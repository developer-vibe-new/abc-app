const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/rideController');
// const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/categoriesPrice', verifyToken, responseHandler(controller.categoriesPrice));
router.post('/list', verifyToken, responseHandler(controller.list));

module.exports = router;