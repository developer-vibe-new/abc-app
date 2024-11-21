const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/taxiTypeController');
const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/addTaxiType', verifyToken, responseHandler(controller.addTaxiTypeController));
router.post('/updateTaxiStatus/:id', verifyToken, responseHandler(controller.updateTaxiStatusController));
router.post('/updateTaxiType/:id', verifyToken, upload.single('icon'), responseHandler(controller.updateTaxiTypeController));

module.exports = router;