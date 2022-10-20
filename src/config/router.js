const express = require('express');

module.exports = (app) => {
  app.use('/auth', app.routes.auth);

  const protectedRoutes = express.Router();

  protectedRoutes.use('/users', app.config.passport.authenticate(), app.routes.users);
  protectedRoutes.use('/accounts', app.config.passport.authenticate(), app.routes.accounts);
  protectedRoutes.use('/transactions', app.config.passport.authenticate(), app.routes.transactions);
  protectedRoutes.use('/transfers', app.config.passport.authenticate(), app.routes.transfers);
  protectedRoutes.use('/balance', app.config.passport.authenticate(), app.routes.balance);

  app.use('/v1', app.config.passport.authenticate(), protectedRoutes);
};
