"use strict";

module.exports = function (app) {
  let usersController = require("./controllers/UsersController");
  // todoList Routes
  app.route("/users").get(usersController.get);
  app.route("/sign-up").post(usersController.signUp);
  app.route("/sign-in").post(usersController.signIn);
  app.route("/sign-out").post(usersController.signOut);
  app.route("/refresh-token").post(usersController.refreshToken);
};
