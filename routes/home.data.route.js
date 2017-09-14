var express = require('express');
var router = express.Router();
var HomeController = require('../controller/fetch.data.controller');

router.get('/home',HomeController.getData);
router.get('/detail',HomeController.fetchDetailData)
router.get('/atlas',HomeController.getGodess);
router.get('/model',HomeController.getModels);


module.exports = router;