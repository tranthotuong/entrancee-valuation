'use strict';

module.exports = function(app) {
  let usersController = require('./controllers/UsersController');
  // todoList Routes
  app.route('/users')
    .get(usersController.get);
  app.route('/sign-up')
    .post(usersController.create);

};