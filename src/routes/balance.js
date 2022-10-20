/* eslint-disable consistent-return */
const express = require('express');

module.exports = (app) => {
  const router = express.Router();

  router.get('/', async (request, response, next) => {
    try {
      const balance = await app.services.balance.getBalance(request.user.id);
      return response.json(balance);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
