const express = require('express');

module.exports = (app) => {
  const router = express.Router();
  router.get('/', (_request, response, next) => {
    app
      .services
      .user
      .findAll()
      .then((users) => response.json(users))
      .catch(next);
  });

  router.post('/', async (request, response, next) => {
    try {
      const result = await app.services.user.save(request.body);
      return response.status(201).json(result[0]);
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
