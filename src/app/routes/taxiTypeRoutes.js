const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/taxiTypeController');
const { upload } = require('../../helpers/multer');

const router = express.Router();

router.post('/addTaxiType', responseHandler(controller.addTaxiTypeController));
router.post('/updateTaxiStatus/:id', responseHandler(controller.updateTaxiStatusController));
router.post('/updateTaxiType/:id', upload.single('icon'), responseHandler(controller.updateTaxiTypeController));

module.exports = router;