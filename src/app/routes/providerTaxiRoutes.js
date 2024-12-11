const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/provideTaxiController');
const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/addProviderTaxi', verifyToken, upload.fields([
    { name: "rc_photo", maxCount: 1 },
    { name: "car_photo", maxCount: 1 },
    { name: "carLeftImage", maxCount: 1 },
    { name: "carRigthImage", maxCount: 1 },
    { name: "carBackImage", maxCount: 1 },
    { name: "carFrontImage", maxCount: 1 }
]), responseHandler(controller.addProviderTaxiController));
router.post('/deleteProviderTaxi/:id', verifyToken, responseHandler(controller.deleteProviderTaxiController));
router.get('/providerTaxiList', verifyToken, responseHandler(controller.providerTaxiListController));
router.get('/providerTaxiListAll', verifyToken, responseHandler(controller.providerTaxiListAllController));

module.exports = router;