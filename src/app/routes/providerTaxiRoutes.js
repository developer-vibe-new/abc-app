const express = require('express');
const responseHandler = require('../../helpers/responseHandler');
const controller = require('../controllers/provideTaxiController');
const { upload } = require('../../helpers/multer');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/addProviderTaxi', verifyToken, responseHandler(controller.addProviderTaxiController));
router.post('/deleteProviderTaxi', verifyToken, responseHandler(controller.deleteProviderTaxiController));
router.get('/providerTaxiList', verifyToken, responseHandler(controller.providerTaxiListController));
router.get('/providerTaxiListAll', verifyToken, responseHandler(controller.providerTaxiListAllController));
router.post('/assignProvider', verifyToken, responseHandler(controller.assignProviderController));
router.post('/deassignProvider', verifyToken, responseHandler(controller.deassignProviderController));
router.post('/updateDocuments', verifyToken, responseHandler(controller.updateDocumentsController));

module.exports = router;