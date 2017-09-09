var express = require('express');
var router = express.Router();
var HomeController = require('../controller/fetch.data.controller');

router.get('/home',HomeController.getData);

module.exports = router;