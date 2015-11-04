var express = require('express');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();


router.get('/', function(req, res, next) {
  require('./frontpage').get(req, res);
});

router.get('/login', function(req, res, next) {
  require('./login').get(req, res);
});

router.post('/login', function(req, res, next) {
  require('./login').post(req, res, next);
});

router.get('/logout', function(req, res, next) {
  require('./logout').post(req, res, next);
});

router.get('/chat', checkAuth, function(req, res, next) {
  require('./chat').get(req, res);
});


module.exports = router;


/* GET home page. */

/*
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', message: 'Привет ≥︺‿︺≤' });
});
*/
